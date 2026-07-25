import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { getActor } from '@/lib/auth-server'
import { canViewQuote } from '@/lib/permissions'
import { effectiveQuoteView } from '@/lib/quote-calc'
import { renderToBuffer } from '@react-pdf/renderer'
import { readFileSync } from 'fs'
import { join } from 'path'
import React from 'react'
import { QuotePDF } from './QuotePDF'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const actor = await getActor()
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const url = new URL(req.url)
  const showHours = url.searchParams.get('show_hours') !== '0'
  const showRate  = url.searchParams.get('show_rate')  !== '0'
  const showMaint = url.searchParams.get('show_maint') !== '0'

  const client = createServiceClient()
  const [quoteRes, itemsRes] = await Promise.all([
    client.from('quotes').select('*').eq('id', id).single(),
    client.from('quote_items').select('*').eq('quote_id', id).order('sort_order'),
  ])

  if (quoteRes.error || !quoteRes.data) {
    return NextResponse.json({ error: 'Quote not found' }, { status: 404 })
  }

  const quote = quoteRes.data
  const items = itemsRes.data ?? []

  // Ownership check (a vendor cannot export another vendor's quote).
  const lead = quote.lead_id
    ? (await client.from('leads').select('assigned_to, created_by').eq('id', quote.lead_id).maybeSingle()).data
    : null
  if (!canViewQuote(actor.role, actor.id, quote, lead)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  // Render from the FROZEN snapshot, never from current pricing settings.
  const view = effectiveQuoteView(quote)

  const logoPath   = join(process.cwd(), 'public', 'brand', 'logo light.png')
  const logoBase64 = `data:image/png;base64,${readFileSync(logoPath).toString('base64')}`

  const element = React.createElement(QuotePDF, {
    logoUrl: logoBase64,
    id:          quote.id,
    title:       quote.title,
    tipo:        quote.tipo,
    product:     quote.product,
    region:      quote.region,
    hourly_rate: view.hourly_rate,
    total_price:      view.total,
    special_discount: quote.special_discount ?? 0,
    maint_month:      view.maint_month,
    notes:            quote.notes ?? null,
    created_at:       quote.created_at ?? null,
    items:            items.map((i: { name: string; size?: string; hours?: number; gift?: boolean; parts?: string[] | null }) => ({
      name:  i.name,
      size:  i.size,
      hours: i.hours,
      gift:  i.gift ?? false,
      parts: i.parts ?? [],
    })),
    currency:    view.currency,
    overhead_pm: view.pm_percentage,
    overhead_qa: view.qa_percentage,
    overhead_cx: view.cx_percentage,
    showHours,
    showRate,
    showMaint,
  })

  const buffer = await renderToBuffer(element)
  const slug   = quote.title.replace(/[^a-z0-9]/gi, '-').toLowerCase().slice(0, 40)

  return new NextResponse(buffer as unknown as BodyInit, {
    status: 200,
    headers: {
      'Content-Type':        'application/pdf',
      'Content-Disposition': `attachment; filename="presupuesto-${slug}.pdf"`,
    },
  })
}

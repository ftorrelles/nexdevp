import { NextRequest, NextResponse } from 'next/server'
import { createAuthServerClient } from '@/lib/supabase-server'
import { createServiceClient } from '@/lib/supabase'
import { renderToBuffer } from '@react-pdf/renderer'
import React from 'react'
import { QuotePDF } from './QuotePDF'

const REGION_CURRENCY: Record<string, string> = { españa: 'EUR', eeuu: 'USD', latam: 'USD' }

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await createAuthServerClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const url = new URL(req.url)
  const showHours = url.searchParams.get('show_hours') !== '0'
  const showRate  = url.searchParams.get('show_rate')  !== '0'

  const client = createServiceClient()
  const [quoteRes, itemsRes, settingsRes] = await Promise.all([
    client.from('quotes').select('*').eq('id', id).single(),
    client.from('quote_items').select('*').eq('quote_id', id).order('sort_order'),
    client.from('pricing_settings').select('*'),
  ])

  if (quoteRes.error || !quoteRes.data) {
    return NextResponse.json({ error: 'Quote not found' }, { status: 404 })
  }

  const quote    = quoteRes.data
  const items    = itemsRes.data ?? []
  const settings = settingsRes.data ?? []
  const ps       = settings.find((s: { region: string }) => s.region === quote.region)
  const currency = REGION_CURRENCY[quote.region] ?? 'EUR'

  const element = React.createElement(QuotePDF, {
    id:          quote.id,
    title:       quote.title,
    tipo:        quote.tipo,
    product:     quote.product,
    region:      quote.region,
    hourly_rate: quote.hourly_rate,
    total_price: quote.total_price,
    maint_month: quote.maint_month,
    notes:       quote.notes ?? null,
    created_at:  quote.created_at ?? null,
    items:       items.map((i: { name: string; size?: string; hours?: number }) => ({
      name:  i.name,
      size:  i.size,
      hours: i.hours,
    })),
    currency,
    overhead_pm: ps?.overhead_pm ?? 0.12,
    overhead_qa: ps?.overhead_qa ?? 0.15,
    overhead_cx: ps?.overhead_cx ?? 0.10,
    showHours,
    showRate,
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

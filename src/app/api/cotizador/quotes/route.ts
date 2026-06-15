import { NextRequest, NextResponse } from 'next/server'
import { createAuthServerClient } from '@/lib/supabase-server'
import { createServiceClient } from '@/lib/supabase'
import type { QuoteItem } from '@/lib/supabase'

function isStaff(role: string | undefined) {
  return ['owner', 'supervisor', 'vendor'].includes(role ?? '')
}

// GET /api/cotizador/quotes?lead_id=xxx — list quotes (optionally filtered by lead)
export async function GET(req: NextRequest): Promise<NextResponse> {
  const supabase = await createAuthServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !isStaff(user.app_metadata?.role)) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 403 })
  }

  const leadId = new URL(req.url).searchParams.get('lead_id')
  const client = createServiceClient()

  let query = client
    .from('quotes')
    .select('id, title, tipo, product, region, status, total_hours, total_price, maint_month, created_at, created_by')
    .order('created_at', { ascending: false })

  if (leadId) query = query.eq('lead_id', leadId)

  const { data, error } = await query

  if (error) {
    console.error('quotes list error:', error)
    return NextResponse.json({ error: 'Error al cargar presupuestos.' }, { status: 500 })
  }

  return NextResponse.json({ quotes: data ?? [] })
}

// POST /api/cotizador/quotes — create quote + items
export async function POST(req: NextRequest): Promise<NextResponse> {
  const supabase = await createAuthServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !isStaff(user.app_metadata?.role)) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 403 })
  }

  const body = await req.json()
  const { items, ...quoteData } = body as { items: QuoteItem[] } & Record<string, unknown>

  const client = createServiceClient()

  const { data: quote, error: quoteError } = await client
    .from('quotes')
    .insert({ ...quoteData, created_by: user.id })
    .select('id')
    .single()

  if (quoteError || !quote) {
    console.error('quote insert error:', quoteError)
    return NextResponse.json({ error: 'Error al guardar el presupuesto.' }, { status: 500 })
  }

  if (items?.length) {
    const rows = items.map((it, idx) => ({
      quote_id:   quote.id,
      catalog_id: it.catalog_id ?? null,
      name:       it.name,
      size:       it.size ?? null,
      hours:      it.hours,
      sort_order: idx,
    }))
    const { error: itemsError } = await client.from('quote_items').insert(rows)
    if (itemsError) {
      console.error('quote_items insert error:', itemsError)
      // Quote was created — return partial success so the UI can navigate
    }
  }

  return NextResponse.json({ id: quote.id }, { status: 201 })
}

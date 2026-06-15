import { NextRequest, NextResponse } from 'next/server'
import { createAuthServerClient } from '@/lib/supabase-server'
import { createServiceClient } from '@/lib/supabase'
import type { QuoteItem } from '@/lib/supabase'

function isStaff(role: string | undefined) {
  return ['owner', 'supervisor', 'vendor'].includes(role ?? '')
}

// GET /api/cotizador/quotes/[id]
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const supabase = await createAuthServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !isStaff(user.app_metadata?.role)) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 403 })
  }

  const { id } = await params
  const client = createServiceClient()

  const [quoteRes, itemsRes] = await Promise.all([
    client.from('quotes').select('*').eq('id', id).single(),
    client.from('quote_items').select('*').eq('quote_id', id).order('sort_order'),
  ])

  if (quoteRes.error || !quoteRes.data) {
    return NextResponse.json({ error: 'Presupuesto no encontrado.' }, { status: 404 })
  }

  return NextResponse.json({ quote: quoteRes.data, items: itemsRes.data ?? [] })
}

// PUT /api/cotizador/quotes/[id] — full replace of quote + items
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const supabase = await createAuthServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !isStaff(user.app_metadata?.role)) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 403 })
  }

  const { id } = await params
  const body = await req.json()
  const { items, ...quoteData } = body as { items: QuoteItem[] } & Record<string, unknown>

  const client = createServiceClient()

  const { error: updateError } = await client
    .from('quotes')
    .update({ ...quoteData, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (updateError) {
    console.error('quote update error:', updateError)
    return NextResponse.json({ error: 'Error al actualizar.' }, { status: 500 })
  }

  // Replace items: delete existing, insert new
  await client.from('quote_items').delete().eq('quote_id', id)

  if (items?.length) {
    const rows = items.map((it, idx) => ({
      quote_id:   id,
      catalog_id: it.catalog_id ?? null,
      name:       it.name,
      size:       it.size ?? null,
      hours:      it.hours,
      sort_order: idx,
    }))
    const { error: itemsError } = await client.from('quote_items').insert(rows)
    if (itemsError) console.error('quote_items replace error:', itemsError)
  }

  return NextResponse.json({ success: true })
}

// DELETE /api/cotizador/quotes/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const supabase = await createAuthServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !isStaff(user.app_metadata?.role)) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 403 })
  }

  const { id } = await params
  const client = createServiceClient()

  const { error } = await client.from('quotes').delete().eq('id', id)
  if (error) {
    console.error('quote delete error:', error)
    return NextResponse.json({ error: 'Error al eliminar.' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

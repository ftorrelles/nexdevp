import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { getActor } from '@/lib/auth-server'
import { canCreateQuote, canSetQuoteStatus, type LeadOwnership } from '@/lib/permissions'
import {
  buildQuoteSnapshot, REGION_CURRENCY, type PricingParams, type SnapshotItemInput,
} from '@/lib/quote-calc'
import { getConfigVersions } from '@/lib/config-version'
import { generateCommissionForQuote } from '@/lib/quote-commission'
import type { QuoteItem, QuoteRegion, QuoteStatus } from '@/lib/supabase'

interface LeadAuthRow extends LeadOwnership { canal: string | null }

async function loadLead(client: ReturnType<typeof createServiceClient>, leadId: string | null) {
  if (!leadId) return null
  const { data } = await client
    .from('leads')
    .select('assigned_to, created_by, canal')
    .eq('id', leadId)
    .maybeSingle()
  return (data as LeadAuthRow) ?? null
}

// GET /api/cotizador/quotes?lead_id=xxx — list quotes (vendors see only their own)
export async function GET(req: NextRequest): Promise<NextResponse> {
  const actor = await getActor()
  if (!actor) return NextResponse.json({ error: 'No autorizado.' }, { status: 403 })

  const leadId = new URL(req.url).searchParams.get('lead_id')
  const client = createServiceClient()

  let query = client
    .from('quotes')
    .select('id, title, tipo, product, region, status, total_hours, total_price, total_snapshot, currency, maint_month, created_at, created_by, lead_id')
    .order('created_at', { ascending: false })

  if (leadId) query = query.eq('lead_id', leadId)

  // Vendors are restricted to quotes they created OR whose lead they own.
  if (actor.role === 'vendor') {
    const { data: ownLeads } = await client
      .from('leads')
      .select('id')
      .or(`assigned_to.eq.${actor.id},created_by.eq.${actor.id}`)
    const leadIds = (ownLeads ?? []).map((l: { id: string }) => l.id)
    const orParts = [`created_by.eq.${actor.id}`]
    if (leadIds.length) orParts.push(`lead_id.in.(${leadIds.join(',')})`)
    query = query.or(orParts.join(','))
  }

  const { data, error } = await query
  if (error) {
    console.error('quotes list error:', error)
    return NextResponse.json({ error: 'Error al cargar presupuestos.' }, { status: 500 })
  }
  return NextResponse.json({ quotes: data ?? [] })
}

// POST /api/cotizador/quotes — create quote + items (with frozen snapshot)
export async function POST(req: NextRequest): Promise<NextResponse> {
  const actor = await getActor()
  if (!actor) return NextResponse.json({ error: 'No autorizado.' }, { status: 403 })

  const body = await req.json()
  const {
    items = [],
    region = 'españa',
    product = '',
    tipo = 'desarrollo',
    title,
    addons = [],
    status = 'draft',
    lead_id = null,
    notes = null,
    hourly_rate,
    commission_type = null,
  } = body as {
    items: QuoteItem[]
    region: QuoteRegion
    product: string
    tipo: string
    title: string
    addons: string[]
    status: QuoteStatus
    lead_id: string | null
    notes: string | null
    hourly_rate?: number
    commission_type?: 'pool' | 'vendor_own' | null
  }

  const client = createServiceClient()
  const lead = await loadLead(client, lead_id)

  // ── Authorization ───────────────────────────────────────────────────────────
  if (!canCreateQuote(actor.role, actor.id, lead)) {
    return NextResponse.json({ error: 'No podés crear presupuestos para este lead.' }, { status: 403 })
  }
  if (!canSetQuoteStatus(actor.role, status)) {
    return NextResponse.json({ error: 'No podés crear un presupuesto ya aceptado.' }, { status: 403 })
  }

  // ── Authoritative pricing params (frozen into the snapshot) ──────────────────
  const { data: ps } = await client
    .from('pricing_settings')
    .select('*')
    .eq('region', region)
    .maybeSingle()

  const params: PricingParams = {
    hourly_rate:      Number(hourly_rate ?? ps?.hourly_rate ?? 0),
    pm_percentage:    Number(ps?.overhead_pm ?? 0.12),
    qa_percentage:    Number(ps?.overhead_qa ?? 0.15),
    cx_percentage:    Number(ps?.overhead_cx ?? 0.10),
    maint_percentage: Number(ps?.maint_rate ?? 0.175),
  }
  const currency = ps?.currency ?? REGION_CURRENCY[region] ?? 'EUR'
  const versions = await getConfigVersions(client)

  const snapItems: SnapshotItemInput[] = (items ?? []).map((it) => ({
    catalog_id:  it.catalog_id ?? null,
    name:        it.name,
    description: it.description ?? null,
    category:    it.category ?? null,
    product:     it.product ?? null,
    parts:       it.parts ?? [],
    requires_client_approval: it.requires_client_approval ?? true,
    size:        it.size ?? null,
    hours:       it.hours,
  }))

  const snapshot = buildQuoteSnapshot({
    region, currency, params,
    items:          snapItems,
    product,
    catalogVersion: versions.catalog_version,
    pricingVersion: versions.pricing_version,
  })

  const nowIso = new Date().toISOString()
  const { data: quote, error: quoteError } = await client
    .from('quotes')
    .insert({
      title:           title || 'Presupuesto',
      region, tipo, product,
      addons:          addons ?? [],
      status,
      lead_id,
      notes,
      commission_type,
      created_by:      actor.id,
      sent_at:         status === 'sent' || status === 'accepted' ? nowIso : null,
      approved_by:     status === 'accepted' ? actor.id : null,
      approved_at:     status === 'accepted' ? nowIso : null,
      ...snapshot,
    })
    .select('id')
    .single()

  if (quoteError || !quote) {
    console.error('quote insert error:', quoteError)
    return NextResponse.json({ error: 'Error al guardar el presupuesto.' }, { status: 500 })
  }

  // Persist items WITH their frozen snapshot fields.
  if (snapshot.selected_items_snapshot.length) {
    const rows = snapshot.selected_items_snapshot.map((it, idx) => ({
      quote_id:         quote.id,
      catalog_id:       it.catalog_id,
      name:             it.name,
      size:             it.size,
      hours:            it.hours,
      description:      it.description,
      category:         it.category,
      product:          it.product ?? null,
      parts:            it.parts ?? [],
      requires_client_approval: it.requires_client_approval ?? true,
      calculated_price: it.calculated_price,
      is_custom:        it.is_custom,
      catalog_version:  it.catalog_version,
      sort_order:       idx,
      gift:             (items[idx]?.gift) ?? false,
    }))
    const { error: itemsError } = await client.from('quote_items').insert(rows)
    if (itemsError) console.error('quote_items insert error:', itemsError)
  }

  if (status === 'accepted') {
    await generateCommissionForQuote(client, quote.id)
  }

  return NextResponse.json({ id: quote.id }, { status: 201 })
}

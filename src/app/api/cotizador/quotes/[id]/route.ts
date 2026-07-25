import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { getActor } from '@/lib/auth-server'
import {
  canViewQuote, canEditQuote, canSetQuoteStatus, canApproveQuote, canRecalculateQuote,
  type LeadOwnership,
} from '@/lib/permissions'
import {
  buildQuoteSnapshot, REGION_CURRENCY, type PricingParams, type SnapshotItemInput,
} from '@/lib/quote-calc'
import { getConfigVersions } from '@/lib/config-version'
import { generateCommissionForQuote, cancelCommissionForQuote } from '@/lib/quote-commission'
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

// GET /api/cotizador/quotes/[id]
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const actor = await getActor()
  if (!actor) return NextResponse.json({ error: 'No autorizado.' }, { status: 403 })

  const { id } = await params
  const client = createServiceClient()

  const [quoteRes, itemsRes] = await Promise.all([
    client.from('quotes').select('*').eq('id', id).single(),
    client.from('quote_items').select('*').eq('quote_id', id).order('sort_order'),
  ])

  if (quoteRes.error || !quoteRes.data) {
    return NextResponse.json({ error: 'Presupuesto no encontrado.' }, { status: 404 })
  }

  const quote = quoteRes.data
  const lead = await loadLead(client, quote.lead_id)
  if (!canViewQuote(actor.role, actor.id, quote, lead)) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 403 })
  }

  return NextResponse.json({ quote, items: itemsRes.data ?? [] })
}

// PUT /api/cotizador/quotes/[id] — update quote + items
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const actor = await getActor()
  if (!actor) return NextResponse.json({ error: 'No autorizado.' }, { status: 403 })

  const { id } = await params
  const body = await req.json()
  const {
    items = [],
    title,
    status,
    notes = null,
    lead_id = null,
    hourly_rate,
    commission_type = null,
    special_discount,
    maint_month,
  } = body as {
    items: QuoteItem[]
    title?: string
    status?: QuoteStatus
    notes?: string | null
    lead_id?: string | null
    hourly_rate?: number
    commission_type?: 'pool' | 'vendor_own' | null
    special_discount?: number
    maint_month?: number | null
  }

  const client = createServiceClient()

  const { data: existing, error: exErr } = await client
    .from('quotes')
    .select('*')
    .eq('id', id)
    .single()
  if (exErr || !existing) {
    return NextResponse.json({ error: 'Presupuesto no encontrado.' }, { status: 404 })
  }

  const lead = await loadLead(client, existing.lead_id ?? lead_id)
  const nextStatus: QuoteStatus = status ?? existing.status

  // ── Authorization ───────────────────────────────────────────────────────────
  if (!canEditQuote(actor.role, actor.id, existing, lead)) {
    return NextResponse.json({ error: 'No autorizado para editar este presupuesto.' }, { status: 403 })
  }
  if (!canSetQuoteStatus(actor.role, nextStatus)) {
    return NextResponse.json({ error: 'No podés marcar este presupuesto como aceptado.' }, { status: 403 })
  }
  const becomingAccepted = nextStatus === 'accepted' && existing.status !== 'accepted'
  if (becomingAccepted && !canApproveQuote(actor.role)) {
    return NextResponse.json({ error: 'Solo un responsable puede aceptar presupuestos.' }, { status: 403 })
  }

  // Base metadata updates (always allowed)
  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }
  if (title !== undefined)           updates.title = title
  if (notes !== undefined)           updates.notes = notes
  if (lead_id !== undefined)         updates.lead_id = lead_id
  if (commission_type !== undefined) updates.commission_type = commission_type
  if (special_discount !== undefined) updates.special_discount = special_discount
  if (maint_month !== undefined)      updates.maint_month = maint_month
  updates.status = nextStatus

  // ── Pricing: recompute ONLY while the quote is a draft. A sent/accepted/
  //    rejected quote is frozen — its snapshot is never recalculated. ──────────
  if (canRecalculateQuote(existing)) {
    const region = existing.region as QuoteRegion
    const { data: ps } = await client
      .from('pricing_settings').select('*').eq('region', region).maybeSingle()

    const params: PricingParams = {
      hourly_rate:      Number(hourly_rate ?? existing.hourly_rate ?? ps?.hourly_rate ?? 0),
      pm_percentage:    Number(ps?.overhead_pm ?? existing.pm_percentage_snapshot ?? 0.12),
      qa_percentage:    Number(ps?.overhead_qa ?? existing.qa_percentage_snapshot ?? 0.15),
      cx_percentage:    Number(ps?.overhead_cx ?? existing.cx_percentage_snapshot ?? 0.10),
      maint_percentage: Number(ps?.maint_rate ?? existing.maint_percentage_snapshot ?? 0.175),
    }
    const currency = ps?.currency ?? existing.currency ?? REGION_CURRENCY[region] ?? 'EUR'
    const versions = await getConfigVersions(client)

    const snapItems: SnapshotItemInput[] = (items ?? []).map((it) => ({
      catalog_id:  it.catalog_id ?? null,
      name:        it.name,
      description: it.description ?? null,
      category:    it.category ?? existing.tipo,
      size:        it.size ?? null,
      hours:       it.hours,
      product:     it.product ?? null,
      parts:       it.parts ?? [],
      gift:        it.gift ?? false,
      requires_client_approval: it.requires_client_approval ?? true,
    }))

    const snapshot = buildQuoteSnapshot({
      region, currency, params,
      items:          snapItems,
      product:        existing.product,
      catalogVersion: versions.catalog_version,
      pricingVersion: versions.pricing_version,
      specialDiscount: special_discount != null ? Number(special_discount) : undefined,
      maintMonthOverride: maint_month == null ? null : Number(maint_month),
    })
    Object.assign(updates, snapshot)

    // Replace items with their frozen snapshot
    await client.from('quote_items').delete().eq('quote_id', id)
    if (snapshot.selected_items_snapshot.length) {
      const rows = snapshot.selected_items_snapshot.map((it, idx) => ({
        quote_id:         id,
        catalog_id:       it.catalog_id,
        name:             it.name,
        size:             it.size,
        hours:            it.hours,
        description:      it.description,
        category:         it.category,
        product:          it.product ?? null,
        parts:            it.parts ?? [],
        gift:             it.gift ?? false,
        requires_client_approval: it.requires_client_approval ?? true,
        calculated_price: it.calculated_price,
        effective_price:  it.effective_price ?? null,
        is_custom:        it.is_custom,
        catalog_version:  it.catalog_version,
        sort_order:       idx,
      }))
      const { error: itemsError } = await client.from('quote_items').insert(rows)
      if (itemsError) console.error('quote_items replace error:', itemsError)
    }
  }

  // ── Status transition side-effects ───────────────────────────────────────────
  if (nextStatus === 'sent' && existing.status !== 'sent' && !existing.sent_at) {
    updates.sent_at = new Date().toISOString()
  }
  if (becomingAccepted) {
    updates.approved_at = new Date().toISOString()
    updates.approved_by = actor.id
    if (!existing.sent_at) updates.sent_at = new Date().toISOString()
  }
  const leavingAccepted = existing.status === 'accepted' && nextStatus !== 'accepted'
  if (leavingAccepted) {
    updates.approved_at = null
    updates.approved_by = null
  }

  const { error: updateError } = await client.from('quotes').update(updates).eq('id', id)
  if (updateError) {
    console.error('quote update error:', updateError)
    return NextResponse.json({ error: 'Error al actualizar.' }, { status: 500 })
  }

  // Commission lifecycle (after the quote row is consistent)
  if (becomingAccepted) await generateCommissionForQuote(client, id)
  if (leavingAccepted)  await cancelCommissionForQuote(client, id)

  return NextResponse.json({ success: true })
}

// DELETE /api/cotizador/quotes/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const actor = await getActor()
  if (!actor) return NextResponse.json({ error: 'No autorizado.' }, { status: 403 })

  const { id } = await params
  const client = createServiceClient()

  const { data: existing } = await client
    .from('quotes').select('created_by, lead_id, status').eq('id', id).maybeSingle()
  if (!existing) return NextResponse.json({ error: 'No encontrado.' }, { status: 404 })

  const lead = await loadLead(client, existing.lead_id)
  // Only owner/supervisor, or the vendor who owns a still-draft quote, may delete.
  if (!canEditQuote(actor.role, actor.id, existing, lead)) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 403 })
  }

  const { error } = await client.from('quotes').delete().eq('id', id)
  if (error) {
    console.error('quote delete error:', error)
    return NextResponse.json({ error: 'Error al eliminar.' }, { status: 500 })
  }
  return NextResponse.json({ success: true })
}

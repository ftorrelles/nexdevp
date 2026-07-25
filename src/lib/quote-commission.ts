// Server-side commission engine. A commission snapshot is minted (or refreshed)
// the moment a quote transitions to 'accepted', freezing the percentage and
// amount so later pricing or rate changes never alter what a vendor is owed.

import type { SupabaseClient } from '@supabase/supabase-js'
import type { CommissionType, LegacyCommissionType } from './supabase'
import { REGION_CURRENCY, effectiveQuoteView } from './quote-calc'
import { loadBudgetSettings, resolveBudgetRates } from './budget'
import type { QuoteRegion } from './supabase'

/**
 * Maps the legacy `quotes.commission_type` ('pool' | 'vendor_own') and/or the
 * lead channel to the canonical commission type used by `quote_commissions`.
 *   own_lead     → vendor brought the lead (canal 'vendedor')  → 20%
 *   nexdevp_pool → company-sourced lead                         → 15%
 */
export function resolveCommissionType(
  legacy: LegacyCommissionType | undefined,
  leadCanal: string | null | undefined,
): CommissionType {
  if (legacy === 'vendor_own') return 'own_lead'
  if (legacy === 'pool') return 'nexdevp_pool'
  return leadCanal === 'vendedor' ? 'own_lead' : 'nexdevp_pool'
}

interface MinimalQuoteRow {
  id:                    string
  lead_id:               string | null
  region:                string
  commission_type:       LegacyCommissionType
  currency?:             string | null
  total_snapshot?:       number | null
  total_price?:          number | null
  calculation_snapshot?: Parameters<typeof effectiveQuoteView>[0]['calculation_snapshot']
}

interface MinimalLeadRow {
  assigned_to: string | null
  created_by:  string | null
  canal:       string | null
}

/**
 * Creates or updates the commission snapshot for an accepted quote.
 * Idempotent: re-accepting reuses the same row (unique on quote_id).
 */
export async function generateCommissionForQuote(
  client: SupabaseClient,
  quoteId: string,
): Promise<{ ok: boolean; error?: string }> {
  const { data: quote, error: qErr } = await client
    .from('quotes')
    .select('id, lead_id, region, commission_type, currency, total_snapshot, total_price, calculation_snapshot')
    .eq('id', quoteId)
    .single()

  if (qErr || !quote) return { ok: false, error: 'quote_not_found' }

  const q = quote as MinimalQuoteRow

  let lead: MinimalLeadRow | null = null
  if (q.lead_id) {
    const { data } = await client
      .from('leads')
      .select('assigned_to, created_by, canal')
      .eq('id', q.lead_id)
      .maybeSingle()
    lead = (data as MinimalLeadRow) ?? null
  }

  const view = effectiveQuoteView({
    region:               q.region as QuoteRegion,
    currency:             q.currency,
    total_price:          q.total_price,
    total_snapshot:       q.total_snapshot,
    calculation_snapshot: q.calculation_snapshot ?? null,
  })

  const commissionType = resolveCommissionType(q.commission_type, lead?.canal)
  // Read from budget_settings so a rate change lands everywhere at once.
  const percentage     = resolveBudgetRates(
    await loadBudgetSettings(client), commissionType,
  ).commission_rate
  const quoteTotal     = view.total
  const amount         = Math.round(quoteTotal * percentage * 100) / 100
  const currency       = q.currency ?? view.currency ?? REGION_CURRENCY[q.region as QuoteRegion] ?? 'EUR'
  const vendorId       = lead?.assigned_to ?? lead?.created_by ?? null

  const { error: upsertErr } = await client
    .from('quote_commissions')
    .upsert({
      quote_id:                       q.id,
      lead_id:                        q.lead_id,
      vendor_id:                      vendorId,
      commission_type:                commissionType,
      commission_percentage_snapshot: percentage,
      quote_total_snapshot:           quoteTotal,
      commission_amount_snapshot:     amount,
      currency,
      status:                         'pending',
    }, { onConflict: 'quote_id' })

  if (upsertErr) {
    console.error('commission upsert error:', upsertErr)
    return { ok: false, error: upsertErr.message }
  }
  return { ok: true }
}

/** Cancels the commission when a quote leaves the 'accepted' state. */
export async function cancelCommissionForQuote(
  client: SupabaseClient,
  quoteId: string,
): Promise<void> {
  const { error } = await client
    .from('quote_commissions')
    .update({ status: 'cancelled' })
    .eq('quote_id', quoteId)
    .neq('status', 'paid') // never silently cancel an already-paid commission
  if (error) console.error('commission cancel error:', error)
}

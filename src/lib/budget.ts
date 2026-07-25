// ─────────────────────────────────────────────────────────────────────────────
// nexdevp — Project budget split
//
// What the client pays for a project is divided three ways:
//
//   contract value
//     ├─ vendor commission   15% pool · 20% own lead
//     ├─ company margin      10%
//     └─ development pool    the remainder, shared across deliverables
//
// The development pool is split by each deliverable's effective_price, which
// already carries every discount, so whoever builds a phase earns exactly that
// phase's weight in the deal.
//
// Rates are frozen onto the project. Raising the company margin next year must
// never rewrite what someone already earned on a finished project.
// ─────────────────────────────────────────────────────────────────────────────

import type { SupabaseClient } from '@supabase/supabase-js'
import type { CommissionType } from './supabase'

export interface BudgetSettings {
  commission_pool_rate:     number
  commission_own_lead_rate: number
  company_margin_rate:      number
}

/** Only used when the settings row cannot be read. The DB is the real source. */
export const DEFAULT_BUDGET_SETTINGS: BudgetSettings = {
  commission_pool_rate:     0.15,
  commission_own_lead_rate: 0.20,
  company_margin_rate:      0.10,
}

/**
 * THE way to read the split rates. Every screen and endpoint that shows or
 * computes money must go through here — these numbers used to be copy-pasted
 * across four files, so changing a percentage meant editing code in each.
 */
export async function loadBudgetSettings(client: SupabaseClient): Promise<BudgetSettings> {
  const { data } = await client
    .from('budget_settings')
    .select('commission_pool_rate, commission_own_lead_rate, company_margin_rate')
    .eq('id', 1)
    .maybeSingle()

  if (!data) return DEFAULT_BUDGET_SETTINGS
  return {
    commission_pool_rate:     Number(data.commission_pool_rate),
    commission_own_lead_rate: Number(data.commission_own_lead_rate),
    company_margin_rate:      Number(data.company_margin_rate),
  }
}

export interface BudgetRates {
  commission_type: CommissionType
  commission_rate: number
  margin_rate:     number
  /** Whatever is left for the people who build it. */
  dev_rate:        number
}

/** Picks the commission rate for how the lead arrived, and derives the pool. */
export function resolveBudgetRates(
  settings: BudgetSettings,
  commissionType: CommissionType,
): BudgetRates {
  const commissionRate = commissionType === 'own_lead'
    ? settings.commission_own_lead_rate
    : settings.commission_pool_rate
  const marginRate = settings.company_margin_rate

  return {
    commission_type: commissionType,
    commission_rate: commissionRate,
    margin_rate:     marginRate,
    // Clamped: a misconfigured pair of rates must not produce a negative pool
    // and quietly turn into a debt to the developers.
    dev_rate:        Math.max(1 - commissionRate - marginRate, 0),
  }
}

export interface BudgetSplit extends BudgetRates {
  contract_value:    number
  commission_amount: number
  margin_amount:     number
  dev_pool:          number
}

export function computeBudgetSplit(contractValue: number, rates: BudgetRates): BudgetSplit {
  const value = Math.max(contractValue, 0)
  const commission = round2(value * rates.commission_rate)
  const margin     = round2(value * rates.margin_rate)
  return {
    ...rates,
    contract_value:    round2(value),
    commission_amount: commission,
    margin_amount:     margin,
    // Taken as the remainder rather than value × dev_rate, so the three parts
    // always add back up to the contract value despite rounding.
    dev_pool:          round2(value - commission - margin),
  }
}

export interface DeliverableLike {
  id?:              string
  name?:            string
  hours?:           number | null
  status?:          string | null
  assigned_to?:     string | null
  effective_price?: number | null
}

export interface DeliverablePayout {
  deliverable_id:  string
  name:            string
  assigned_to:     string | null
  status:          string
  /** Share of the contract value this phase represents. */
  effective_price: number
  /** What the builder earns for it. */
  payout:          number
  /** Approved phases are settled; the rest are still projected. */
  earned:          boolean
}

/**
 * What each deliverable pays its builder.
 *
 * Falls back to splitting by hours when effective_price is missing — projects
 * seeded before per-line pricing existed have no share recorded, and hours are
 * the only weight available.
 */
export function computeDeliverablePayouts(
  deliverables: ReadonlyArray<DeliverableLike>,
  split: BudgetSplit,
): DeliverablePayout[] {
  const hasPrices = deliverables.some(d => (d.effective_price ?? 0) > 0)
  const totalWeight = deliverables.reduce(
    (acc, d) => acc + (hasPrices ? (d.effective_price ?? 0) : (d.hours ?? 0)), 0,
  )

  return deliverables.map(d => {
    const weight = hasPrices ? (d.effective_price ?? 0) : (d.hours ?? 0)
    const share  = totalWeight > 0 ? weight / totalWeight : 0
    return {
      deliverable_id:  d.id ?? '',
      name:            d.name ?? '',
      assigned_to:     d.assigned_to ?? null,
      status:          d.status ?? 'pendiente',
      effective_price: round2(share * split.contract_value),
      payout:          round2(share * split.dev_pool),
      earned:          d.status === 'aprobado',
    }
  })
}

export interface PersonEarnings {
  user_id:   string | null
  earned:    number
  projected: number
  phases:    number
}

/** Groups payouts per person, separating settled work from work still open. */
export function groupEarningsByPerson(payouts: ReadonlyArray<DeliverablePayout>): PersonEarnings[] {
  const map = new Map<string, PersonEarnings>()
  for (const p of payouts) {
    const key = p.assigned_to ?? '__unassigned__'
    const row = map.get(key) ?? { user_id: p.assigned_to, earned: 0, projected: 0, phases: 0 }
    if (p.earned) row.earned += p.payout
    else row.projected += p.payout
    row.phases += 1
    map.set(key, row)
  }
  return [...map.values()]
    .map(r => ({ ...r, earned: round2(r.earned), projected: round2(r.projected) }))
    .sort((a, b) => (b.earned + b.projected) - (a.earned + a.projected))
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

// ─────────────────────────────────────────────────────────────────────────────
// nexdevp — Quote calculation & snapshot engine
//
// THE single source of truth for quote math. Imported by:
//   • the wizard / editor (client) → live preview
//   • the quotes API (server)      → authoritative totals + frozen snapshot
//   • the PDF route (server)        → renders from the frozen snapshot
//
// "Versioning" = when a quote is saved, the server freezes a complete copy of
// every input (rate, percentages, hours, item list, catalog/pricing versions)
// into snapshot columns. Later edits to the catalog or pricing settings can
// never change a stored quote, because reads use the snapshot, not live config.
// ─────────────────────────────────────────────────────────────────────────────

import type {
  QuoteRegion, QuoteSize, QuoteItem, QuoteItemSnapshot, QuoteCalculationSnapshot,
} from './supabase'

/** Discount applied to the subtotal when a quote bundles 2+ products. */
export const BUNDLE_DISCOUNT = 0.10

export const REGION_CURRENCY: Record<QuoteRegion, string> = {
  españa: 'EUR',
  eeuu:   'USD',
  latam:  'USD',
}

export interface PricingParams {
  hourly_rate:      number
  pm_percentage:    number
  qa_percentage:    number
  cx_percentage:    number
  maint_percentage: number
}

export interface QuoteTotals {
  development_hours:  number
  pm_hours:           number
  qa_hours:           number
  contingency_hours:  number
  total_hours:        number
  subtotal:           number   // total_hours × rate, before any discount
  bundle_discount:    number
  special_discount:   number   // manual adjustment to the final client price
  total:              number    // subtotal − bundle − special
  annual_maintenance: number
  maint_month:        number
}

/** Number of products bundled, parsed from the stored "a+b+c" product string. */
export function productCount(product: string): number {
  return product.split('+').filter(Boolean).length
}

export function bundleDiscountRateFor(product: string): number {
  return productCount(product) >= 2 ? BUNDLE_DISCOUNT : 0
}

/**
 * Pure, deterministic quote math. Same inputs → same outputs, forever.
 */
export function computeQuoteTotals(
  items: ReadonlyArray<{ hours?: number | null }>,
  params: PricingParams,
  bundleDiscountRate = 0,
  specialDiscountInput = 0,
): QuoteTotals {
  const developmentHours = items.reduce((acc, i) => acc + (i.hours ?? 0), 0)
  const pmHours          = Math.round(developmentHours * params.pm_percentage)
  const qaHours          = Math.round(developmentHours * params.qa_percentage)
  const contingencyHours = Math.round(developmentHours * params.cx_percentage)
  const totalHours       = developmentHours + pmHours + qaHours + contingencyHours

  const subtotal       = totalHours * params.hourly_rate
  const bundleDiscount = subtotal * bundleDiscountRate
  // Clamped server-side: a manual discount can never exceed what is left after
  // the bundle discount, nor push the total below zero.
  const specialDiscount = Math.min(
    Math.max(specialDiscountInput, 0),
    Math.max(subtotal - bundleDiscount, 0),
  )
  const total = subtotal - bundleDiscount - specialDiscount

  const annualMaintenance = total * params.maint_percentage
  const maintMonth        = annualMaintenance / 12

  return {
    development_hours:  developmentHours,
    pm_hours:           pmHours,
    qa_hours:           qaHours,
    contingency_hours:  contingencyHours,
    total_hours:        totalHours,
    subtotal,
    bundle_discount:    bundleDiscount,
    special_discount:   specialDiscount,
    total,
    annual_maintenance: annualMaintenance,
    maint_month:        maintMonth,
  }
}

export interface SnapshotItemInput {
  catalog_id?:  string | null
  name:         string
  description?: string | null
  category?:    string | null
  size?:        QuoteSize | null
  hours?:       number | null
  /** Product this line belongs to, so multi-product quotes stay grouped. */
  product?:     string | null
  /** What the line includes. Descriptive — it does not split the price. */
  parts?:       string[] | null
  /** Whether the client signs this phase off once it becomes a deliverable. */
  requires_client_approval?: boolean | null
  /** Given away: contributes hours but no revenue, so its share is 0. */
  gift?:        boolean | null
}

/**
 * Builds the immutable per-item snapshot list stored as JSONB on the quote.
 *
 * `calculated_price` is the list price (hours × rate). `effective_price` is the
 * line's share of what the client actually pays: overhead spread over it and
 * every discount already applied. The shares add up to the quote total, so the
 * developer's cut can be derived from a phase without re-deriving the quote.
 */
export function buildItemsSnapshot(
  items: ReadonlyArray<SnapshotItemInput>,
  hourlyRate: number,
  catalogVersion: number,
  finalTotal = 0,
): QuoteItemSnapshot[] {
  const billedHours = items.reduce(
    (acc, i) => acc + (i.gift ? 0 : (i.hours ?? 0)), 0,
  )
  return items.map((it) => ({
    catalog_id:       it.catalog_id ?? null,
    name:             it.name,
    description:      it.description ?? null,
    category:         it.category ?? null,
    product:          it.product ?? null,
    parts:            it.parts ?? [],
    requires_client_approval: it.requires_client_approval ?? true,
    size:             it.size ?? null,
    hours:            it.hours ?? 0,
    gift:             it.gift ?? false,
    calculated_price: (it.hours ?? 0) * hourlyRate,
    effective_price:  it.gift || billedHours === 0
                        ? 0
                        : round2(((it.hours ?? 0) / billedHours) * finalTotal),
    is_custom:        !it.catalog_id,
    catalog_version:  catalogVersion,
  }))
}

export interface BuildSnapshotInput {
  region:          QuoteRegion
  currency:        string
  params:          PricingParams
  items:           ReadonlyArray<SnapshotItemInput>
  product:         string
  catalogVersion:  number
  pricingVersion:  number
  /** Manual reduction of the final client price. Clamped, never trusted raw. */
  specialDiscount?: number
  /**
   * Agreed monthly maintenance. The percentage of the total is only a starting
   * point — what was actually negotiated wins and is what gets stored.
   */
  maintMonthOverride?: number | null
}

export interface QuoteSnapshotColumns {
  currency:                    string
  hourly_rate_snapshot:        number
  pm_percentage_snapshot:      number
  qa_percentage_snapshot:      number
  cx_percentage_snapshot:      number
  maint_percentage_snapshot:   number
  development_hours_snapshot:  number
  pm_hours_snapshot:           number
  qa_hours_snapshot:           number
  contingency_hours_snapshot:  number
  subtotal_snapshot:           number
  total_snapshot:              number
  annual_maintenance_snapshot: number
  special_discount:            number
  catalog_version:             number
  pricing_version:             number
  selected_items_snapshot:     QuoteItemSnapshot[]
  calculation_snapshot:        QuoteCalculationSnapshot
  // Legacy columns kept in sync for backward compatibility
  total_hours:                 number
  total_price:                 number
  maint_month:                 number
  hourly_rate:                 number
}

/**
 * Produces the full set of snapshot columns to persist on a quote. The result
 * is authoritative — computed server-side from trusted pricing params, not from
 * any client-supplied totals.
 */
export function buildQuoteSnapshot(input: BuildSnapshotInput): QuoteSnapshotColumns {
  const bundleRate = bundleDiscountRateFor(input.product)
  const totals     = computeQuoteTotals(input.items, input.params, bundleRate, input.specialDiscount ?? 0)
  const items      = buildItemsSnapshot(
    input.items, input.params.hourly_rate, input.catalogVersion, round2(totals.total),
  )

  const overrideMaint =
    input.maintMonthOverride != null && Number.isFinite(input.maintMonthOverride)
      ? Math.max(input.maintMonthOverride, 0)
      : null
  const maintMonth        = overrideMaint ?? totals.maint_month
  const annualMaintenance = overrideMaint != null ? overrideMaint * 12 : totals.annual_maintenance

  const calculation: QuoteCalculationSnapshot = {
    region:             input.region,
    currency:           input.currency,
    hourly_rate:        input.params.hourly_rate,
    pm_percentage:      input.params.pm_percentage,
    qa_percentage:      input.params.qa_percentage,
    cx_percentage:      input.params.cx_percentage,
    maint_percentage:   input.params.maint_percentage,
    development_hours:  totals.development_hours,
    pm_hours:           totals.pm_hours,
    qa_hours:           totals.qa_hours,
    contingency_hours:  totals.contingency_hours,
    total_hours:        totals.total_hours,
    subtotal:           round2(totals.subtotal),
    bundle_discount:    round2(totals.bundle_discount),
    special_discount:   round2(totals.special_discount),
    total:              round2(totals.total),
    annual_maintenance: round2(annualMaintenance),
    maint_month:        round2(maintMonth),
    catalog_version:    input.catalogVersion,
    pricing_version:    input.pricingVersion,
    calculated_at:      new Date().toISOString(),
  }

  return {
    currency:                    input.currency,
    hourly_rate_snapshot:        input.params.hourly_rate,
    pm_percentage_snapshot:      input.params.pm_percentage,
    qa_percentage_snapshot:      input.params.qa_percentage,
    cx_percentage_snapshot:      input.params.cx_percentage,
    maint_percentage_snapshot:   input.params.maint_percentage,
    development_hours_snapshot:  totals.development_hours,
    pm_hours_snapshot:           totals.pm_hours,
    qa_hours_snapshot:           totals.qa_hours,
    contingency_hours_snapshot:  totals.contingency_hours,
    subtotal_snapshot:           round2(totals.subtotal),
    total_snapshot:              round2(totals.total),
    annual_maintenance_snapshot: round2(annualMaintenance),
    special_discount:            round2(totals.special_discount),
    catalog_version:             input.catalogVersion,
    pricing_version:             input.pricingVersion,
    selected_items_snapshot:     items,
    calculation_snapshot:        calculation,
    // legacy mirrors
    total_hours:                 totals.total_hours,
    total_price:                 round2(totals.total),
    maint_month:                 round2(maintMonth),
    hourly_rate:                 input.params.hourly_rate,
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

/**
 * Reads the effective totals for an EXISTING quote: prefers the frozen
 * calculation snapshot, falling back to legacy columns for pre-versioning
 * quotes. Used by the PDF + dashboard so a historical quote always renders the
 * numbers it was saved with.
 */
export interface EffectiveQuoteView {
  currency:           string
  hourly_rate:        number
  pm_percentage:      number
  qa_percentage:      number
  cx_percentage:      number
  total_hours:        number
  total:              number
  maint_month:        number
  fromSnapshot:       boolean
}

export interface QuoteLike {
  region:                QuoteRegion | string
  currency?:             string | null
  hourly_rate?:          number | null
  hourly_rate_snapshot?: number | null
  total_price?:          number | null
  total_snapshot?:       number | null
  maint_month?:          number | null
  total_hours?:          number | null
  pm_percentage_snapshot?: number | null
  qa_percentage_snapshot?: number | null
  cx_percentage_snapshot?: number | null
  development_hours_snapshot?: number | null
  calculation_snapshot?: QuoteCalculationSnapshot | null
}

export function effectiveQuoteView(
  quote: QuoteLike,
  fallbackOverhead = { pm: 0.12, qa: 0.15, cx: 0.10 },
): EffectiveQuoteView {
  const calc = quote.calculation_snapshot
  if (calc) {
    return {
      currency:      calc.currency,
      hourly_rate:   calc.hourly_rate,
      pm_percentage: calc.pm_percentage,
      qa_percentage: calc.qa_percentage,
      cx_percentage: calc.cx_percentage,
      total_hours:   calc.total_hours,
      total:         calc.total,
      maint_month:   calc.maint_month,
      fromSnapshot:  true,
    }
  }
  // Legacy fallback (pre-versioning quotes)
  const region = quote.region as QuoteRegion
  return {
    currency:      quote.currency ?? REGION_CURRENCY[region] ?? 'EUR',
    hourly_rate:   quote.hourly_rate_snapshot ?? quote.hourly_rate ?? 0,
    pm_percentage: quote.pm_percentage_snapshot ?? fallbackOverhead.pm,
    qa_percentage: quote.qa_percentage_snapshot ?? fallbackOverhead.qa,
    cx_percentage: quote.cx_percentage_snapshot ?? fallbackOverhead.cx,
    total_hours:   quote.total_hours ?? 0,
    total:         quote.total_snapshot ?? quote.total_price ?? 0,
    maint_month:   quote.maint_month ?? 0,
    fromSnapshot:  false,
  }
}

export type { QuoteItem }

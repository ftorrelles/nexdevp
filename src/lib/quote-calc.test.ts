import { describe, it, expect } from 'vitest'
import {
  computeQuoteTotals, buildItemsSnapshot, buildQuoteSnapshot,
  bundleDiscountRateFor, productCount, effectiveQuoteView,
  BUNDLE_DISCOUNT, type PricingParams,
} from './quote-calc'

const params: PricingParams = {
  hourly_rate: 35, pm_percentage: 0.12, qa_percentage: 0.15,
  cx_percentage: 0.10, maint_percentage: 0.175,
}

/** The nexdevp panel itself, the reference the hour scale was calibrated on. */
const items = [
  { name: 'Setup + CI',      hours: 8 },
  { name: 'Modelo de datos', hours: 10 },
  { name: 'Login + roles',   hours: 16 },
  { name: 'Cotizador',       hours: 32 },
  { name: 'Proyectos',       hours: 32 },
  { name: 'Pulido',          hours: 12 },
]

describe('productCount / bundleDiscountRateFor', () => {
  it('reads how many products a stored "a+b+c" string bundles', () => {
    expect(productCount('app-web')).toBe(1)
    expect(productCount('app-web+crm')).toBe(2)
    expect(productCount('')).toBe(0)
  })

  it('only discounts from two products up', () => {
    expect(bundleDiscountRateFor('app-web')).toBe(0)
    expect(bundleDiscountRateFor('app-web+crm')).toBe(BUNDLE_DISCOUNT)
  })
})

describe('computeQuoteTotals', () => {
  it('adds overhead on top of development hours', () => {
    const t = computeQuoteTotals(items, params)
    expect(t.development_hours).toBe(110)
    expect(t.pm_hours).toBe(13)           // 110 × 12%
    expect(t.qa_hours).toBe(17)           // 110 × 15% → 16.5 rounded
    expect(t.contingency_hours).toBe(11)  // 110 × 10%
    expect(t.total_hours).toBe(151)
    expect(t.subtotal).toBe(151 * 35)
  })

  it('leaves the total untouched when there is nothing to discount', () => {
    const t = computeQuoteTotals(items, params)
    expect(t.bundle_discount).toBe(0)
    expect(t.special_discount).toBe(0)
    expect(t.total).toBe(t.subtotal)
  })

  it('applies the bundle discount to the subtotal', () => {
    const t = computeQuoteTotals(items, params, BUNDLE_DISCOUNT)
    expect(t.bundle_discount).toBeCloseTo(t.subtotal * 0.10, 6)
    expect(t.total).toBeCloseTo(t.subtotal * 0.90, 6)
  })

  it('subtracts the special discount after the bundle one', () => {
    const t = computeQuoteTotals(items, params, BUNDLE_DISCOUNT, 500)
    expect(t.special_discount).toBe(500)
    expect(t.total).toBeCloseTo(t.subtotal - t.bundle_discount - 500, 6)
  })

  it('never lets a discount push the total below zero', () => {
    const t = computeQuoteTotals(items, params, 0, 999_999)
    expect(t.total).toBe(0)
    expect(t.special_discount).toBe(t.subtotal)
  })

  it('ignores a negative special discount instead of inflating the price', () => {
    const t = computeQuoteTotals(items, params, 0, -1000)
    expect(t.special_discount).toBe(0)
    expect(t.total).toBe(t.subtotal)
  })

  it('derives maintenance from the discounted total, not the list price', () => {
    const plain     = computeQuoteTotals(items, params)
    const discounted = computeQuoteTotals(items, params, 0, 1000)
    expect(discounted.annual_maintenance).toBeLessThan(plain.annual_maintenance)
    expect(discounted.maint_month).toBeCloseTo(discounted.annual_maintenance / 12, 6)
  })

  it('handles an empty quote without dividing by zero', () => {
    const t = computeQuoteTotals([], params)
    expect(t.total_hours).toBe(0)
    expect(t.total).toBe(0)
    expect(t.maint_month).toBe(0)
  })
})

describe('buildItemsSnapshot — effective_price', () => {
  it('splits the final total across lines in proportion to hours', () => {
    const snap = buildItemsSnapshot(items, 35, 1, 10_000)
    const sum  = snap.reduce((a, i) => a + (i.effective_price ?? 0), 0)
    expect(sum).toBeCloseTo(10_000, 1)
  })

  it('keeps calculated_price as the list price, untouched by discounts', () => {
    const snap = buildItemsSnapshot(items, 35, 1, 1_000)
    // Heavily discounted total, but the list price still reflects hours × rate.
    expect(snap[0].calculated_price).toBe(8 * 35)
    expect(snap[0].effective_price).toBeLessThan(snap[0].calculated_price)
  })

  it('gives a gift no share and excludes it from the split', () => {
    const withGift = [...items, { name: 'Regalo', hours: 20, gift: true }]
    const snap = buildItemsSnapshot(withGift, 35, 1, 10_000)
    const gift = snap.find(i => i.name === 'Regalo')!

    expect(gift.effective_price).toBe(0)
    // The whole total still lands on the billed lines.
    const sum = snap.reduce((a, i) => a + (i.effective_price ?? 0), 0)
    expect(sum).toBeCloseTo(10_000, 1)
  })

  it('does not blow up when every line is a gift', () => {
    const snap = buildItemsSnapshot(
      [{ name: 'Todo gratis', hours: 10, gift: true }], 35, 1, 0,
    )
    expect(snap[0].effective_price).toBe(0)
  })

  it('flags custom lines, which have no catalog row behind them', () => {
    const snap = buildItemsSnapshot(
      [{ name: 'A medida', hours: 5 }, { catalog_id: 'abc', name: 'Del catálogo', hours: 5 }],
      35, 7, 1000,
    )
    expect(snap[0].is_custom).toBe(true)
    expect(snap[1].is_custom).toBe(false)
    expect(snap[1].catalog_version).toBe(7)
  })
})

describe('buildQuoteSnapshot', () => {
  const base = {
    region: 'españa' as const, currency: 'EUR', params, items,
    product: 'app-web', catalogVersion: 1, pricingVersion: 1,
  }

  it('mirrors the legacy columns onto the snapshot ones', () => {
    const s = buildQuoteSnapshot(base)
    expect(s.total_price).toBe(s.total_snapshot)
    expect(s.hourly_rate).toBe(s.hourly_rate_snapshot)
    expect(s.total_hours).toBe(s.calculation_snapshot.total_hours)
  })

  it('persists the special discount instead of storing the list total', () => {
    const s = buildQuoteSnapshot({ ...base, specialDiscount: 1500 })
    expect(s.special_discount).toBe(1500)
    expect(s.total_snapshot).toBeCloseTo(s.subtotal_snapshot - 1500, 2)
  })

  it('applies the bundle discount when the product string carries two', () => {
    const single = buildQuoteSnapshot(base)
    const bundle = buildQuoteSnapshot({ ...base, product: 'app-web+crm' })
    expect(bundle.total_snapshot).toBeLessThan(single.total_snapshot)
    expect(bundle.calculation_snapshot.bundle_discount).toBeGreaterThan(0)
  })

  it('lets an agreed maintenance fee override the percentage', () => {
    const s = buildQuoteSnapshot({ ...base, maintMonthOverride: 200 })
    expect(s.maint_month).toBe(200)
    expect(s.annual_maintenance_snapshot).toBe(2400)
  })

  it('falls back to the percentage when no fee was agreed', () => {
    const s = buildQuoteSnapshot({ ...base, maintMonthOverride: null })
    expect(s.maint_month).toBeCloseTo((s.total_snapshot * 0.175) / 12, 2)
  })

  it('treats a negative agreed fee as zero rather than a credit', () => {
    const s = buildQuoteSnapshot({ ...base, maintMonthOverride: -50 })
    expect(s.maint_month).toBe(0)
  })

  it('freezes the item shares so they add up to the stored total', () => {
    const s = buildQuoteSnapshot({ ...base, specialDiscount: 900 })
    const sum = s.selected_items_snapshot.reduce((a, i) => a + (i.effective_price ?? 0), 0)
    expect(sum).toBeCloseTo(s.total_snapshot, 1)
  })
})

describe('effectiveQuoteView', () => {
  it('prefers the frozen calculation over the live columns', () => {
    const view = effectiveQuoteView({
      region: 'españa',
      total_price: 999,           // stale legacy value
      calculation_snapshot: {
        region: 'españa', currency: 'EUR', hourly_rate: 35,
        pm_percentage: 0.12, qa_percentage: 0.15, cx_percentage: 0.10,
        maint_percentage: 0.175, development_hours: 110, pm_hours: 13,
        qa_hours: 17, contingency_hours: 11, total_hours: 151,
        subtotal: 5285, bundle_discount: 0, total: 5285,
        annual_maintenance: 924.88, maint_month: 77.07,
        catalog_version: 1, pricing_version: 1, calculated_at: '2026-01-01',
      },
    })
    expect(view.fromSnapshot).toBe(true)
    expect(view.total).toBe(5285)
  })

  it('falls back to the legacy columns for quotes saved before versioning', () => {
    const view = effectiveQuoteView({ region: 'eeuu', total_price: 4200, total_hours: 100 })
    expect(view.fromSnapshot).toBe(false)
    expect(view.total).toBe(4200)
    expect(view.currency).toBe('USD')
  })
})

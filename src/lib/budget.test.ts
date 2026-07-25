import { describe, it, expect } from 'vitest'
import {
  resolveBudgetRates, computeBudgetSplit, computeDeliverablePayouts,
  groupEarningsByPerson, DEFAULT_BUDGET_SETTINGS, type BudgetSettings,
} from './budget'

const CONTRACT = 7375

const deliverables = [
  { id: 'a', name: 'Setup',     status: 'aprobado',  hours: 8,  assigned_to: 'dev1', effective_price: 491.67 },
  { id: 'b', name: 'Modelo',    status: 'aprobado',  hours: 10, assigned_to: 'dev1', effective_price: 614.58 },
  { id: 'c', name: 'Login',     status: 'en_curso',  hours: 16, assigned_to: 'dev2', effective_price: 983.33 },
  { id: 'd', name: 'Cotizador', status: 'pendiente', hours: 32, assigned_to: 'dev2', effective_price: 1966.67 },
  { id: 'e', name: 'Proyectos', status: 'pendiente', hours: 32, assigned_to: null,   effective_price: 1966.67 },
  { id: 'f', name: 'Pulido',    status: 'pendiente', hours: 22, assigned_to: 'dev1', effective_price: 1352.08 },
]

describe('resolveBudgetRates', () => {
  it('charges more when the vendor brought the lead', () => {
    const pool = resolveBudgetRates(DEFAULT_BUDGET_SETTINGS, 'nexdevp_pool')
    const own  = resolveBudgetRates(DEFAULT_BUDGET_SETTINGS, 'own_lead')
    expect(pool.commission_rate).toBe(0.15)
    expect(own.commission_rate).toBe(0.20)
    expect(own.dev_rate).toBeLessThan(pool.dev_rate)
  })

  it('leaves the rest for whoever builds it', () => {
    const r = resolveBudgetRates(DEFAULT_BUDGET_SETTINGS, 'nexdevp_pool')
    expect(r.commission_rate + r.margin_rate + r.dev_rate).toBeCloseTo(1, 10)
  })

  it('clamps the pool to zero instead of going negative on impossible rates', () => {
    const broken: BudgetSettings = {
      commission_pool_rate: 0.7, commission_own_lead_rate: 0.7, company_margin_rate: 0.5,
    }
    expect(resolveBudgetRates(broken, 'own_lead').dev_rate).toBe(0)
  })
})

describe('computeBudgetSplit', () => {
  it('divides the contract into commission, margin and pool', () => {
    const split = computeBudgetSplit(CONTRACT, resolveBudgetRates(DEFAULT_BUDGET_SETTINGS, 'nexdevp_pool'))
    expect(split.commission_amount).toBeCloseTo(1106.25, 2)
    expect(split.margin_amount).toBeCloseTo(737.5, 2)
    expect(split.dev_pool).toBeCloseTo(5531.25, 2)
  })

  it('always adds back up to the contract value', () => {
    for (const value of [0, 1, 999.99, 7375, 123456.78]) {
      for (const type of ['nexdevp_pool', 'own_lead'] as const) {
        const split = computeBudgetSplit(value, resolveBudgetRates(DEFAULT_BUDGET_SETTINGS, type))
        const sum = split.commission_amount + split.margin_amount + split.dev_pool
        expect(sum).toBeCloseTo(split.contract_value, 2)
      }
    }
  })

  it('treats a negative contract value as zero', () => {
    const split = computeBudgetSplit(-500, resolveBudgetRates(DEFAULT_BUDGET_SETTINGS, 'own_lead'))
    expect(split.contract_value).toBe(0)
    expect(split.dev_pool).toBe(0)
  })
})

describe('computeDeliverablePayouts', () => {
  const split = computeBudgetSplit(CONTRACT, resolveBudgetRates(DEFAULT_BUDGET_SETTINGS, 'nexdevp_pool'))

  it('distributes exactly the development pool, no more and no less', () => {
    const sum = computeDeliverablePayouts(deliverables, split).reduce((a, p) => a + p.payout, 0)
    expect(sum).toBeCloseTo(split.dev_pool, 1)
  })

  it('pays a phase in proportion to its share of the deal', () => {
    const payouts = computeDeliverablePayouts(deliverables, split)
    const setup     = payouts.find(p => p.name === 'Setup')!
    const cotizador = payouts.find(p => p.name === 'Cotizador')!
    // Cotizador is worth 4× Setup, so it must pay 4× more.
    expect(cotizador.payout / setup.payout).toBeCloseTo(4, 1)
  })

  it('counts only approved phases as earned', () => {
    const payouts = computeDeliverablePayouts(deliverables, split)
    expect(payouts.filter(p => p.earned).map(p => p.name)).toEqual(['Setup', 'Modelo'])
  })

  it('falls back to hours when no line has a recorded share', () => {
    const legacy = deliverables.map(d => ({ ...d, effective_price: null }))
    const sum = computeDeliverablePayouts(legacy, split).reduce((a, p) => a + p.payout, 0)
    expect(sum).toBeCloseTo(split.dev_pool, 1)
  })

  it('pays nothing when a project has no deliverables', () => {
    expect(computeDeliverablePayouts([], split)).toEqual([])
  })

  it('does not divide by zero when every weight is zero', () => {
    const weightless = [{ id: 'x', name: 'Vacío', status: 'pendiente', hours: 0, effective_price: 0 }]
    const payouts = computeDeliverablePayouts(weightless, split)
    expect(payouts[0].payout).toBe(0)
    expect(Number.isNaN(payouts[0].payout)).toBe(false)
  })
})

describe('groupEarningsByPerson', () => {
  const split   = computeBudgetSplit(CONTRACT, resolveBudgetRates(DEFAULT_BUDGET_SETTINGS, 'nexdevp_pool'))
  const payouts = computeDeliverablePayouts(deliverables, split)
  const people  = groupEarningsByPerson(payouts)

  it('keeps settled work apart from work still open', () => {
    const dev1 = people.find(p => p.user_id === 'dev1')!
    const dev2 = people.find(p => p.user_id === 'dev2')!
    expect(dev1.earned).toBeGreaterThan(0)   // Setup + Modelo approved
    expect(dev2.earned).toBe(0)              // nothing approved yet
    expect(dev2.projected).toBeGreaterThan(0)
  })

  it('accounts for unassigned phases instead of dropping their money', () => {
    const orphan = people.find(p => p.user_id === null)
    expect(orphan).toBeDefined()
    expect(orphan!.projected).toBeGreaterThan(0)
  })

  it('adds back up to the pool across everyone', () => {
    const grand = people.reduce((a, p) => a + p.earned + p.projected, 0)
    expect(grand).toBeCloseTo(split.dev_pool, 1)
  })

  it('counts every phase exactly once', () => {
    expect(people.reduce((a, p) => a + p.phases, 0)).toBe(deliverables.length)
  })
})

describe('end to end — a discounted deal', () => {
  it('gives the builders less when the client got a discount', () => {
    const rates = resolveBudgetRates(DEFAULT_BUDGET_SETTINGS, 'nexdevp_pool')
    const full       = computeBudgetSplit(10_000, rates)
    const discounted = computeBudgetSplit(8_000,  rates)

    const fullPay = computeDeliverablePayouts(deliverables, full)
      .reduce((a, p) => a + p.payout, 0)
    const cutPay  = computeDeliverablePayouts(deliverables, discounted)
      .reduce((a, p) => a + p.payout, 0)

    expect(cutPay).toBeLessThan(fullPay)
    expect(cutPay / fullPay).toBeCloseTo(0.8, 2)
  })
})

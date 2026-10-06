import { describe, expect, it } from 'vitest'
import { calculateBudget, calculateFood, calculatePackages, summarizeVisits, USE_CASE_IDS } from './useCaseSimulation'

describe('anonymous use-case simulation', () => {
  it('keeps food production last and four distinct capabilities', () => {
    expect(USE_CASE_IDS).toEqual(['construction', 'education', 'research', 'food'])
  })

  it('distinguishes construction cost, sale and projected result', () => {
    expect(calculateBudget(100)).toEqual({ materials: 400, equipment: 100, labor: 700, total: 1200, sale: 1500, actual: 720, forecast: 180 })
    expect(calculateBudget(150).total).toBe(1800)
    expect(calculateBudget(150).forecast).toBe(270)
  })

  it('bounds invalid quantities and recipe scaling', () => {
    expect(calculateBudget(NaN).total).toBe(1200)
    expect(calculateBudget(-1).total).toBe(120)
    expect(calculateBudget(10000).total).toBe(6000)
    expect(calculateFood(200)).toBe(30)
    expect(calculateFood(Infinity)).toBe(15)
  })

  it('counts saved visits only and derives availability from their observations', () => {
    expect(summarizeVisits([{ saved: true, availability: 'on' }, { saved: false, availability: 'on' }, { saved: true, availability: 'out' }])).toEqual({ completed: 2, pending: 1, onShelf: 1 })
    expect(summarizeVisits([])).toEqual({ completed: 0, pending: 0, onShelf: 0 })
  })

  it('accounts for yield and rounds up whole boxes without accepting invalid waste', () => {
    expect(calculatePackages({ portions: 100, unitsPerServing: 2, unitsPerBox: 20, wastePercent: 30 })).toBe(15)
    expect(calculatePackages({ portions: 100, unitsPerServing: 2, unitsPerBox: 20, wastePercent: 0 })).toBe(10)
    expect(calculatePackages({ portions: 200, unitsPerServing: 2, unitsPerBox: 20, wastePercent: 30 })).toBe(29)
    expect(calculatePackages({ portions: 100, unitsPerServing: 2, unitsPerBox: 20, wastePercent: 100 })).toBe(0)
    expect(calculatePackages({ portions: NaN, unitsPerServing: 2, unitsPerBox: 20, wastePercent: 30 })).toBe(0)
  })
})

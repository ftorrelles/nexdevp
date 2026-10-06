export const USE_CASE_IDS = ['construction', 'education', 'research', 'food'] as const
export type UseCaseId = typeof USE_CASE_IDS[number]
export type Availability = 'on' | 'off' | 'out'

export interface VisitRecord {
  saved: boolean
  availability: Availability
}

export interface BudgetSummary {
  materials: number
  equipment: number
  labor: number
  total: number
  sale: number
  actual: number
  forecast: number
}

export function calculateBudget(area: number): BudgetSummary {
  const safeArea = Number.isFinite(area) ? Math.min(500, Math.max(10, area)) : 100
  return {
    materials: safeArea * 4,
    equipment: safeArea,
    labor: safeArea * 7,
    total: safeArea * 12,
    sale: safeArea * 15,
    actual: safeArea * 7.2,
    forecast: safeArea * 1.8,
  }
}

export function calculateFood(portions: number): number {
  return (Number.isFinite(portions) ? Math.min(1000, Math.max(10, portions)) : 100) * 0.15
}

export interface PackagePlan {
  portions: number
  unitsPerServing: number
  unitsPerBox: number
  wastePercent: number
}

export function calculatePackages(plan: PackagePlan): number {
  const values = Object.values(plan)
  if (values.some((value) => !Number.isFinite(value)) || plan.portions <= 0 || plan.unitsPerServing <= 0 || plan.unitsPerBox <= 0 || plan.wastePercent < 0 || plan.wastePercent >= 100) return 0
  return Math.ceil((plan.portions * plan.unitsPerServing) / (plan.unitsPerBox * (1 - plan.wastePercent / 100)))
}

export function summarizeVisits(records: readonly VisitRecord[]): { completed: number; pending: number; onShelf: number } {
  const completed = records.filter((record) => record.saved)
  return {
    completed: completed.length,
    pending: records.length - completed.length,
    onShelf: completed.filter((record) => record.availability === 'on').length,
  }
}

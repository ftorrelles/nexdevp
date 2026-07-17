import { describe, it, expect } from 'vitest'
import { computeProgressPct } from './projects'

describe('computeProgressPct', () => {
  it('returns 0 when deliverables array is empty', () => {
    expect(computeProgressPct([])).toBe(0)
  })

  it('returns 0 when total hours are 0', () => {
    const items = [
      { hours: 0, status: 'pendiente' },
      { hours: 0, status: 'aprobado' },
    ]
    expect(computeProgressPct(items)).toBe(0)
  })

  it('returns 100 when all hours are approved', () => {
    const items = [
      { hours: 10, status: 'aprobado' },
      { hours: 20, status: 'aprobado' },
    ]
    expect(computeProgressPct(items)).toBe(100)
  })

  it('calculates partial weighted progress correctly', () => {
    // 40h done (aprobado) out of 100h total → 40%
    const items = [
      { hours: 20, status: 'aprobado' },
      { hours: 30, status: 'en_curso' },
      { hours: 20, status: 'pendiente' },
      { hours: 30, status: 'aprobado' },
    ]
    expect(computeProgressPct(items)).toBe(50)
  })

  it('ignores non-aprobado statuses', () => {
    const items = [
      { hours: 25, status: 'aprobado' },
      { hours: 25, status: 'en_revision' },
      { hours: 25, status: 'cambios_solicitados' },
    ]
    // 25h done out of 75h → 33.33 → rounds to 33
    expect(computeProgressPct(items)).toBe(33)
  })

  it('rounds to nearest integer', () => {
    // 1h done out of 3h total → 33.33 → 33
    const items = [
      { hours: 1, status: 'aprobado' },
      { hours: 2, status: 'pendiente' },
    ]
    expect(computeProgressPct(items)).toBe(33)

    // 2h done out of 3h total → 66.66 → 67
    const items2 = [
      { hours: 2, status: 'aprobado' },
      { hours: 1, status: 'pendiente' },
    ]
    expect(computeProgressPct(items2)).toBe(67)
  })
})

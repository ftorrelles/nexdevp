import { describe, it, expect } from 'vitest'
import { resolveCommissionType } from './quote-commission'

// The quotes table still stores the old 'pool' / 'vendor_own' values, while the
// rest of the system speaks 'nexdevp_pool' / 'own_lead'. Every screen that
// shows money goes through this mapping, so it has to be exact.
describe('resolveCommissionType', () => {
  it('maps the legacy column when it is set', () => {
    expect(resolveCommissionType('vendor_own', null)).toBe('own_lead')
    expect(resolveCommissionType('pool', null)).toBe('nexdevp_pool')
  })

  it('lets the legacy column win over the lead channel', () => {
    // Explicitly marked as company-sourced even though a vendor logged it.
    expect(resolveCommissionType('pool', 'vendedor')).toBe('nexdevp_pool')
    expect(resolveCommissionType('vendor_own', 'form')).toBe('own_lead')
  })

  it('falls back to how the lead arrived when the column is empty', () => {
    expect(resolveCommissionType(null, 'vendedor')).toBe('own_lead')
    expect(resolveCommissionType(null, 'form')).toBe('nexdevp_pool')
    expect(resolveCommissionType(undefined, 'whatsapp')).toBe('nexdevp_pool')
  })

  it('defaults to the company pool when nothing is known', () => {
    // The cheaper rate is the safe default: it never overpays by accident.
    expect(resolveCommissionType(null, null)).toBe('nexdevp_pool')
    expect(resolveCommissionType(undefined, undefined)).toBe('nexdevp_pool')
  })
})

import { describe, it, expect } from 'vitest'
import {
  BUSINESS_TYPES,
  HONEYPOT_FIELD,
  MIN_FILL_MS,
  evaluatePublicLead,
  resolveCanal,
} from './lead-validation'
import es from '../../messages/es.json'
import en from '../../messages/en.json'

const HUMAN_MS = 30_000

function body(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    nombre: 'Ana Pérez',
    email: 'ana@empresa.com',
    telefono: '+34 600 000 000',
    tipo_negocio: 'Consultora',
    mensaje: 'Quiero automatizar mi agenda.',
    elapsed_ms: HUMAN_MS,
    ...overrides,
  }
}

function expectInvalid(overrides: Record<string, unknown>): void {
  expect(evaluatePublicLead(body(overrides)).kind).toBe('invalid')
}

describe('evaluatePublicLead — accepted submissions', () => {
  it('accepts a complete valid lead and normalizes it', () => {
    const outcome = evaluatePublicLead(body({ nombre: '  Ana Pérez  ', email: '  ANA@Empresa.COM ' }))
    expect(outcome).toEqual({
      kind: 'valid',
      lead: {
        nombre: 'Ana Pérez',
        email: 'ana@empresa.com',
        telefono: '+34 600 000 000',
        tipo_negocio: 'Consultora',
        mensaje: 'Quiero automatizar mi agenda.',
      },
    })
  })

  it('accepts a minimal lead and turns empty optionals into null', () => {
    const outcome = evaluatePublicLead(
      body({ telefono: '', tipo_negocio: '', mensaje: undefined })
    )
    expect(outcome).toMatchObject({
      kind: 'valid',
      lead: { telefono: null, tipo_negocio: null, mensaje: null },
    })
  })

  it('accepts an empty honeypot', () => {
    expect(evaluatePublicLead(body({ [HONEYPOT_FIELD]: '' })).kind).toBe('valid')
    expect(evaluatePublicLead(body({ [HONEYPOT_FIELD]: '   ' })).kind).toBe('valid')
  })

  it('keeps line breaks in the message but strips NUL characters', () => {
    const outcome = evaluatePublicLead(body({ mensaje: 'linea 1\nlinea\u00002' }))
    expect(outcome).toMatchObject({ kind: 'valid', lead: { mensaje: 'linea 1\nlinea2' } })
  })

  it('accepts boundary lengths', () => {
    expect(evaluatePublicLead(body({ nombre: 'Al' })).kind).toBe('valid')
    expect(evaluatePublicLead(body({ nombre: 'a'.repeat(120) })).kind).toBe('valid')
    expect(evaluatePublicLead(body({ telefono: '1'.repeat(40) })).kind).toBe('valid')
    expect(evaluatePublicLead(body({ mensaje: 'm'.repeat(4000) })).kind).toBe('valid')
  })
})

describe('evaluatePublicLead — validation', () => {
  it('rejects a missing or too short / too long nombre', () => {
    expectInvalid({ nombre: undefined })
    expectInvalid({ nombre: '' })
    expectInvalid({ nombre: 'A' })
    expectInvalid({ nombre: '  A  ' })
    expectInvalid({ nombre: 'a'.repeat(121) })
  })

  it('rejects malformed emails', () => {
    for (const email of ['', 'plain', 'a@b', '@x.com', 'a b@x.com', 'a@@x.com', 'a@x.c']) {
      expectInvalid({ email })
    }
    expectInvalid({ email: undefined })
  })

  it('rejects an email longer than 254 characters', () => {
    expectInvalid({ email: `${'a'.repeat(250)}@x.com` })
  })

  it('rejects over-long telefono and mensaje', () => {
    expectInvalid({ telefono: '1'.repeat(41) })
    expectInvalid({ mensaje: 'm'.repeat(4001) })
  })

  it('rejects tipo_negocio values the form does not offer', () => {
    expectInvalid({ tipo_negocio: 'Minería espacial' })
    expectInvalid({ tipo_negocio: "'; drop table leads; --" })
  })

  it('accepts every tipo_negocio label in both locales', () => {
    for (const tipo of BUSINESS_TYPES) {
      expect(evaluatePublicLead(body({ tipo_negocio: tipo })).kind).toBe('valid')
    }
  })

  it('rejects non-string field values (nested objects, arrays, numbers)', () => {
    expectInvalid({ nombre: { $ne: null } })
    expectInvalid({ email: ['ana@empresa.com'] })
    expectInvalid({ telefono: 600000000 })
    expectInvalid({ mensaje: { text: 'x' } })
    expectInvalid({ tipo_negocio: ['Otro'] })
  })

  it('rejects bodies that are not objects', () => {
    for (const value of [null, undefined, 'lead', 42, [body()]]) {
      expect(evaluatePublicLead(value).kind).toBe('invalid')
    }
  })

  it('offers exactly the tipo_negocio labels the public form renders', () => {
    for (const messages of [es, en]) {
      const labels = Object.entries(messages.contactForm)
        .filter(([key]) => key.startsWith('business_') && key !== 'business_label' && key !== 'business_placeholder')
        .map(([, label]) => label)
      expect(labels.length).toBe(6)
      for (const label of labels) expect(BUSINESS_TYPES).toContain(label)
    }
    expect(BUSINESS_TYPES).toHaveLength(12)
  })
})

describe('evaluatePublicLead — honeypot', () => {
  it('silently accepts (no insert) when the honeypot is filled', () => {
    expect(evaluatePublicLead(body({ [HONEYPOT_FIELD]: 'https://spam.example' }))).toEqual({
      kind: 'silent',
      reason: 'honeypot',
    })
  })

  it('treats a non-string honeypot value as filled', () => {
    expect(evaluatePublicLead(body({ [HONEYPOT_FIELD]: { a: 1 } }))).toEqual({
      kind: 'silent',
      reason: 'honeypot',
    })
    expect(evaluatePublicLead(body({ [HONEYPOT_FIELD]: 1 })).kind).toBe('silent')
  })

  it('does not reveal validation errors to a bot: honeypot wins over invalid fields', () => {
    expect(evaluatePublicLead(body({ [HONEYPOT_FIELD]: 'x', email: 'nope' })).kind).toBe('silent')
  })
})

describe('evaluatePublicLead — time trap', () => {
  it('silently accepts (no insert) when submitted faster than the minimum', () => {
    expect(evaluatePublicLead(body({ elapsed_ms: MIN_FILL_MS - 1 }))).toEqual({
      kind: 'silent',
      reason: 'too_fast',
    })
    expect(evaluatePublicLead(body({ elapsed_ms: 0 })).kind).toBe('silent')
    expect(evaluatePublicLead(body({ elapsed_ms: -5 })).kind).toBe('silent')
  })

  it('accepts at exactly the minimum', () => {
    expect(evaluatePublicLead(body({ elapsed_ms: MIN_FILL_MS })).kind).toBe('valid')
  })

  it('accepts a missing elapsed_ms so a stale tab does not lose its lead', () => {
    expect(evaluatePublicLead(body({ elapsed_ms: undefined })).kind).toBe('valid')
    expect(evaluatePublicLead(body({ elapsed_ms: null })).kind).toBe('valid')
  })

  it('treats a non-numeric elapsed_ms as a bot', () => {
    expect(evaluatePublicLead(body({ elapsed_ms: '30000' })).kind).toBe('silent')
    expect(evaluatePublicLead(body({ elapsed_ms: Number.NaN })).kind).toBe('silent')
  })
})

describe('resolveCanal', () => {
  it('forces "form" for anonymous requests whatever the body claims', () => {
    expect(resolveCanal(false, 'vendedor')).toBe('form')
    expect(resolveCanal(false, 'referral')).toBe('form')
    expect(resolveCanal(false, undefined)).toBe('form')
    expect(resolveCanal(false, { $ne: 'x' })).toBe('form')
  })

  it('keeps staff behaviour: their canal, defaulting to "form"', () => {
    expect(resolveCanal(true, 'vendedor')).toBe('vendedor')
    expect(resolveCanal(true, 'referral')).toBe('referral')
    expect(resolveCanal(true, undefined)).toBe('form')
    expect(resolveCanal(true, '')).toBe('form')
  })
})

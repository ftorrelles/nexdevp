// ─────────────────────────────────────────────────────────────────────────────
// nexdevp — Public lead validation
//
// Rules for POST /api/leads when there is no authenticated actor (the public
// website form). Staff-created leads bypass all of this. Kept pure so the
// route stays thin and every rule is unit-tested.
// ─────────────────────────────────────────────────────────────────────────────

import { cleanText } from './clean-text'

/**
 * Hidden field bots like to fill. Humans never see or reach it. Deliberately not
 * "company…" or "address…": browser autofill would fill those for real users.
 */
export const HONEYPOT_FIELD = 'website_url'

/** A human cannot fill and submit the form faster than this. */
export const MIN_FILL_MS = 2500

/**
 * The business types the public form offers. The <select> submits the visible
 * (translated) label, so both locales are accepted. `messages/*.json` must stay
 * in sync — enforced by lead-validation.test.ts.
 */
export const BUSINESS_TYPES: readonly string[] = [
  // es
  'Clínica / Salud',
  'Distribuidora',
  'Consultora',
  'Retail / Tienda',
  'Restaurante / Catering',
  'Otro',
  // en
  'Clinic / Healthcare',
  'Distributor',
  'Consulting',
  'Retail / Store',
  'Restaurant / Catering',
  'Other',
]

const NOMBRE_MIN = 2
const NOMBRE_MAX = 120
const EMAIL_MAX = 254
const TELEFONO_MAX = 40
const MENSAJE_MAX = 4000
const UNBOUNDED = Number.MAX_SAFE_INTEGER

const EMAIL_FORMAT = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export interface ValidatedLead {
  nombre: string
  email: string
  telefono: string | null
  tipo_negocio: string | null
  mensaje: string | null
}

export type PublicLeadOutcome =
  /** Looks like a bot: answer with a normal success, store and notify nothing. */
  | { kind: 'silent'; reason: 'honeypot' | 'too_fast' }
  | { kind: 'invalid'; error: string }
  | { kind: 'valid'; lead: ValidatedLead }

type FieldResult = { ok: true; value: string | null } | { ok: false }

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** Optional text field: absent/empty → null, non-string or too long → invalid. */
function optionalText(value: unknown, max: number, multiline = false): FieldResult {
  if (value === undefined || value === null) return { ok: true, value: null }
  if (typeof value !== 'string') return { ok: false }
  const cleaned = cleanText(value, UNBOUNDED, multiline)
  if (cleaned.length > max) return { ok: false }
  return { ok: true, value: cleaned || null }
}

function isHoneypotFilled(value: unknown): boolean {
  if (value === undefined || value === null) return false
  return typeof value === 'string' ? value.trim().length > 0 : true
}

function isTooFast(elapsedMs: unknown): boolean {
  // A missing value is accepted: a tab opened before this field existed still runs the old
  // form, and silently dropping a real lead costs more than letting one bot through.
  if (elapsedMs === undefined || elapsedMs === null) return false
  return typeof elapsedMs !== 'number' || !Number.isFinite(elapsedMs) || elapsedMs < MIN_FILL_MS
}

/** Decides what to do with a submission that has no authenticated actor. */
export function evaluatePublicLead(body: unknown): PublicLeadOutcome {
  if (!isRecord(body)) return { kind: 'invalid', error: 'Invalid request body' }

  if (isHoneypotFilled(body[HONEYPOT_FIELD])) return { kind: 'silent', reason: 'honeypot' }
  if (isTooFast(body.elapsed_ms)) return { kind: 'silent', reason: 'too_fast' }

  if (typeof body.nombre !== 'string') return { kind: 'invalid', error: 'nombre is required' }
  const nombre = cleanText(body.nombre, UNBOUNDED)
  if (nombre.length < NOMBRE_MIN || nombre.length > NOMBRE_MAX) {
    return { kind: 'invalid', error: `nombre must be ${NOMBRE_MIN}-${NOMBRE_MAX} characters` }
  }

  if (typeof body.email !== 'string') return { kind: 'invalid', error: 'email is required' }
  const email = cleanText(body.email, UNBOUNDED).toLowerCase()
  if (email.length > EMAIL_MAX || !EMAIL_FORMAT.test(email)) {
    return { kind: 'invalid', error: 'email is not valid' }
  }

  const telefono = optionalText(body.telefono, TELEFONO_MAX)
  if (!telefono.ok) return { kind: 'invalid', error: `telefono must be at most ${TELEFONO_MAX} characters` }

  const mensaje = optionalText(body.mensaje, MENSAJE_MAX, true)
  if (!mensaje.ok) return { kind: 'invalid', error: `mensaje must be at most ${MENSAJE_MAX} characters` }

  const tipo = optionalText(body.tipo_negocio, UNBOUNDED)
  if (!tipo.ok || (tipo.value !== null && !BUSINESS_TYPES.includes(tipo.value))) {
    return { kind: 'invalid', error: 'tipo_negocio is not a valid option' }
  }

  return {
    kind: 'valid',
    lead: {
      nombre,
      email,
      telefono: telefono.value,
      tipo_negocio: tipo.value,
      mensaje: mensaje.value,
    },
  }
}

/**
 * Staff keep today's behaviour (their chosen canal, default 'form'); anonymous
 * submissions can never claim any channel other than the website form.
 */
export function resolveCanal(isStaff: boolean, requested: unknown): string {
  if (!isStaff) return 'form'
  return typeof requested === 'string' && requested ? requested : 'form'
}

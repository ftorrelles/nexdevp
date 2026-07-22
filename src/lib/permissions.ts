// ─────────────────────────────────────────────────────────────────────────────
// nexdevp — Centralized permission matrix
//
// Single source of truth for "who can do what". These are PURE functions with no
// I/O, safe to import from both client components (to hide UI) and server code
// (Server Actions / Route Handlers, where the REAL enforcement must happen).
//
// Rule of thumb: the frontend may use these to hide buttons, but every mutation
// endpoint MUST re-check the same predicate server-side before touching data.
// ─────────────────────────────────────────────────────────────────────────────

import type { UserRole, QuoteStatus } from './supabase'

// Minimal shapes — callers pass only what these functions need, so the matrix
// stays decoupled from the full row types.
export interface LeadOwnership {
  assigned_to?: string | null
  created_by?:  string | null
}

export interface QuoteOwnership {
  status?:     QuoteStatus
  created_by?: string | null
  lead_id?:    string | null
}

const STAFF_ROLES: readonly UserRole[] = ['owner', 'supervisor', 'vendor']

export function isStaff(role: UserRole | string | undefined): role is UserRole {
  return STAFF_ROLES.includes(role as UserRole)
}

/** A vendor "owns" a lead when it is assigned to him OR he created it. */
export function ownsLead(userId: string, lead: LeadOwnership): boolean {
  return lead.assigned_to === userId || lead.created_by === userId
}

// ── Leads ──────────────────────────────────────────────────────────────────────

export function canViewLead(role: UserRole, userId: string, lead: LeadOwnership): boolean {
  if (role === 'owner' || role === 'supervisor') return true
  if (role === 'vendor') return ownsLead(userId, lead)
  return false
}

export function canEditLead(role: UserRole, userId: string, lead: LeadOwnership): boolean {
  // Basic fields (estado, notas, contacto). Reassignment is gated separately.
  if (role === 'owner' || role === 'supervisor') return true
  if (role === 'vendor') return ownsLead(userId, lead)
  return false
}

export function canDeleteLead(role: UserRole): boolean {
  // Only the owner can delete leads — vendors and supervisors never can.
  return role === 'owner'
}

export function canAssignLead(role: UserRole): boolean {
  // Reassigning a lead / changing the assigned vendor is owner-only.
  return role === 'owner'
}

export function canCreateLeadActivity(role: UserRole, userId: string, lead: LeadOwnership): boolean {
  return canViewLead(role, userId, lead)
}

// ── Quotes ───────────────────────────────────────────────────────────────────

export function canCreateQuote(role: UserRole, userId: string, lead: LeadOwnership | null): boolean {
  if (role === 'owner' || role === 'supervisor') return true
  // A vendor can create quotes for his own leads, or standalone (no lead).
  if (role === 'vendor') return lead === null || ownsLead(userId, lead)
  return false
}

export function canViewQuote(
  role: UserRole,
  userId: string,
  quote: QuoteOwnership,
  lead: LeadOwnership | null,
): boolean {
  if (role === 'owner' || role === 'supervisor') return true
  if (role === 'vendor') {
    if (quote.created_by === userId) return true
    return lead !== null && ownsLead(userId, lead)
  }
  return false
}

export function canEditQuote(
  role: UserRole,
  userId: string,
  quote: QuoteOwnership,
  lead: LeadOwnership | null,
): boolean {
  if (role === 'owner' || role === 'supervisor') return true
  if (role === 'vendor') {
    const owns = quote.created_by === userId || (lead !== null && ownsLead(userId, lead))
    // Vendors may only edit their own quotes while still in draft (a sent/
    // accepted/rejected quote is frozen — see canRecalculateQuote).
    return owns && (quote.status ?? 'draft') === 'draft'
  }
  return false
}

/**
 * A quote may be recalculated (price re-derived from items/rate) ONLY while it
 * is a draft. Once sent/accepted/rejected the price is frozen.
 */
export function canRecalculateQuote(quote: QuoteOwnership): boolean {
  return (quote.status ?? 'draft') === 'draft'
}

export function canSendQuote(
  role: UserRole,
  userId: string,
  quote: QuoteOwnership,
  lead: LeadOwnership | null,
): boolean {
  // Sending freezes the price. Owner/supervisor always; vendor on own quotes.
  if (role === 'owner' || role === 'supervisor') return true
  if (role === 'vendor') {
    return quote.created_by === userId || (lead !== null && ownsLead(userId, lead))
  }
  return false
}

export function canApproveQuote(role: UserRole): boolean {
  // Approving / marking a quote as accepted (which mints the commission) is a
  // controlled action — never a self-service vendor action.
  return role === 'owner' || role === 'supervisor'
}

/** Vendors can never flip a quote to 'accepted' themselves. */
export function canSetQuoteStatus(role: UserRole, nextStatus: QuoteStatus): boolean {
  if (role === 'owner' || role === 'supervisor') return true
  if (role === 'vendor') return nextStatus !== 'accepted'
  return false
}

export function canModifyQuotePricing(role: UserRole): boolean {
  // Global pricing: hourly rates, PM/QA/CX percentages, maintenance rate.
  return role === 'owner'
}

export function canModifyCatalog(role: UserRole): boolean {
  return role === 'owner' || role === 'supervisor'
}

// ── Commissions ────────────────────────────────────────────────────────────────

export function canViewCommissions(role: UserRole, userId: string, vendorId: string | null): boolean {
  if (role === 'owner' || role === 'supervisor') return true
  // A vendor can only see his own commissions.
  if (role === 'vendor') return vendorId === userId
  return false
}

export function canManageCommissions(role: UserRole): boolean {
  // Changing commission status (approve/pay/cancel) is owner/supervisor.
  return role === 'owner' || role === 'supervisor'
}

// ── Dashboard / metrics ──────────────────────────────────────────────────────

/** Everyone on staff can see a dashboard; the SCOPE differs (see metricsScope). */
export function canViewBusinessMetrics(role: UserRole): boolean {
  return isStaff(role)
}

/** Owners/supervisors see global metrics; vendors are scoped to themselves. */
export function canViewGlobalMetrics(role: UserRole): boolean {
  return role === 'owner' || role === 'supervisor'
}

export type MetricsScope = 'global' | 'self' | 'none'

export function metricsScope(role: UserRole): MetricsScope {
  if (role === 'owner' || role === 'supervisor') return 'global'
  if (role === 'vendor') return 'self'
  return 'none'
}

// ── Users / roles ────────────────────────────────────────────────────────────

export function canManageUsers(role: UserRole): boolean {
  return role === 'owner'
}

export function canViewApplicants(role: UserRole): boolean {
  // CV downloads / internal applications are never visible to vendors.
  return role === 'owner' || role === 'supervisor'
}

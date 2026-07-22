// ─────────────────────────────────────────────────────────────────────────────
// nexdevp — Business metrics aggregation (server-only)
//
// All revenue/commission figures come from FROZEN snapshots (total_snapshot,
// commission_amount_snapshot), so changing current pricing never alters history.
// Scope:
//   • 'global' (owner/supervisor) → all data, optionally filtered by vendor
//   • 'self'   (vendor)            → only the vendor's own leads/quotes/commissions
// ─────────────────────────────────────────────────────────────────────────────

import type { SupabaseClient } from '@supabase/supabase-js'
import type { MetricsScope } from './permissions'
import type { QuoteStatus } from './supabase'
import { CONTACT_ACTIVITY_TYPES, type LeadActivityType } from './supabase'
import { REGION_CURRENCY } from './quote-calc'
import type { QuoteRegion } from './supabase'

export interface DashboardFilters {
  dateFrom?: string | null
  dateTo?:   string | null
  vendorId?: string | null
  canal?:    string | null
  quoteStatus?: QuoteStatus | null
}

export interface CurrencyAmount { currency: string; amount: number }

export interface VendorMetric {
  vendorId:        string
  email:           string
  leadsAssigned:   number
  quotesGenerated: number
  quotesAccepted:  number
  conversionRate:  number   // quotesAccepted / leadsAssigned
  winRate:         number   // quotesAccepted / quotesGenerated
  revenue:         CurrencyAmount[]
  commissions:     CurrencyAmount[]
}

export interface RecentQuote {
  id:          string
  title:       string
  total:       number
  currency:    string
  created_at:  string
  vendorEmail: string | null
}

export interface DashboardMetrics {
  scope:                 MetricsScope
  leadsTotal:            number
  leadsByChannel:        { canal: string; count: number }[]
  quotesGenerated:       number
  quotesAccepted:        number
  revenueEstimated:      CurrencyAmount[]
  commissionsAccrued:    CurrencyAmount[]
  avgResponseHours:      number | null
  avgQuoteValue:         CurrencyAmount[]
  avgAcceptedQuoteValue: CurrencyAmount[]
  byVendor:              VendorMetric[]
  recentAccepted:        RecentQuote[]
}

interface LeadRow {
  id: string; canal: string | null; assigned_to: string | null
  created_by: string | null; created_at: string; estado: string | null
}
interface QuoteRow {
  id: string; status: QuoteStatus; total_snapshot: number | null; total_price: number | null
  currency: string | null; region: string; created_at: string; lead_id: string | null
  created_by: string | null
}
interface CommissionRow {
  vendor_id: string | null; commission_amount_snapshot: number; currency: string; status: string
}
interface ActivityRow { lead_id: string; type: string; created_at: string }

export interface MetricsOptions {
  scope:        MetricsScope
  userId:       string
  filters:      DashboardFilters
  vendorEmails: Record<string, string>
}

function addAmount(map: Map<string, number>, currency: string, amount: number) {
  map.set(currency, (map.get(currency) ?? 0) + amount)
}
function toCurrencyAmounts(map: Map<string, number>): CurrencyAmount[] {
  return [...map.entries()]
    .map(([currency, amount]) => ({ currency, amount: Math.round(amount * 100) / 100 }))
    .sort((a, b) => b.amount - a.amount)
}
function quoteTotal(q: QuoteRow): number {
  return q.total_snapshot ?? q.total_price ?? 0
}
function quoteCurrency(q: QuoteRow): string {
  return q.currency ?? REGION_CURRENCY[q.region as QuoteRegion] ?? 'EUR'
}

export async function computeDashboardMetrics(
  client: SupabaseClient,
  opts: MetricsOptions,
): Promise<DashboardMetrics> {
  const { scope, userId, filters, vendorEmails } = opts
  const from = filters.dateFrom || null
  const to   = filters.dateTo || null

  // ── Leads ──────────────────────────────────────────────────────────────────
  let leadsQ = client
    .from('leads')
    .select('id, canal, assigned_to, created_by, created_at, estado')
  if (from) leadsQ = leadsQ.gte('created_at', from)
  if (to)   leadsQ = leadsQ.lte('created_at', to)
  if (scope === 'self') leadsQ = leadsQ.or(`assigned_to.eq.${userId},created_by.eq.${userId}`)
  else if (filters.vendorId) leadsQ = leadsQ.or(`assigned_to.eq.${filters.vendorId},created_by.eq.${filters.vendorId}`)
  if (filters.canal) leadsQ = leadsQ.eq('canal', filters.canal)

  const { data: leadsData } = await leadsQ
  const leads = (leadsData ?? []) as LeadRow[]
  const leadById = new Map(leads.map((l) => [l.id, l]))
  const leadVendor = (l: LeadRow): string | null => l.assigned_to ?? l.created_by ?? null

  // ── Quotes ─────────────────────────────────────────────────────────────────
  let quotesQ = client
    .from('quotes')
    .select('id, title, status, total_snapshot, total_price, currency, region, created_at, lead_id, created_by')
  if (from) quotesQ = quotesQ.gte('created_at', from)
  if (to)   quotesQ = quotesQ.lte('created_at', to)
  if (scope === 'self') {
    // Quotes the vendor created OR quotes linked to a lead the vendor owns.
    const ownLeadIds = leads.map((l) => l.id)
    const parts = [`created_by.eq.${userId}`]
    if (ownLeadIds.length) parts.push(`lead_id.in.(${ownLeadIds.join(',')})`)
    quotesQ = quotesQ.or(parts.join(','))
  }
  const { data: quotesData } = await quotesQ
  let quotes = (quotesData ?? []) as (QuoteRow & { title: string })[]

  // Attribute each quote to a vendor (via its lead, falling back to creator).
  const quoteVendor = (q: QuoteRow): string | null => {
    const lead = q.lead_id ? leadById.get(q.lead_id) : null
    if (lead) return leadVendor(lead)
    return q.created_by
  }

  // Apply vendor / canal filters (global scope).
  if (scope === 'global' && filters.vendorId) {
    quotes = quotes.filter((q) => quoteVendor(q) === filters.vendorId)
  }
  if (filters.canal) {
    quotes = quotes.filter((q) => {
      const lead = q.lead_id ? leadById.get(q.lead_id) : null
      return lead?.canal === filters.canal
    })
  }

  const statusFiltered = filters.quoteStatus
    ? quotes.filter((q) => q.status === filters.quoteStatus)
    : quotes
  const acceptedQuotes = quotes.filter((q) => q.status === 'accepted')

  // ── Commissions ──────────────────────────────────────────────────────────────
  let commQ = client
    .from('quote_commissions')
    .select('vendor_id, commission_amount_snapshot, currency, status')
    .neq('status', 'cancelled')
  if (from) commQ = commQ.gte('created_at', from)
  if (to)   commQ = commQ.lte('created_at', to)
  if (scope === 'self') commQ = commQ.eq('vendor_id', userId)
  else if (filters.vendorId) commQ = commQ.eq('vendor_id', filters.vendorId)
  const { data: commData } = await commQ
  const commissions = (commData ?? []) as CommissionRow[]

  // ── Lead activities (first response time) ────────────────────────────────────
  const leadIds = leads.map((l) => l.id)
  let activities: ActivityRow[] = []
  if (leadIds.length) {
    const { data: actData } = await client
      .from('lead_activities')
      .select('lead_id, type, created_at')
      .in('lead_id', leadIds)
      .in('type', CONTACT_ACTIVITY_TYPES as LeadActivityType[])
      .order('created_at', { ascending: true })
    activities = (actData ?? []) as ActivityRow[]
  }
  const firstContact = new Map<string, string>()
  for (const a of activities) {
    if (!firstContact.has(a.lead_id)) firstContact.set(a.lead_id, a.created_at)
  }
  let responseSum = 0, responseCount = 0
  for (const [leadId, contactAt] of firstContact) {
    const lead = leadById.get(leadId)
    if (!lead) continue
    const diffMs = new Date(contactAt).getTime() - new Date(lead.created_at).getTime()
    if (diffMs >= 0) { responseSum += diffMs; responseCount += 1 }
  }
  const avgResponseHours = responseCount > 0
    ? Math.round((responseSum / responseCount / 3_600_000) * 10) / 10
    : null

  // ── Aggregations ─────────────────────────────────────────────────────────────
  const byChannel = new Map<string, number>()
  for (const l of leads) byChannel.set(l.canal ?? 'desconocido', (byChannel.get(l.canal ?? 'desconocido') ?? 0) + 1)

  const revenue = new Map<string, number>()
  for (const q of acceptedQuotes) addAmount(revenue, quoteCurrency(q), quoteTotal(q))

  const commissionsAccrued = new Map<string, number>()
  for (const c of commissions) addAmount(commissionsAccrued, c.currency, c.commission_amount_snapshot)

  const avgValueByCurrency = averageByCurrency(statusFiltered, quoteTotal, quoteCurrency)
  const avgAcceptedByCurrency = averageByCurrency(acceptedQuotes, quoteTotal, quoteCurrency)

  // ── Per-vendor breakdown ─────────────────────────────────────────────────────
  const vendorIds = new Set<string>()
  for (const l of leads) { const v = leadVendor(l); if (v) vendorIds.add(v) }
  for (const q of quotes) { const v = quoteVendor(q); if (v) vendorIds.add(v) }
  for (const c of commissions) { if (c.vendor_id) vendorIds.add(c.vendor_id) }

  const byVendor: VendorMetric[] = [...vendorIds].map((vId) => {
    const vLeads    = leads.filter((l) => leadVendor(l) === vId)
    const vQuotes   = quotes.filter((q) => quoteVendor(q) === vId)
    const vAccepted = vQuotes.filter((q) => q.status === 'accepted')
    const rev = new Map<string, number>()
    for (const q of vAccepted) addAmount(rev, quoteCurrency(q), quoteTotal(q))
    const comm = new Map<string, number>()
    for (const c of commissions.filter((c) => c.vendor_id === vId)) addAmount(comm, c.currency, c.commission_amount_snapshot)
    return {
      vendorId:        vId,
      email:           vendorEmails[vId] ?? vId,
      leadsAssigned:   vLeads.length,
      quotesGenerated: vQuotes.length,
      quotesAccepted:  vAccepted.length,
      conversionRate:  vLeads.length ? vAccepted.length / vLeads.length : 0,
      winRate:         vQuotes.length ? vAccepted.length / vQuotes.length : 0,
      revenue:         toCurrencyAmounts(rev),
      commissions:     toCurrencyAmounts(comm),
    }
  }).sort((a, b) => b.quotesAccepted - a.quotesAccepted)

  const recentAccepted: RecentQuote[] = [...acceptedQuotes]
    .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at))
    .slice(0, 8)
    .map((q) => {
      const v = quoteVendor(q)
      return {
        id: q.id, title: q.title, total: quoteTotal(q), currency: quoteCurrency(q),
        created_at: q.created_at, vendorEmail: v ? (vendorEmails[v] ?? null) : null,
      }
    })

  return {
    scope,
    leadsTotal:            leads.length,
    leadsByChannel:        [...byChannel.entries()].map(([canal, count]) => ({ canal, count })).sort((a, b) => b.count - a.count),
    quotesGenerated:       statusFiltered.length,
    quotesAccepted:        acceptedQuotes.length,
    revenueEstimated:      toCurrencyAmounts(revenue),
    commissionsAccrued:    toCurrencyAmounts(commissionsAccrued),
    avgResponseHours,
    avgQuoteValue:         avgValueByCurrency,
    avgAcceptedQuoteValue: avgAcceptedByCurrency,
    byVendor,
    recentAccepted,
  }
}

function averageByCurrency(
  rows: QuoteRow[],
  amountOf: (q: QuoteRow) => number,
  currencyOf: (q: QuoteRow) => string,
): CurrencyAmount[] {
  const sum = new Map<string, number>()
  const count = new Map<string, number>()
  for (const q of rows) {
    const c = currencyOf(q)
    sum.set(c, (sum.get(c) ?? 0) + amountOf(q))
    count.set(c, (count.get(c) ?? 0) + 1)
  }
  return [...sum.entries()]
    .map(([currency, total]) => ({ currency, amount: Math.round((total / (count.get(currency) || 1)) * 100) / 100 }))
    .sort((a, b) => b.amount - a.amount)
}

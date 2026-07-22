import { createClient, type SupabaseClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Server-side client with service role (for API routes)
export function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export type LeadCanal  = 'form' | 'whatsapp' | 'cal' | 'chatbot' | 'maps' | 'vendedor' | 'referral' | 'outbound'
export type LeadEstado = 'nuevo' | 'contactado' | 'calificado' | 'negociacion' | 'cerrado' | 'perdido'

export interface Lead {
  id?: string
  nombre: string
  email: string
  telefono?: string
  tipo_negocio?: string
  mensaje?: string
  canal?: LeadCanal
  estado?: LeadEstado
  notas?: string
  assigned_to?: string | null
  created_by?: string | null
  created_at?: string
}

// 'applicant' is the self-registered job candidate role. Staff roles
// (owner/supervisor/vendor/developer) are assigned only by an owner. An applicant
// becomes a vendor when hired (see the "Contratar" action).
export type UserRole = 'owner' | 'supervisor' | 'developer' | 'vendor' | 'applicant' | 'client'

// Roles an owner can assign manually from the CRM user manager.
export const STAFF_ROLES: UserRole[] = ['owner', 'supervisor', 'developer', 'vendor']

export interface AdminUser {
  id: string
  email: string
  role: UserRole
  projectName?: string // set for clients — which project they're linked to
}

export interface Career {
  id?: string
  title_es: string
  title_en: string
  department_es: string
  department_en: string
  location_es: string
  location_en: string
  type_es: string
  type_en: string
  description_es: string
  description_en: string
  requirements_es?: string
  requirements_en?: string
  responsibilities_es?: string
  responsibilities_en?: string
  active?: boolean
  created_at?: string
}

export interface Project {
  id?: string
  lead_id: string
  quote_id?: string | null
  name: string
  status?: 'activo' | 'pausado' | 'entregado' | 'cerrado'
  vercel_url?: string | null
  client_user_id?: string | null
  created_by?: string | null
  created_at?: string
  updated_at?: string
  deliverables?: ProjectDeliverable[]
}

export interface ProjectDeliverable {
  id?: string
  project_id: string
  name: string
  hours?: number
  status?: 'pendiente' | 'en_curso' | 'en_revision' | 'aprobado' | 'cambios_solicitados'
  assigned_to?: string | null
  seeded_from_quote_item_id?: string | null
  sort_order?: number
  created_at?: string
  updated_at?: string
}

export interface BriefTemplate {
  id: string
  name: string
  description: string | null
  created_by: string | null
  created_at: string
}

export interface BriefTemplateQuestion {
  id: string
  template_id: string
  label: string
  description: string | null
  field_type: 'text' | 'textarea' | 'url' | 'image' | 'image_multi' | 'boolean'
  sort_order: number
  required: boolean
  created_at: string
}

export interface ProjectBrief {
  id: string
  project_id: string
  template_id: string | null
  status: 'draft' | 'sent' | 'completed'
  sent_at: string | null
  completed_at: string | null
  created_at: string
}

export interface ProjectBriefQuestion {
  id: string
  brief_id: string
  label: string
  description: string | null
  field_type: 'text' | 'textarea' | 'url' | 'image' | 'image_multi' | 'boolean'
  sort_order: number
  required: boolean
  from_template_question_id: string | null
}

export interface ProjectBriefAnswer {
  id: string
  brief_question_id: string
  value: string | null
  file_path: string | null
  answered_at: string
}

export interface CareerApplication {
  id?: string
  career_id: string
  user_id?: string | null
  handled_by?: string | null // staff member (owner/supervisor) handling it
  handled_by_email?: string | null // resolved for display only (not a column)
  nombre: string
  email: string
  telefono?: string
  mensaje?: string
  red_ventas?: 'red' | 'experiencia' | 'principiante' | null
  cv_url: string // storage object path (resolved to a signed URL for reads)
  estado?: 'nuevo' | 'revisado' | 'aceptado' | 'rechazado'
  created_at?: string
  careers?: {
    title_es: string
    title_en: string
  }
}

// ── Cotizador ────────────────────────────────────────────────────────────────

export type QuoteRegion = 'españa' | 'eeuu' | 'latam'
export type QuoteTipo   = 'desarrollo' | 'marketing' | 'chatbot'
export type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'rejected'
export type QuoteSize   = 'S' | 'M' | 'L' | 'XL'

export interface PricingSettings {
  region:      QuoteRegion
  currency:    string
  hourly_rate: number
  overhead_pm: number
  overhead_qa: number
  overhead_cx: number
  maint_rate:  number
}

export interface QuoteSizeMap {
  size:        QuoteSize
  hours:       number
  description: string
}

export interface QuoteCatalogItem {
  id:         string
  category:   string
  size:       QuoteSize
  name:       string
  sort_order: number
}

export interface QuoteItem {
  id?:        string
  catalog_id: string | null
  name:       string
  size:       QuoteSize | null
  hours:      number
  sort_order: number
  gift?:      boolean
  // Snapshot fields (frozen at save time, independent of catalog edits)
  description?:      string | null
  category?:         string | null
  calculated_price?: number | null
  is_custom?:        boolean
  catalog_version?:  number | null
}

// How the vendor's commission for a quote is classified.
//  nexdevp_pool → lead came from the company pool (15%)
//  own_lead     → vendor brought the lead himself  (20%)
export type CommissionType   = 'nexdevp_pool' | 'own_lead'
export type CommissionStatus = 'pending' | 'approved' | 'paid' | 'cancelled'

// Legacy column still stored on `quotes` (kept for backward compatibility).
export type LegacyCommissionType = 'pool' | 'vendor_own' | null

export const COMMISSION_PERCENTAGE: Record<CommissionType, number> = {
  nexdevp_pool: 0.15,
  own_lead:     0.20,
}

export interface Quote {
  id?:         string
  lead_id?:    string | null
  title:       string
  region:      QuoteRegion
  hourly_rate: number
  tipo:        QuoteTipo
  product:     string
  addons:      string[]
  status:      QuoteStatus
  total_hours: number
  total_price: number
  maint_month: number
  notes?:      string
  created_by?: string
  created_at?: string
  items?:      QuoteItem[]

  // ── Versioning snapshot (see src/lib/quote-calc.ts) ──────────────────────────
  catalog_version?:             number | null
  pricing_version?:             number | null
  currency?:                    string | null
  hourly_rate_snapshot?:        number | null
  pm_percentage_snapshot?:      number | null
  qa_percentage_snapshot?:      number | null
  cx_percentage_snapshot?:      number | null
  maint_percentage_snapshot?:   number | null
  development_hours_snapshot?:  number | null
  pm_hours_snapshot?:           number | null
  qa_hours_snapshot?:           number | null
  contingency_hours_snapshot?:  number | null
  subtotal_snapshot?:           number | null
  total_snapshot?:              number | null
  annual_maintenance_snapshot?: number | null
  selected_items_snapshot?:     QuoteItemSnapshot[] | null
  calculation_snapshot?:        QuoteCalculationSnapshot | null
  commission_type?:             LegacyCommissionType
  approved_by?:                 string | null
  approved_at?:                 string | null
  sent_at?:                     string | null
}

// Immutable copy of each selected line item, stored on the quote as JSONB.
export interface QuoteItemSnapshot {
  catalog_id:       string | null
  name:             string
  description:      string | null
  category:         string | null
  size:             QuoteSize | null
  hours:            number
  calculated_price: number
  is_custom:        boolean
  catalog_version:  number | null
}

// Full math trace stored on the quote as JSONB (calculation_snapshot).
export interface QuoteCalculationSnapshot {
  region:             QuoteRegion
  currency:           string
  hourly_rate:        number
  pm_percentage:      number
  qa_percentage:      number
  cx_percentage:      number
  maint_percentage:   number
  development_hours:  number
  pm_hours:           number
  qa_hours:           number
  contingency_hours:  number
  total_hours:        number
  subtotal:           number
  bundle_discount:    number
  total:              number
  annual_maintenance: number
  maint_month:        number
  catalog_version:    number
  pricing_version:    number
  calculated_at:      string
}

// ── lead_activities ────────────────────────────────────────────────────────────
export type LeadActivityType =
  | 'note' | 'contacted' | 'call' | 'whatsapp' | 'email' | 'status_change' | 'quote_sent'

// Activity types that count as a "first response" for the response-time metric.
export const CONTACT_ACTIVITY_TYPES: LeadActivityType[] = ['contacted', 'call', 'whatsapp', 'email']

export interface LeadActivity {
  id?:        string
  lead_id:    string
  user_id?:   string | null
  type:       LeadActivityType
  notes?:     string | null
  created_at?: string
}

// ── quote_commissions ───────────────────────────────────────────────────────────
export interface QuoteCommission {
  id?:                            string
  quote_id:                       string
  lead_id:                        string | null
  vendor_id:                      string | null
  commission_type:                CommissionType
  commission_percentage_snapshot: number
  quote_total_snapshot:           number
  commission_amount_snapshot:     number
  currency:                       string
  status:                         CommissionStatus
  created_at?:                    string
  approved_at?:                   string | null
  paid_at?:                       string | null
}

// ─────────────────────────────────────────────────────────────────────────────

const CV_SIGNED_URL_TTL_SECONDS = 60 * 60 // 1 hour

// CVs live in a private bucket; `cv_url` stores the storage object path.
// This swaps each path for a short-lived signed URL for admin viewing,
// falling back to the stored value if signing fails.
export async function withSignedCvUrls(
  client: SupabaseClient,
  applications: CareerApplication[]
): Promise<CareerApplication[]> {
  const paths = applications
    .map((a) => a.cv_url)
    .filter((p): p is string => Boolean(p))
  if (paths.length === 0) return applications

  const { data, error } = await client.storage
    .from('cvs')
    .createSignedUrls(paths, CV_SIGNED_URL_TTL_SECONDS)

  if (error || !data) {
    console.error('Failed to sign CV urls:', error)
    return applications
  }

  const signedByPath = new Map<string, string>()
  for (const item of data) {
    if (item.path && item.signedUrl) signedByPath.set(item.path, item.signedUrl)
  }

  return applications.map((a) => ({
    ...a,
    cv_url: signedByPath.get(a.cv_url) ?? a.cv_url,
  }))
}


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

export interface Lead {
  id?: string
  nombre: string
  email: string
  telefono?: string
  tipo_negocio?: string
  mensaje?: string
  canal?: 'form' | 'whatsapp' | 'cal' | 'chatbot' | 'maps' | 'vendedor'
  estado?: 'nuevo' | 'contactado' | 'calificado' | 'cerrado' | 'perdido'
  notas?: string
  assigned_to?: string | null
  created_at?: string
}

// 'applicant' is the self-registered job candidate role. Staff roles
// (owner/supervisor/vendor) are assigned only by an owner. An applicant
// becomes a vendor when hired (see the "Contratar" action).
export type UserRole = 'owner' | 'supervisor' | 'vendor' | 'applicant'

// Roles an owner can assign manually from the CRM user manager.
export const STAFF_ROLES: UserRole[] = ['owner', 'supervisor', 'vendor']

export interface AdminUser {
  id: string
  email: string
  role: UserRole
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


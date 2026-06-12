import { createClient } from '@supabase/supabase-js'

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
  canal?: 'form' | 'whatsapp'
  estado?: 'nuevo' | 'contactado' | 'calificado' | 'cerrado'
  notas?: string
  assigned_to?: string | null
  created_at?: string
}

export type UserRole = 'owner' | 'supervisor' | 'vendor'

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
  nombre: string
  email: string
  telefono?: string
  mensaje?: string
  cv_url: string
  estado?: 'nuevo' | 'revisado' | 'aceptado' | 'rechazado'
  created_at?: string
  careers?: {
    title_es: string
    title_en: string
  }
}


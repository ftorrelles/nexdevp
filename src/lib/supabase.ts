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

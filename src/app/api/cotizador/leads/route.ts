import { NextResponse } from 'next/server'
import { createAuthServerClient } from '@/lib/supabase-server'
import { createServiceClient } from '@/lib/supabase'

// Returns a minimal lead list for the quote lead-selector.
export async function GET(): Promise<NextResponse> {
  const supabase = await createAuthServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  const role = user?.app_metadata?.role
  if (!user || !['owner', 'supervisor', 'vendor'].includes(role)) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 403 })
  }

  const client = createServiceClient()
  const { data, error } = await client
    .from('leads')
    .select('id, nombre, email, estado, canal')
    .order('created_at', { ascending: false })
    .limit(200)

  if (error) {
    console.error('leads list error:', error)
    return NextResponse.json({ error: 'Error al cargar leads.' }, { status: 500 })
  }

  return NextResponse.json({ leads: data ?? [] })
}

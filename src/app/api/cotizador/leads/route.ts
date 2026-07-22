import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { getActor } from '@/lib/auth-server'

// Returns a minimal lead list for the quote lead-selector.
// Vendors only see leads they own (assigned to or created by them).
export async function GET(): Promise<NextResponse> {
  const actor = await getActor()
  if (!actor) return NextResponse.json({ error: 'No autorizado.' }, { status: 403 })

  const client = createServiceClient()
  let query = client
    .from('leads')
    .select('id, nombre, email, estado, canal')
    .order('created_at', { ascending: false })
    .limit(200)

  if (actor.role === 'vendor') {
    query = query.or(`assigned_to.eq.${actor.id},created_by.eq.${actor.id}`)
  }

  const { data, error } = await query
  if (error) {
    console.error('leads list error:', error)
    return NextResponse.json({ error: 'Error al cargar leads.' }, { status: 500 })
  }

  return NextResponse.json({ leads: data ?? [] })
}

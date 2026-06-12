import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { createAuthServerClient } from '@/lib/supabase-server'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createAuthServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const role = user.app_metadata?.role ?? 'vendor'

  try {
    const { id } = await params
    const body = await req.json()
    const { estado, notas, assigned_to } = body

    const validEstados = ['nuevo', 'contactado', 'calificado', 'cerrado']
    if (estado && !validEstados.includes(estado)) {
      return NextResponse.json({ error: 'Invalid estado value' }, { status: 400 })
    }

    const updates: Record<string, string | null> = {}
    if (estado) updates.estado = estado
    if (notas !== undefined) updates.notas = notas
    if (assigned_to !== undefined && role === 'owner') updates.assigned_to = assigned_to

    const client = createServiceClient()

    // Vendors can only update leads assigned to them
    const query = client.from('leads').update(updates).eq('id', id)
    if (role === 'vendor') {
      query.eq('assigned_to', user.id)
    }

    const { error } = await query

    if (error) {
      console.error('Supabase update error:', error)
      return NextResponse.json({ error: 'Failed to update lead' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Lead PATCH error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

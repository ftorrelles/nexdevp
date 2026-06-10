import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { cookies } from 'next/headers'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const cookieStore = await cookies()
  const authCookie = cookieStore.get('admin_auth')

  if (!authCookie || authCookie.value !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    const body = await req.json()
    const { estado, notas } = body

    const validEstados = ['nuevo', 'contactado', 'calificado', 'cerrado']
    if (estado && !validEstados.includes(estado)) {
      return NextResponse.json({ error: 'Invalid estado value' }, { status: 400 })
    }

    const updates: Record<string, string> = {}
    if (estado) updates.estado = estado
    if (notas !== undefined) updates.notas = notas

    const client = createServiceClient()
    const { error } = await client.from('leads').update(updates).eq('id', id)

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

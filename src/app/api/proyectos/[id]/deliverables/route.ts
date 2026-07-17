import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { createAuthServerClient } from '@/lib/supabase-server'

async function getUser() {
  const supabase = await createAuthServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

function requireOwnerSupervisor(role: string): NextResponse | null {
  if (role !== 'owner' && role !== 'supervisor') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  return null
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = user.app_metadata?.role ?? 'vendor'
  const forbidden = requireOwnerSupervisor(role)
  if (forbidden) return forbidden

  const { id } = await params
  const client = createServiceClient()

  try {
    const body = await req.json()
    if (!body.name) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 })
    }

    const { data, error } = await client
      .from('project_deliverables')
      .insert({
        project_id: id,
        name: body.name,
        hours: body.hours ?? 0,
        status: body.status ?? 'pendiente',
        assigned_to: body.assigned_to ?? null,
        sort_order: body.sort_order ?? 0,
      })
      .select()
      .single()

    if (error) {
      console.error('Deliverable POST error:', error)
      return NextResponse.json({ error: 'Failed to create deliverable' }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    console.error('Deliverable POST error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

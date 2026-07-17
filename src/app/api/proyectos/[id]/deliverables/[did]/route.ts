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

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; did: string }> }
) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = user.app_metadata?.role ?? 'vendor'
  const forbidden = requireOwnerSupervisor(role)
  if (forbidden) return forbidden

  const { did } = await params
  const client = createServiceClient()

  try {
    const body = await req.json()
    const allowed: Record<string, string | number | null> = {}

    if (body.name !== undefined) allowed.name = body.name
    if (body.hours !== undefined) allowed.hours = body.hours
    if (body.status !== undefined) allowed.status = body.status
    if (body.assigned_to !== undefined) allowed.assigned_to = body.assigned_to
    if (body.sort_order !== undefined) allowed.sort_order = body.sort_order

    if (Object.keys(allowed).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const { error } = await client
      .from('project_deliverables')
      .update({ ...allowed, updated_at: new Date().toISOString() })
      .eq('id', did)

    if (error) {
      console.error('Deliverable PATCH error:', error)
      return NextResponse.json({ error: 'Failed to update deliverable' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Deliverable PATCH error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; did: string }> }
) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = user.app_metadata?.role ?? 'vendor'
  const forbidden = requireOwnerSupervisor(role)
  if (forbidden) return forbidden

  const { did } = await params
  const client = createServiceClient()

  const { error } = await client
    .from('project_deliverables')
    .delete()
    .eq('id', did)

  if (error) {
    console.error('Deliverable DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete deliverable' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

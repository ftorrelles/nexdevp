import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { createAuthServerClient } from '@/lib/supabase-server'

// Ticking off a part is the developer's day-to-day action, so unlike the rest
// of the deliverable endpoints this one is not owner/supervisor only — but a
// developer may only touch the deliverables actually assigned to them.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; did: string; pid: string }> }
) {
  const supabase = await createAuthServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = user.app_metadata?.role ?? 'vendor'
  const { id, did, pid } = await params
  const client = createServiceClient()

  const { data: deliverable } = await client
    .from('project_deliverables')
    .select('id, assigned_to')
    .eq('id', did)
    .eq('project_id', id)
    .maybeSingle()

  if (!deliverable) {
    return NextResponse.json({ error: 'Deliverable not found' }, { status: 404 })
  }

  const isStaff    = role === 'owner' || role === 'supervisor'
  const isAssigned = role === 'developer' && deliverable.assigned_to === user.id
  if (!isStaff && !isAssigned) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const { done } = await req.json()
    if (typeof done !== 'boolean') {
      return NextResponse.json({ error: 'done must be a boolean' }, { status: 400 })
    }

    const { data, error } = await client
      .from('project_deliverable_parts')
      .update({
        done,
        done_at: done ? new Date().toISOString() : null,
        done_by: done ? user.id : null,
      })
      .eq('id', pid)
      .eq('deliverable_id', did)
      .select('id, name, done, done_at, done_by, sort_order')
      .maybeSingle()

    if (error || !data) {
      console.error('Part PATCH error:', error)
      return NextResponse.json({ error: 'Failed to update part' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (err) {
    console.error('Part PATCH error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Removing an item changes what the phase promises, so unlike ticking it off
// this stays with owner/supervisor.
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; did: string; pid: string }> }
) {
  const supabase = await createAuthServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = user.app_metadata?.role ?? 'vendor'
  if (role !== 'owner' && role !== 'supervisor') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id, did, pid } = await params
  const client = createServiceClient()

  const { data: deliverable } = await client
    .from('project_deliverables')
    .select('id')
    .eq('id', did)
    .eq('project_id', id)
    .maybeSingle()

  if (!deliverable) {
    return NextResponse.json({ error: 'Deliverable not found' }, { status: 404 })
  }

  const { error } = await client
    .from('project_deliverable_parts')
    .delete()
    .eq('id', pid)
    .eq('deliverable_id', did)

  if (error) {
    console.error('Part DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete part' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

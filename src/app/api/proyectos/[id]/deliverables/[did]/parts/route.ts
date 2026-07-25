import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { createAuthServerClient } from '@/lib/supabase-server'

// Adding items to a deliverable's checklist changes what the phase promises,
// so it stays with owner/supervisor. Ticking them off is the developer's job
// and lives in ./[pid]/route.ts.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; did: string }> }
) {
  const supabase = await createAuthServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = user.app_metadata?.role ?? 'vendor'
  if (role !== 'owner' && role !== 'supervisor') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id, did } = await params
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

  try {
    const { name } = await req.json()
    if (!name?.trim()) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 })
    }

    const { count } = await client
      .from('project_deliverable_parts')
      .select('id', { count: 'exact', head: true })
      .eq('deliverable_id', did)

    const { data, error } = await client
      .from('project_deliverable_parts')
      .insert({ deliverable_id: did, name: name.trim(), sort_order: count ?? 0 })
      .select('id, name, done, done_at, done_by, sort_order')
      .single()

    if (error) {
      console.error('Part POST error:', error)
      return NextResponse.json({ error: 'Failed to create part' }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    console.error('Part POST error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

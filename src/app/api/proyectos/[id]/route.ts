import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { createAuthServerClient } from '@/lib/supabase-server'
import { computeProgressPct } from '@/lib/projects'

const STAFF_ROLES = ['owner', 'supervisor', 'vendor']

async function getUser() {
  const supabase = await createAuthServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = user.app_metadata?.role ?? 'vendor'
  if (!STAFF_ROLES.includes(role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const client = createServiceClient()

  // Fetch project with lead info
  let query = client
    .from('projects')
    .select('*, leads!inner(id, nombre, assigned_to)')
    .eq('id', id)

  // Vendor must own the lead
  if (role === 'vendor') {
    query = query.eq('leads.assigned_to', user.id)
  }

  const { data: project, error: projErr } = await query.maybeSingle()

  if (projErr) {
    console.error('Project GET error:', projErr)
    return NextResponse.json({ error: 'Failed to fetch project' }, { status: 500 })
  }

  if (!project) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Fetch deliverables
  const { data: deliverables } = await client
    .from('project_deliverables')
    .select('*')
    .eq('project_id', id)
    .order('sort_order', { ascending: true })

  const progressPct = computeProgressPct(deliverables ?? [])

  return NextResponse.json({ ...project, deliverables: deliverables ?? [], progress_pct: progressPct })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = user.app_metadata?.role ?? 'vendor'
  if (!STAFF_ROLES.includes(role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (role === 'vendor') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const client = createServiceClient()

  try {
    const body = await req.json()
    const allowed: Record<string, string | null> = {}

    if (body.name !== undefined) allowed.name = body.name
    if (body.status !== undefined) allowed.status = body.status
    if (body.vercel_url !== undefined) allowed.vercel_url = body.vercel_url

    if (Object.keys(allowed).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const { error } = await client
      .from('projects')
      .update({ ...allowed, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      console.error('Project PATCH error:', error)
      return NextResponse.json({ error: 'Failed to update project' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Project PATCH error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { createAuthServerClient } from '@/lib/supabase-server'

const STAFF_ROLES = ['owner', 'supervisor', 'developer', 'vendor']

async function getUser() {
  const supabase = await createAuthServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function GET() {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = user.app_metadata?.role ?? 'vendor'
  if (!STAFF_ROLES.includes(role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const client = createServiceClient()
  let query = client
    .from('projects')
    .select('*, leads!inner(nombre)')
    .order('created_at', { ascending: false })

  if (role === 'vendor') {
    query = query.eq('leads.assigned_to', user.id)
  } else if (role === 'developer') {
    // Only projects where this developer has at least one assigned deliverable
    const { data: assigned } = await client
      .from('project_deliverables')
      .select('project_id')
      .eq('assigned_to', user.id)
    const projectIds = [...new Set((assigned ?? []).map((d) => d.project_id))]
    if (projectIds.length === 0) return NextResponse.json([])
    query = query.in('id', projectIds)
  }

  const { data, error } = await query

  if (error) {
    console.error('Projects GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = user.app_metadata?.role ?? 'vendor'
  if (role !== 'owner' && role !== 'supervisor') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const { lead_id } = await req.json()
    if (!lead_id) {
      return NextResponse.json({ error: 'lead_id is required' }, { status: 400 })
    }

    const client = createServiceClient()

    // 1. Validate lead exists and is closed
    const { data: lead, error: leadErr } = await client
      .from('leads')
      .select('id, nombre, estado')
      .eq('id', lead_id)
      .single()

    if (leadErr || !lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }
    if (lead.estado !== 'cerrado') {
      return NextResponse.json({ error: 'Lead must be in estado=cerrado' }, { status: 400 })
    }

    // 2. Idempotency check
    const { data: existing } = await client
      .from('projects')
      .select('id')
      .eq('lead_id', lead_id)
      .maybeSingle()

    if (existing) {
      return NextResponse.json(
        { error: 'Project already exists for this lead', project_id: existing.id },
        { status: 409 }
      )
    }

    // 3. Find latest accepted quote
    const { data: quote } = await client
      .from('quotes')
      .select('id, title')
      .eq('lead_id', lead_id)
      .eq('status', 'accepted')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    // 4. Create project
    const projectName = quote?.title ?? lead.nombre
    const { data: project, error: projErr } = await client
      .from('projects')
      .insert({
        lead_id,
        quote_id: quote?.id ?? null,
        name: projectName,
        created_by: user.id,
      })
      .select()
      .single()

    if (projErr) {
      console.error('Project insert error:', projErr)
      return NextResponse.json({ error: 'Failed to create project' }, { status: 500 })
    }

    // 5. Seed deliverables from quote items if available
    if (quote) {
      const { data: items } = await client
        .from('quote_items')
        .select('id, name, hours, sort_order')
        .eq('quote_id', quote.id)
        .order('sort_order', { ascending: true })

      if (items && items.length > 0) {
        const deliverables = items.map((item) => ({
          project_id: project.id,
          name: item.name,
          hours: item.hours,
          sort_order: item.sort_order,
          seeded_from_quote_item_id: item.id,
        }))

        const { error: delErr } = await client
          .from('project_deliverables')
          .insert(deliverables)

        if (delErr) {
          console.error('Deliverables seed error:', delErr)
        }
      }
    }

    return NextResponse.json(project, { status: 201 })
  } catch (err) {
    console.error('Projects POST error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

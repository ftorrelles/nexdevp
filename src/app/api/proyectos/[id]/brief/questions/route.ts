import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { createAuthServerClient } from '@/lib/supabase-server'

type Params = { params: Promise<{ id: string }> }

async function getAuthedUser() {
  const supabase = await createAuthServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// Shared scope check: returns the brief for the project if the user is allowed.
// owner/supervisor: unrestricted
// developer: must have a deliverable assigned in this project
// client: must be project.client_user_id
async function resolveAllowedBrief(
  projectId: string,
  userId: string,
  role: string
) {
  const client = createServiceClient()

  if (role === 'developer') {
    const { data: assigned } = await client
      .from('project_deliverables')
      .select('id')
      .eq('project_id', projectId)
      .eq('assigned_to', userId)
      .limit(1)

    if (!assigned || assigned.length === 0) return { brief: null, forbidden: true }
  } else if (role === 'client') {
    const { data: project } = await client
      .from('projects')
      .select('client_user_id')
      .eq('id', projectId)
      .maybeSingle()

    if (!project || project.client_user_id !== userId) return { brief: null, forbidden: true }
  } else if (role !== 'owner' && role !== 'supervisor') {
    return { brief: null, forbidden: true }
  }

  const { data: brief } = await client
    .from('project_briefs')
    .select('id')
    .eq('project_id', projectId)
    .maybeSingle()

  return { brief, forbidden: false }
}

// ── GET /api/proyectos/[id]/brief/questions ───────────────────────────────────
// List project brief questions. Allowed: owner, supervisor, developer (scoped), client (scoped).
export async function GET(_req: NextRequest, { params }: Params) {
  const user = await getAuthedUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = user.app_metadata?.role ?? ''
  const { id: projectId } = await params

  const { brief, forbidden } = await resolveAllowedBrief(projectId, user.id, role)
  if (forbidden) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (!brief) return NextResponse.json([], { status: 200 })

  const client = createServiceClient()
  const { data: questions, error } = await client
    .from('project_brief_questions')
    .select('*')
    .eq('brief_id', brief.id)
    .order('sort_order', { ascending: true })

  if (error) {
    console.error('Questions GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 })
  }

  return NextResponse.json(questions ?? [])
}

// ── POST /api/proyectos/[id]/brief/questions ──────────────────────────────────
// Add a custom question. Allowed: owner, supervisor, developer (scoped).
export async function POST(req: NextRequest, { params }: Params) {
  const user = await getAuthedUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = user.app_metadata?.role ?? ''

  // Clients cannot add questions
  if (role === 'client' || (!['owner', 'supervisor', 'developer'].includes(role))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id: projectId } = await params

  const { brief, forbidden } = await resolveAllowedBrief(projectId, user.id, role)
  if (forbidden) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (!brief) return NextResponse.json({ error: 'Brief not found for this project' }, { status: 404 })

  let body: {
    label?: string
    description?: string
    field_type?: string
    sort_order?: number
    required?: boolean
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!body.label) return NextResponse.json({ error: 'label is required' }, { status: 400 })

  const validFieldTypes = ['text', 'textarea', 'url', 'image', 'boolean']
  if (!body.field_type || !validFieldTypes.includes(body.field_type)) {
    return NextResponse.json({ error: `field_type must be one of: ${validFieldTypes.join(', ')}` }, { status: 400 })
  }

  const client = createServiceClient()
  const { data: question, error: insertErr } = await client
    .from('project_brief_questions')
    .insert({
      brief_id: brief.id,
      label: body.label,
      description: body.description ?? null,
      field_type: body.field_type,
      sort_order: body.sort_order ?? 0,
      required: body.required ?? false,
      // from_template_question_id is intentionally omitted for custom questions
    })
    .select()
    .single()

  if (insertErr || !question) {
    console.error('Question insert error:', insertErr)
    return NextResponse.json({ error: 'Failed to add question' }, { status: 500 })
  }

  return NextResponse.json(question, { status: 201 })
}

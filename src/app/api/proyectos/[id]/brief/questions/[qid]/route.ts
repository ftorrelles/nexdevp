import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { createAuthServerClient } from '@/lib/supabase-server'

type Params = { params: Promise<{ id: string; qid: string }> }

async function getAuthedUser() {
  const supabase = await createAuthServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// Verifies developer scope: must have a deliverable assigned in this project.
async function isDeveloperAllowed(projectId: string, userId: string): Promise<boolean> {
  const client = createServiceClient()
  const { data } = await client
    .from('project_deliverables')
    .select('id')
    .eq('project_id', projectId)
    .eq('assigned_to', userId)
    .limit(1)
  return Boolean(data && data.length > 0)
}

// Returns the question only if it belongs to a brief for this project,
// preventing cross-project edits.
async function resolveQuestion(projectId: string, qid: string) {
  const client = createServiceClient()
  const { data } = await client
    .from('project_brief_questions')
    .select('*, project_briefs!inner(project_id)')
    .eq('id', qid)
    .eq('project_briefs.project_id', projectId)
    .maybeSingle()
  return data
}

// ── PATCH /api/proyectos/[id]/brief/questions/[qid] ───────────────────────────
// Update a project brief question. Allowed: owner, supervisor, developer (scoped).
export async function PATCH(req: NextRequest, { params }: Params) {
  const user = await getAuthedUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = user.app_metadata?.role ?? ''
  if (!['owner', 'supervisor', 'developer'].includes(role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id: projectId, qid } = await params

  if (role === 'developer') {
    const allowed = await isDeveloperAllowed(projectId, user.id)
    if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const question = await resolveQuestion(projectId, qid)
  if (!question) return NextResponse.json({ error: 'Question not found' }, { status: 404 })

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

  const validFieldTypes = ['text', 'textarea', 'url', 'image', 'image_multi', 'boolean']
  if (body.field_type && !validFieldTypes.includes(body.field_type)) {
    return NextResponse.json({ error: `field_type must be one of: ${validFieldTypes.join(', ')}` }, { status: 400 })
  }

  const allowed: Record<string, unknown> = {}
  if (body.label !== undefined) allowed.label = body.label
  if (body.description !== undefined) allowed.description = body.description
  if (body.field_type !== undefined) allowed.field_type = body.field_type
  if (body.sort_order !== undefined) allowed.sort_order = body.sort_order
  if (body.required !== undefined) allowed.required = body.required

  if (Object.keys(allowed).length === 0) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
  }

  const client = createServiceClient()
  const { error } = await client
    .from('project_brief_questions')
    .update(allowed)
    .eq('id', qid)

  if (error) {
    console.error('Question PATCH error:', error)
    return NextResponse.json({ error: 'Failed to update question' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

// ── DELETE /api/proyectos/[id]/brief/questions/[qid] ─────────────────────────
// Delete a project brief question. Allowed: owner, supervisor, developer (scoped).
export async function DELETE(_req: NextRequest, { params }: Params) {
  const user = await getAuthedUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = user.app_metadata?.role ?? ''
  if (!['owner', 'supervisor', 'developer'].includes(role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id: projectId, qid } = await params

  if (role === 'developer') {
    const allowed = await isDeveloperAllowed(projectId, user.id)
    if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const question = await resolveQuestion(projectId, qid)
  if (!question) return NextResponse.json({ error: 'Question not found' }, { status: 404 })

  const client = createServiceClient()
  const { error } = await client
    .from('project_brief_questions')
    .delete()
    .eq('id', qid)

  if (error) {
    console.error('Question DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete question' }, { status: 500 })
  }

  return new NextResponse(null, { status: 204 })
}

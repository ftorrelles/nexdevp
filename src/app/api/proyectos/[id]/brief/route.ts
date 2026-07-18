import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { createAuthServerClient } from '@/lib/supabase-server'
import { withSignedBriefUrls } from '@/lib/brief-storage'
import { sendBriefSentEmail } from '@/lib/email'

type Params = { params: Promise<{ id: string }> }

async function getAuthedUser() {
  const supabase = await createAuthServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// ── POST /api/proyectos/[id]/brief ───────────────────────────────────────────
// Create brief by snapshotting a template's questions. Owner/supervisor only.
export async function POST(req: NextRequest, { params }: Params) {
  const user = await getAuthedUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = user.app_metadata?.role ?? ''
  if (role !== 'owner' && role !== 'supervisor') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id: projectId } = await params
  const client = createServiceClient()

  let body: { template_id?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!body.template_id) {
    return NextResponse.json({ error: 'template_id is required' }, { status: 400 })
  }

  // Check unique constraint — only one brief per project
  const { data: existing } = await client
    .from('project_briefs')
    .select('id')
    .eq('project_id', projectId)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ error: 'A brief already exists for this project' }, { status: 409 })
  }

  // Fetch template questions to snapshot
  const { data: templateQuestions, error: tqErr } = await client
    .from('brief_template_questions')
    .select('*')
    .eq('template_id', body.template_id)
    .order('sort_order', { ascending: true })

  if (tqErr) {
    console.error('Template questions fetch error:', tqErr)
    return NextResponse.json({ error: 'Failed to fetch template questions' }, { status: 500 })
  }

  // Insert project_brief
  const { data: brief, error: briefErr } = await client
    .from('project_briefs')
    .insert({ project_id: projectId, template_id: body.template_id })
    .select()
    .single()

  if (briefErr || !brief) {
    console.error('Brief insert error:', briefErr)
    return NextResponse.json({ error: 'Failed to create brief' }, { status: 500 })
  }

  // Snapshot questions into project_brief_questions
  if (templateQuestions && templateQuestions.length > 0) {
    const rows = templateQuestions.map((q) => ({
      brief_id: brief.id,
      label: q.label,
      description: q.description,
      field_type: q.field_type,
      sort_order: q.sort_order,
      required: q.required,
      from_template_question_id: q.id,
    }))

    const { error: insertQErr } = await client
      .from('project_brief_questions')
      .insert(rows)

    if (insertQErr) {
      console.error('Brief questions insert error:', insertQErr)
      return NextResponse.json({ error: 'Failed to snapshot questions' }, { status: 500 })
    }
  }

  return NextResponse.json(brief, { status: 201 })
}

// ── GET /api/proyectos/[id]/brief ────────────────────────────────────────────
// Returns brief + questions + signed answers. Multi-role scoped.
export async function GET(_req: NextRequest, { params }: Params) {
  const user = await getAuthedUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = user.app_metadata?.role ?? ''
  const { id: projectId } = await params
  const client = createServiceClient()

  // Developer scope: must have a deliverable assigned in this project
  if (role === 'developer') {
    const { data: assigned } = await client
      .from('project_deliverables')
      .select('id')
      .eq('project_id', projectId)
      .eq('assigned_to', user.id)
      .limit(1)

    if (!assigned || assigned.length === 0) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  } else if (role === 'client') {
    // Client scope: project.client_user_id must match user
    const { data: project } = await client
      .from('projects')
      .select('client_user_id')
      .eq('id', projectId)
      .maybeSingle()

    if (!project || project.client_user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  } else if (role !== 'owner' && role !== 'supervisor') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Fetch brief with nested questions and answers
  const { data: brief, error: briefErr } = await client
    .from('project_briefs')
    .select(`
      *,
      project_brief_questions (
        *,
        project_brief_answers (*)
      )
    `)
    .eq('project_id', projectId)
    .maybeSingle()

  if (briefErr) {
    console.error('Brief GET error:', briefErr)
    return NextResponse.json({ error: 'Failed to fetch brief' }, { status: 500 })
  }

  if (!brief) {
    return NextResponse.json(null)
  }

  type AnswerRow = { id: string; brief_question_id: string; value: string | null; file_path: string | null; answered_at: string }

  // PostgREST returns a single object (not an array) when a UNIQUE constraint exists
  // on brief_question_id. Normalize to always produce an array regardless of cardinality.
  const toAnswerArray = (val: unknown): AnswerRow[] => {
    if (!val) return []
    if (Array.isArray(val)) return val as AnswerRow[]
    return [val as AnswerRow]
  }

  // Sort questions by sort_order
  const questions = ((brief.project_brief_questions ?? []) as Array<{ project_brief_answers: unknown } & Record<string, unknown>>)
    .sort((a, b) => (a.sort_order as number) - (b.sort_order as number))
    .map((q) => ({ ...q, project_brief_answers: toAnswerArray(q.project_brief_answers) }))

  // Sign file_path fields across all answers
  const allAnswers = questions.flatMap((q) => q.project_brief_answers)
  const signedAnswers = await withSignedBriefUrls(allAnswers)
  const signedMap = new Map(signedAnswers.map((a) => [a.id, a]))

  const questionsWithSignedAnswers = questions.map((q) => ({
    ...q,
    project_brief_answers: q.project_brief_answers.map((a) => signedMap.get(a.id) ?? a),
  }))

  return NextResponse.json({ ...brief, project_brief_questions: questionsWithSignedAnswers })
}

// ── PATCH /api/proyectos/[id]/brief ──────────────────────────────────────────
// Status transitions. Owner/supervisor only.
export async function PATCH(req: NextRequest, { params }: Params) {
  const user = await getAuthedUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = user.app_metadata?.role ?? ''
  if (role !== 'owner' && role !== 'supervisor') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id: projectId } = await params
  const client = createServiceClient()

  let body: { status?: string; sent_at?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { data: brief, error: briefErr } = await client
    .from('project_briefs')
    .select('id, status')
    .eq('project_id', projectId)
    .maybeSingle()

  if (briefErr || !brief) {
    return NextResponse.json({ error: 'Brief not found' }, { status: 404 })
  }

  const updates: Record<string, unknown> = {}
  if (body.status) updates.status = body.status

  // Transition to 'sent': auto-set sent_at and email the client
  if (body.status === 'sent') {
    updates.sent_at = new Date().toISOString()

    // Resolve client email via project → client_user_id → auth.admin.getUserById
    const { data: project } = await client
      .from('projects')
      .select('name, client_user_id')
      .eq('id', projectId)
      .maybeSingle()

    if (project?.client_user_id) {
      try {
        const { data: clientUser } = await client.auth.admin.getUserById(project.client_user_id)
        const clientEmail = clientUser?.user?.email
        if (clientEmail) {
          await sendBriefSentEmail(clientEmail, project.name, projectId)
        }
      } catch (err) {
        console.error('Failed to send brief sent email:', err)
      }
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
  }

  const { error: updateErr } = await client
    .from('project_briefs')
    .update(updates)
    .eq('id', brief.id)

  if (updateErr) {
    console.error('Brief PATCH error:', updateErr)
    return NextResponse.json({ error: 'Failed to update brief' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

// ── DELETE /api/proyectos/[id]/brief ─────────────────────────────────────────
// Only allowed when status='draft'. Owner/supervisor only.
export async function DELETE(_req: NextRequest, { params }: Params) {
  const user = await getAuthedUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = user.app_metadata?.role ?? ''
  if (role !== 'owner' && role !== 'supervisor') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id: projectId } = await params
  const client = createServiceClient()

  const { data: brief } = await client
    .from('project_briefs')
    .select('id, status')
    .eq('project_id', projectId)
    .maybeSingle()

  if (!brief) {
    return NextResponse.json({ error: 'Brief not found' }, { status: 404 })
  }

  if (brief.status !== 'draft') {
    return NextResponse.json({ error: 'Only draft briefs can be deleted' }, { status: 409 })
  }

  const { error: deleteErr } = await client
    .from('project_briefs')
    .delete()
    .eq('id', brief.id)

  if (deleteErr) {
    console.error('Brief DELETE error:', deleteErr)
    return NextResponse.json({ error: 'Failed to delete brief' }, { status: 500 })
  }

  return new NextResponse(null, { status: 204 })
}

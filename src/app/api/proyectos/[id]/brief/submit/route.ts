import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { createAuthServerClient } from '@/lib/supabase-server'
import { sendBriefCompletedEmail } from '@/lib/email'

type Params = { params: Promise<{ id: string }> }

// ── POST /api/proyectos/[id]/brief/submit ────────────────────────────────────
// Client marks the brief as completed.
// Validates all required questions have answers, then transitions status.
export async function POST(_req: NextRequest, { params }: Params) {
  const supabase = await createAuthServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = user.app_metadata?.role ?? ''
  if (role !== 'client') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id: projectId } = await params
  const client = createServiceClient()

  // Verify project ownership
  const { data: project } = await client
    .from('projects')
    .select('id, name, client_user_id')
    .eq('id', projectId)
    .maybeSingle()

  if (!project || project.client_user_id !== user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Verify brief exists and is in 'sent' state
  const { data: brief } = await client
    .from('project_briefs')
    .select('id, status')
    .eq('project_id', projectId)
    .maybeSingle()

  if (!brief) {
    return NextResponse.json({ error: 'Brief not found' }, { status: 404 })
  }

  if (brief.status !== 'sent') {
    return NextResponse.json(
      { error: `Cannot submit a brief with status '${brief.status}'` },
      { status: 409 }
    )
  }

  // Fetch all questions with their answers to validate required ones
  const { data: questions, error: questionsErr } = await client
    .from('project_brief_questions')
    .select('id, required, project_brief_answers(id, value, file_path)')
    .eq('brief_id', brief.id)

  if (questionsErr) {
    console.error('Questions fetch error:', questionsErr)
    return NextResponse.json({ error: 'Failed to validate answers' }, { status: 500 })
  }

  type QuestionRow = {
    id: string
    required: boolean
    project_brief_answers: Array<{ id: string; value: string | null; file_path: string | null }>
  }

  const missing: string[] = []
  for (const q of (questions ?? []) as QuestionRow[]) {
    if (!q.required) continue
    const answers = q.project_brief_answers ?? []
    const hasAnswer = answers.some((a) => {
      const hasValue = a.value !== null && a.value.trim() !== ''
      const hasFile = a.file_path !== null && a.file_path.trim() !== ''
      return hasValue || hasFile
    })
    if (!hasAnswer) missing.push(q.id)
  }

  if (missing.length > 0) {
    return NextResponse.json({ missing }, { status: 422 })
  }

  // Transition brief to 'completed'
  const { error: updateErr } = await client
    .from('project_briefs')
    .update({ status: 'completed', completed_at: new Date().toISOString() })
    .eq('id', brief.id)

  if (updateErr) {
    console.error('Brief submit update error:', updateErr)
    return NextResponse.json({ error: 'Failed to submit brief' }, { status: 500 })
  }

  // Send completion email to all owners and supervisors (best-effort)
  try {
    const { data: { users } } = await client.auth.admin.listUsers()
    const adminEmails = (users ?? [])
      .filter((u) => ['owner', 'supervisor'].includes(u.app_metadata?.role ?? ''))
      .map((u) => u.email)
      .filter(Boolean) as string[]

    if (adminEmails.length > 0 && user.email) {
      await sendBriefCompletedEmail(adminEmails, project.name, user.email, projectId)
    }
  } catch (err) {
    console.error('Failed to send brief completed email:', err)
  }

  return NextResponse.json({ success: true })
}

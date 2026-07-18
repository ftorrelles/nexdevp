import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { createAuthServerClient } from '@/lib/supabase-server'
import { uploadBriefFile } from '@/lib/brief-storage'

type Params = { params: Promise<{ id: string }> }

// ── POST /api/proyectos/[id]/brief/answers ───────────────────────────────────
// Client submits/updates answers. Accepts multipart/form-data.
// Fields: answers[{question_id}][value] for text types
//         answers[{question_id}][file]  for image uploads
export async function POST(req: NextRequest, { params }: Params) {
  try {
    return await handlePost(req, { params })
  } catch (err) {
    console.error('[brief/answers] Unhandled exception:', err)
    return NextResponse.json({ error: 'Unexpected server error', detail: String(err) }, { status: 500 })
  }
}

async function handlePost(req: NextRequest, { params }: Params) {
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
    .select('id, client_user_id')
    .eq('id', projectId)
    .maybeSingle()

  if (!project || project.client_user_id !== user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Verify brief exists and status is sent or completed (not draft)
  const { data: brief } = await client
    .from('project_briefs')
    .select('id, status')
    .eq('project_id', projectId)
    .maybeSingle()

  if (!brief) {
    return NextResponse.json({ error: 'Brief not found' }, { status: 404 })
  }

  if (brief.status === 'draft') {
    return NextResponse.json({ error: 'Brief is not available yet' }, { status: 403 })
  }

  // Parse multipart form data
  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  // Collect question IDs from formData keys.
  // Patterns: answers[{qid}][value] (text), answers[{qid}][file] (single image),
  //           answers[{qid}][files][] (image_multi, repeated key)
  const questionMap = new Map<string, { value?: string; file?: File; files?: File[] }>()

  for (const [key, val] of formData.entries()) {
    const match = key.match(/^answers\[([^\]]+)\]\[(value|file|files)\](\[\])?$/)
    if (!match) continue
    const questionId = match[1]
    const field = match[2] as 'value' | 'file' | 'files'

    if (!questionMap.has(questionId)) {
      questionMap.set(questionId, {})
    }

    const entry = questionMap.get(questionId)!
    if (field === 'file' && val instanceof File && val.size > 0) {
      entry.file = val
    } else if (field === 'files' && val instanceof File && val.size > 0) {
      entry.files = [...(entry.files ?? []), val]
    } else if (field === 'value' && typeof val === 'string') {
      entry.value = val
    }
  }

  if (questionMap.size === 0) {
    return NextResponse.json({ error: 'No answers provided' }, { status: 400 })
  }

  // Process each answer: upload files, build upsert rows
  const rows: Array<{ brief_question_id: string; value: string | null; file_path: string | null; answered_at: string }> = []

  for (const [questionId, entry] of questionMap.entries()) {
    let value: string | null = null
    let filePath: string | null = null

    if (entry.files && entry.files.length > 0) {
      try {
        const paths = await Promise.all(
          entry.files.map((file) => uploadBriefFile(projectId, questionId, file))
        )
        filePath = JSON.stringify(paths)
      } catch (err) {
        console.error(`File upload failed for question ${questionId}:`, err)
        return NextResponse.json({ error: 'File upload failed' }, { status: 500 })
      }
    } else if (entry.file) {
      try {
        filePath = await uploadBriefFile(projectId, questionId, entry.file)
      } catch (err) {
        console.error(`File upload failed for question ${questionId}:`, err)
        return NextResponse.json({ error: 'File upload failed' }, { status: 500 })
      }
    } else if (entry.value !== undefined) {
      value = entry.value
    }

    rows.push({
      brief_question_id: questionId,
      value,
      file_path: filePath,
      answered_at: new Date().toISOString(),
    })
  }

  // Upsert answers — unique on brief_question_id
  const { error: upsertErr } = await client
    .from('project_brief_answers')
    .upsert(rows, { onConflict: 'brief_question_id' })

  if (upsertErr) {
    console.error('Answers upsert error:', upsertErr)
    return NextResponse.json({ error: 'Failed to save answers' }, { status: 500 })
  }

  return NextResponse.json({ saved: rows.length })
}

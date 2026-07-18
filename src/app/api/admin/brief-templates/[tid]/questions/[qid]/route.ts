import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { createAuthServerClient } from '@/lib/supabase-server'

type Params = { params: Promise<{ tid: string; qid: string }> }

const VALID_FIELD_TYPES = ['text', 'textarea', 'url', 'image', 'image_multi', 'boolean'] as const

async function requireOwnerSupervisor() {
  const supabase = await createAuthServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { user: null, error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  const role = user.app_metadata?.role as string | undefined
  if (!['owner', 'supervisor'].includes(role ?? '')) {
    return { user: null, error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }
  return { user, error: null }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { error } = await requireOwnerSupervisor()
  if (error) return error

  const { tid, qid } = await params

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

  if (
    body.field_type !== undefined &&
    !VALID_FIELD_TYPES.includes(body.field_type as typeof VALID_FIELD_TYPES[number])
  ) {
    return NextResponse.json(
      { error: `field_type must be one of: ${VALID_FIELD_TYPES.join(', ')}` },
      { status: 400 }
    )
  }

  const updates: Record<string, string | number | boolean | null> = {}
  if (body.label !== undefined) updates.label = body.label.trim()
  if (body.description !== undefined) updates.description = body.description?.trim() ?? null
  if (body.field_type !== undefined) updates.field_type = body.field_type
  if (body.sort_order !== undefined) updates.sort_order = body.sort_order
  if (body.required !== undefined) updates.required = body.required

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
  }

  const client = createServiceClient()
  const { data, error: dbErr } = await client
    .from('brief_template_questions')
    .update(updates)
    .eq('id', qid)
    .eq('template_id', tid)
    .select()
    .single()

  if (dbErr || !data) {
    console.error('brief-template-questions PATCH error:', dbErr)
    return NextResponse.json({ error: 'Failed to update question' }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { error } = await requireOwnerSupervisor()
  if (error) return error

  const { tid, qid } = await params
  const client = createServiceClient()

  const { error: dbErr } = await client
    .from('brief_template_questions')
    .delete()
    .eq('id', qid)
    .eq('template_id', tid)

  if (dbErr) {
    console.error('brief-template-questions DELETE error:', dbErr)
    return NextResponse.json({ error: 'Failed to delete question' }, { status: 500 })
  }

  return new NextResponse(null, { status: 204 })
}

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { createAuthServerClient } from '@/lib/supabase-server'

type Params = { params: Promise<{ tid: string }> }

const VALID_FIELD_TYPES = ['text', 'textarea', 'url', 'image', 'boolean'] as const

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

export async function GET(_req: NextRequest, { params }: Params) {
  const { error } = await requireOwnerSupervisor()
  if (error) return error

  const { tid } = await params
  const client = createServiceClient()

  const { data, error: dbErr } = await client
    .from('brief_template_questions')
    .select('*')
    .eq('template_id', tid)
    .order('sort_order', { ascending: true })

  if (dbErr) {
    console.error('brief-template-questions GET error:', dbErr)
    return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(req: NextRequest, { params }: Params) {
  const { error } = await requireOwnerSupervisor()
  if (error) return error

  const { tid } = await params

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

  if (!body.label?.trim()) {
    return NextResponse.json({ error: 'label is required' }, { status: 400 })
  }
  if (!body.field_type || !VALID_FIELD_TYPES.includes(body.field_type as typeof VALID_FIELD_TYPES[number])) {
    return NextResponse.json(
      { error: `field_type must be one of: ${VALID_FIELD_TYPES.join(', ')}` },
      { status: 400 }
    )
  }

  const client = createServiceClient()
  const { data, error: dbErr } = await client
    .from('brief_template_questions')
    .insert({
      template_id: tid,
      label: body.label.trim(),
      description: body.description?.trim() ?? null,
      field_type: body.field_type,
      sort_order: body.sort_order ?? 0,
      required: body.required ?? false,
    })
    .select()
    .single()

  if (dbErr) {
    console.error('brief-template-questions POST error:', dbErr)
    return NextResponse.json({ error: 'Failed to create question' }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}

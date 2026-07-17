import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { createAuthServerClient } from '@/lib/supabase-server'

type Params = { params: Promise<{ tid: string }> }

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
    .from('brief_templates')
    .select('*, brief_template_questions(id, label, description, field_type, sort_order, required, created_at)')
    .eq('id', tid)
    .order('sort_order', { referencedTable: 'brief_template_questions', ascending: true })
    .single()

  if (dbErr || !data) {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 })
  }

  return NextResponse.json(data)
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { error } = await requireOwnerSupervisor()
  if (error) return error

  const { tid } = await params

  let body: { name?: string; description?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const updates: Record<string, string | null> = {}
  if (body.name !== undefined) updates.name = body.name.trim()
  if (body.description !== undefined) updates.description = body.description?.trim() ?? null

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
  }

  const client = createServiceClient()
  const { data, error: dbErr } = await client
    .from('brief_templates')
    .update(updates)
    .eq('id', tid)
    .select()
    .single()

  if (dbErr || !data) {
    console.error('brief-templates PATCH error:', dbErr)
    return NextResponse.json({ error: 'Failed to update template' }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { error } = await requireOwnerSupervisor()
  if (error) return error

  const { tid } = await params
  const client = createServiceClient()

  const { error: dbErr } = await client
    .from('brief_templates')
    .delete()
    .eq('id', tid)

  if (dbErr) {
    console.error('brief-templates DELETE error:', dbErr)
    return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 })
  }

  return new NextResponse(null, { status: 204 })
}

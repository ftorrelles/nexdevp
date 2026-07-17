import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { createAuthServerClient } from '@/lib/supabase-server'

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

export async function GET() {
  const { user, error } = await requireOwnerSupervisor()
  if (error) return error

  const client = createServiceClient()
  const { data, error: dbErr } = await client
    .from('brief_templates')
    .select('id, name, description, created_at')
    .order('created_at', { ascending: false })

  if (dbErr) {
    console.error('brief-templates GET error:', dbErr)
    return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const { user, error } = await requireOwnerSupervisor()
  if (error) return error

  let body: { name?: string; description?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!body.name?.trim()) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 })
  }

  const client = createServiceClient()
  const { data, error: dbErr } = await client
    .from('brief_templates')
    .insert({
      name: body.name.trim(),
      description: body.description?.trim() ?? null,
      created_by: user!.id,
    })
    .select()
    .single()

  if (dbErr) {
    console.error('brief-templates POST error:', dbErr)
    return NextResponse.json({ error: 'Failed to create template' }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { createAuthServerClient } from '@/lib/supabase-server'
import { sendDeliverableActivityEmail } from '@/lib/email'

type Params = Promise<{ id: string; did: string }>

type CommentRow = {
  id: string
  body: string
  kind: string
  author_role: string
  created_at: string
}

async function getProject(client: ReturnType<typeof createServiceClient>, id: string) {
  const { data } = await client.from('projects').select('id, name, client_user_id').eq('id', id).maybeSingle()
  return data as { id: string; name: string; client_user_id: string | null } | null
}

export async function POST(req: NextRequest, { params }: { params: Params }) {
  const supabase = await createAuthServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = user.app_metadata?.role as string | undefined
  if (!role || role === 'vendor') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id, did } = await params
  const bodyJson = await req.json()
  const kind = bodyJson.kind as string
  const body = bodyJson.body as string | undefined

  if (role === 'developer' && kind !== 'comentario') {
    return NextResponse.json({ error: 'Developer can only post kind=comentario' }, { status: 403 })
  }

  if (!body || !body.trim()) {
    return NextResponse.json({ error: 'body is required' }, { status: 422 })
  }

  if (!['comentario', 'aprobacion', 'cambios'].includes(kind)) {
    return NextResponse.json({ error: 'Invalid kind' }, { status: 422 })
  }

  const client = createServiceClient()

  if (role === 'client') {
    // Client branch
    const project = await getProject(client, id)
    if (!project || project.client_user_id !== user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const { data: deliverable } = await client
      .from('project_deliverables')
      .select('id, status, name')
      .eq('id', did)
      .eq('project_id', id)
      .maybeSingle()

    if (!deliverable) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    if (kind === 'aprobacion' || kind === 'cambios') {
      if (deliverable.status !== 'en_revision') {
        return NextResponse.json({ error: `Cannot ${kind} when status is ${deliverable.status}` }, { status: 400 })
      }

      const newStatus = kind === 'aprobacion' ? 'aprobado' : 'cambios_solicitados'
      const { error: updateErr } = await client
        .from('project_deliverables')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', did)

      if (updateErr) {
        return NextResponse.json({ error: updateErr.message }, { status: 500 })
      }
    }

    const { data: comment, error: insertErr } = await client
      .from('deliverable_comments')
      .insert({
        deliverable_id: did,
        author_user_id: user.id,
        author_role: 'client',
        body: body.trim(),
        kind,
      })
      .select('id, body, kind, author_role, created_at')
      .maybeSingle()

    if (insertErr || !comment) {
      return NextResponse.json({ error: insertErr?.message ?? 'Failed to insert' }, { status: 500 })
    }

    // Best-effort email notification to owner/supervisor
    try {
      const { data: { users } } = await client.auth.admin.listUsers()
      const adminEmails = (users ?? [])
        .filter((u) => ['owner', 'supervisor'].includes(u.app_metadata?.role ?? ''))
        .map((u) => u.email)
        .filter(Boolean) as string[]

      if (adminEmails.length > 0 && user.email) {
        await sendDeliverableActivityEmail(
          adminEmails,
          project.name,
          deliverable.name,
          kind as 'comentario' | 'aprobacion' | 'cambios',
          user.email,
          id,
        )
      }
    } catch (err) {
      console.error('Failed to send notification email:', err)
    }

    return NextResponse.json(comment, { status: 201 })
  }

  // Owner/supervisor branch
  if (kind !== 'comentario') {
    return NextResponse.json({ error: 'Admin can only post kind=comentario' }, { status: 400 })
  }

  const project = await getProject(client, id)
  if (!project) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const { data: comment, error: insertErr } = await client
    .from('deliverable_comments')
    .insert({
      deliverable_id: did,
      author_user_id: user.id,
      author_role: role,
      body: body.trim(),
      kind: 'comentario',
    })
    .select('id, body, kind, author_role, created_at')
    .maybeSingle()

  if (insertErr || !comment) {
    return NextResponse.json({ error: insertErr?.message ?? 'Failed to insert' }, { status: 500 })
  }

  return NextResponse.json(comment, { status: 201 })
}

export async function GET(_req: NextRequest, { params }: { params: Params }) {
  const supabase = await createAuthServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = user.app_metadata?.role as string | undefined
  if (role === 'vendor') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id, did } = await params
  const client = createServiceClient()

  if (role === 'client') {
    const project = await getProject(client, id)
    if (!project || project.client_user_id !== user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
  } else if (!role || !['owner', 'supervisor'].includes(role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data: comments } = await client
    .from('deliverable_comments')
    .select('id, body, kind, author_role, created_at')
    .eq('deliverable_id', did)
    .order('created_at', { ascending: true })

  return NextResponse.json((comments ?? []) as CommentRow[])
}

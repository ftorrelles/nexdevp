import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { createAuthServerClient } from '@/lib/supabase-server'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createAuthServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = user.app_metadata?.role ?? 'vendor'
  if (role !== 'owner' && role !== 'supervisor') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const client = createServiceClient()

  // Fetch project with lead email
  const { data: project, error: projErr } = await client
    .from('projects')
    .select('*, leads!inner(email)')
    .eq('id', id)
    .maybeSingle()

  if (projErr || !project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  const leadEmail = (project as unknown as { leads: { email: string | null } }).leads?.email
  if (!leadEmail) {
    return NextResponse.json({ error: 'Lead has no email address' }, { status: 422 })
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.nexdevp.com'
  const redirectTo = `${siteUrl}/auth/setup`

  // Re-invite path
  if (project.client_user_id) {
    try {
      await client.auth.admin.inviteUserByEmail(leadEmail, { redirectTo })
    } catch {
      // Supabase errors for already-active users — still return 200
    }
    return NextResponse.json({
      email: project.client_email ?? leadEmail,
      client_user_id: project.client_user_id,
      already_active: false,
    })
  }

  // First invite path
  try {
    const { data: invited, error: inviteErr } = await client.auth.admin.inviteUserByEmail(leadEmail, { redirectTo })
    if (inviteErr || !invited?.user) {
      return NextResponse.json({ error: inviteErr?.message ?? 'Failed to invite user' }, { status: 500 })
    }

    const invitedUser = invited.user

    const { error: roleErr } = await client.auth.admin.updateUserById(invitedUser.id, {
      app_metadata: { role: 'client' },
    })
    if (roleErr) {
      return NextResponse.json({ error: roleErr.message }, { status: 500 })
    }

    const { error: updateErr } = await client
      .from('projects')
      .update({
        client_user_id: invitedUser.id,
        client_email: leadEmail,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 })
    }

    return NextResponse.json({
      email: leadEmail,
      client_user_id: invitedUser.id,
      already_active: false,
    })
  } catch (err) {
    console.error('Invite error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { createAuthServerClient } from '@/lib/supabase-server'
import { createServiceClient } from '@/lib/supabase'
import type { AdminUser, UserRole } from '@/lib/supabase'

async function requireOwner() {
  const supabase = await createAuthServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.app_metadata?.role !== 'owner') return null
  return user
}

export async function GET() {
  const user = await requireOwner()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const adminClient = createServiceClient()
  const { data: { users }, error } = await adminClient.auth.admin.listUsers()
  if (error) return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })

  // The staff user manager only lists staff; applicants live in /admin/applicants.
  const adminUsers: AdminUser[] = users
    .filter((u) => (u.app_metadata?.role ?? 'vendor') !== 'applicant')
    .map((u) => ({
      id: u.id,
      email: u.email ?? '',
      role: (u.app_metadata?.role ?? 'vendor') as UserRole,
    }))

  return NextResponse.json({ users: adminUsers })
}

export async function POST(req: NextRequest) {
  const user = await requireOwner()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { email, role } = await req.json()
  if (!email || !role) {
    return NextResponse.json({ error: 'email y role son requeridos' }, { status: 400 })
  }

  const validRoles: UserRole[] = ['owner', 'supervisor', 'vendor']
  if (!validRoles.includes(role)) {
    return NextResponse.json({ error: 'Rol inválido' }, { status: 400 })
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.nexdevp.com'

  const adminClient = createServiceClient()
  const { data, error } = await adminClient.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${siteUrl}/auth/callback?next=/admin/profile`,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  // Role lives in app_metadata (admin-only, not user-editable). The invite API
  // can't set app_metadata directly, so apply it right after creating the user.
  const { error: roleError } = await adminClient.auth.admin.updateUserById(data.user.id, {
    app_metadata: { role },
  })

  if (roleError) {
    return NextResponse.json({ error: roleError.message }, { status: 400 })
  }

  return NextResponse.json({
    user: { id: data.user.id, email: data.user.email ?? '', role } satisfies AdminUser,
  })
}

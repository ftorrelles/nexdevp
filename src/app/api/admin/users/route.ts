import { NextRequest, NextResponse } from 'next/server'
import { createAuthServerClient } from '@/lib/supabase-server'
import { createServiceClient } from '@/lib/supabase'
import type { AdminUser, UserRole } from '@/lib/supabase'

async function requireOwner() {
  const supabase = await createAuthServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.user_metadata?.role !== 'owner') return null
  return user
}

export async function GET() {
  const user = await requireOwner()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const adminClient = createServiceClient()
  const { data: { users }, error } = await adminClient.auth.admin.listUsers()
  if (error) return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })

  const adminUsers: AdminUser[] = users.map((u) => ({
    id: u.id,
    email: u.email ?? '',
    role: (u.user_metadata?.role ?? 'vendor') as UserRole,
  }))

  return NextResponse.json({ users: adminUsers })
}

export async function POST(req: NextRequest) {
  const user = await requireOwner()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { email, password, role } = await req.json()
  if (!email || !password || !role) {
    return NextResponse.json({ error: 'email, password y role son requeridos' }, { status: 400 })
  }

  const validRoles: UserRole[] = ['owner', 'supervisor', 'vendor']
  if (!validRoles.includes(role)) {
    return NextResponse.json({ error: 'Rol inválido' }, { status: 400 })
  }

  const adminClient = createServiceClient()
  const { data, error } = await adminClient.auth.admin.createUser({
    email,
    password,
    user_metadata: { role },
    email_confirm: true,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({
    user: { id: data.user.id, email: data.user.email ?? '', role } satisfies AdminUser,
  })
}

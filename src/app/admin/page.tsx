import { redirect } from 'next/navigation'
import { createAuthServerClient } from '@/lib/supabase-server'
import { createServiceClient, type Lead, type AdminUser, type UserRole } from '@/lib/supabase'
import { AdminCRM } from './AdminCRM'

export default async function AdminPage() {
  const supabase = await createAuthServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/admin/login')
  }

  const role = (user.user_metadata?.role ?? 'vendor') as UserRole
  const client = createServiceClient()

  const query = client.from('leads').select('*').order('created_at', { ascending: false })
  if (role === 'vendor') query.eq('assigned_to', user.id)

  const { data: leads, error } = await query
  if (error) console.error('Failed to fetch leads:', error)

  let vendorUsers: AdminUser[] = []
  if (role === 'owner' || role === 'supervisor') {
    const { data: { users } } = await client.auth.admin.listUsers()
    vendorUsers = users.map((u) => ({
      id: u.id,
      email: u.email ?? '',
      role: (u.user_metadata?.role ?? 'vendor') as AdminUser['role'],
    }))
  }

  return (
    <AdminCRM
      leads={(leads as Lead[]) ?? []}
      role={role}
      currentUserId={user.id}
      vendorUsers={vendorUsers}
    />
  )
}

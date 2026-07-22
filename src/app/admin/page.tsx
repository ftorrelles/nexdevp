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

  const role = (user.app_metadata?.role ?? 'vendor') as UserRole
  const client = createServiceClient()

  const query = client.from('leads').select('*').order('created_at', { ascending: false })
  // A vendor sees leads assigned to him OR created by him.
  if (role === 'vendor') query.or(`assigned_to.eq.${user.id},created_by.eq.${user.id}`)

  const { data: leads, error } = await query
  if (error) console.error('Failed to fetch leads:', error)

  let vendorUsers: AdminUser[] = []
  if (role === 'owner' || role === 'supervisor') {
    const { data: { users } } = await client.auth.admin.listUsers()
    vendorUsers = users.map((u) => ({
      id: u.id,
      email: u.email ?? '',
      role: (u.app_metadata?.role ?? 'vendor') as AdminUser['role'],
    }))
  }

  // Fetch existing projects to know which leads already have projects
  const { data: existingProjects } = await client
    .from('projects')
    .select('lead_id')
  const projectLeadIds = new Set(existingProjects?.map((p) => p.lead_id) ?? [])

  return (
    <AdminCRM
      leads={(leads as Lead[]) ?? []}
      role={role}
      currentUserId={user.id}
      currentUserEmail={user.email ?? ''}
      currentUserName={user.user_metadata?.full_name as string | undefined}
      vendorUsers={vendorUsers}
      projectLeadIds={projectLeadIds}
    />
  )
}

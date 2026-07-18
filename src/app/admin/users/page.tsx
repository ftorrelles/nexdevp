import { redirect } from 'next/navigation'
import { createAuthServerClient } from '@/lib/supabase-server'
import { createServiceClient } from '@/lib/supabase'
import type { AdminUser, UserRole } from '@/lib/supabase'
import { UserManager } from './UserManager'
import { AdminNav } from '../AdminNav'

export default async function UsersPage() {
  const supabase = await createAuthServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/admin/login')
  if (user.app_metadata?.role !== 'owner') redirect('/admin')

  const adminClient = createServiceClient()
  const { data: { users } } = await adminClient.auth.admin.listUsers()

  // List every role except applicant — applicants have their own dedicated page.
  // Clients are shown read-only (grouped by role tab) since they're managed
  // per-project via the "invite client" flow, not through the role-change select.
  const { data: projectsWithClients } = await adminClient
    .from('projects')
    .select('name, client_user_id')
    .not('client_user_id', 'is', null)
  const projectByClientId = new Map((projectsWithClients ?? []).map((p) => [p.client_user_id as string, p.name]))

  const adminUsers: AdminUser[] = users
    .filter((u) => (u.app_metadata?.role ?? 'vendor') !== 'applicant')
    .map((u) => ({
      id: u.id,
      email: u.email ?? '',
      role: (u.app_metadata?.role ?? 'vendor') as UserRole,
      projectName: projectByClientId.get(u.id),
    }))

  return (
    <div className="min-h-screen bg-nex-black text-nex-white">
      <AdminNav role="owner" currentPath="/admin/users" email={user.email ?? ''} name={user.user_metadata?.full_name as string | undefined} />
      <main className="px-6 py-8 max-w-4xl mx-auto">
        <UserManager initialUsers={adminUsers} currentUserId={user.id} />
      </main>
    </div>
  )
}

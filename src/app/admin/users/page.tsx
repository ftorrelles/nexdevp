import { redirect } from 'next/navigation'
import { createAuthServerClient } from '@/lib/supabase-server'
import { createServiceClient } from '@/lib/supabase'
import { STAFF_ROLES, type AdminUser, type UserRole } from '@/lib/supabase'
import { UserManager } from './UserManager'
import { AdminNav } from '../AdminNav'

export default async function UsersPage() {
  const supabase = await createAuthServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/admin/login')
  if (user.app_metadata?.role !== 'owner') redirect('/admin')

  const adminClient = createServiceClient()
  const { data: { users } } = await adminClient.auth.admin.listUsers()

  // The staff user manager only lists staff; applicants live in /admin/applicants
  // and clients are managed per-project via the "invite client" flow.
  const adminUsers: AdminUser[] = users
    .filter((u) => STAFF_ROLES.includes((u.app_metadata?.role ?? 'vendor') as UserRole))
    .map((u) => ({
      id: u.id,
      email: u.email ?? '',
      role: (u.app_metadata?.role ?? 'vendor') as UserRole,
    }))

  return (
    <div className="min-h-screen bg-nex-black text-nex-white">
      <AdminNav role="owner" currentPath="/admin/users" email={user.email ?? ''} />
      <main className="px-6 py-8 max-w-4xl mx-auto">
        <UserManager initialUsers={adminUsers} currentUserId={user.id} />
      </main>
    </div>
  )
}

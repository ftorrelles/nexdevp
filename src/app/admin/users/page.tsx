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

  // The staff user manager only lists staff; applicants live in /admin/applicants.
  const adminUsers: AdminUser[] = users
    .filter((u) => (u.app_metadata?.role ?? 'vendor') !== 'applicant')
    .map((u) => ({
      id: u.id,
      email: u.email ?? '',
      role: (u.app_metadata?.role ?? 'vendor') as UserRole,
    }))

  return (
    <div className="min-h-screen bg-nex-black text-nex-white">
      <AdminNav role="owner" currentPath="/admin/users" />
      <main className="px-6 py-8 max-w-4xl mx-auto">
        <UserManager initialUsers={adminUsers} currentUserId={user.id} />
      </main>
    </div>
  )
}

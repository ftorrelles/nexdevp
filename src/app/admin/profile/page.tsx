import { redirect } from 'next/navigation'
import { createAuthServerClient } from '@/lib/supabase-server'
import type { UserRole } from '@/lib/supabase'
import { AdminNav } from '../AdminNav'
import { ChangePasswordForm } from './ChangePasswordForm'

export default async function ProfilePage() {
  const supabase = await createAuthServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/admin/login')

  const role = (user.app_metadata?.role ?? 'vendor') as UserRole

  return (
    <div className="min-h-screen bg-nex-black text-nex-white">
      <AdminNav role={role} currentPath="/admin/profile" />
      <main className="px-6 py-8 max-w-md mx-auto">
        <h2 className="font-jost font-bold text-xl text-nex-white mb-1">Mi cuenta</h2>
        <p className="font-jost text-sm text-nex-grey mb-8">{user.email}</p>
        <ChangePasswordForm />
      </main>
    </div>
  )
}

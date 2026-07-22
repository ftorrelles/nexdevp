import { redirect } from 'next/navigation'
import { createAuthServerClient } from '@/lib/supabase-server'
import type { UserRole } from '@/lib/supabase'
import { CapacitacionView } from './CapacitacionView'

export default async function CapacitacionPage(): Promise<React.JSX.Element> {
  const supabase = await createAuthServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/admin/login')
  }

  const role = (user.app_metadata?.role ?? 'vendor') as UserRole

  return (
    <CapacitacionView
      role={role}
      email={user.email ?? ''}
      name={user.user_metadata?.full_name as string | undefined}
    />
  )
}

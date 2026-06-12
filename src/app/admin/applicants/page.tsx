import { redirect } from 'next/navigation'
import { createAuthServerClient } from '@/lib/supabase-server'
import { createServiceClient, withSignedCvUrls, type Career, type CareerApplication, type UserRole } from '@/lib/supabase'
import { AdminApplicants } from './AdminApplicants'

export default async function ApplicantsPage(): Promise<React.JSX.Element> {
  const supabase = await createAuthServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/admin/login')
  }

  const role = (user.app_metadata?.role ?? 'vendor') as UserRole

  // Only owners and supervisors have access to Applicants section
  if (role !== 'owner' && role !== 'supervisor') {
    redirect('/admin')
  }

  const client = createServiceClient()

  // Fetch careers, applications, and staff users in parallel
  const [careersResult, applicationsResult, usersResult] = await Promise.all([
    client.from('careers').select('*').order('created_at', { ascending: false }),
    client.from('career_applications').select('*, careers(title_es, title_en)').order('created_at', { ascending: false }),
    client.auth.admin.listUsers(),
  ])

  if (careersResult.error) {
    console.error('Failed to fetch careers:', careersResult.error)
  }
  if (applicationsResult.error) {
    console.error('Failed to fetch applications:', applicationsResult.error)
  }

  const careers = (careersResult.data as Career[]) ?? []

  // Map staff user ids to emails so the UI can show who handled each application.
  const emailById = new Map<string, string>()
  for (const u of usersResult.data?.users ?? []) {
    if (u.email) emailById.set(u.id, u.email)
  }

  const signed = await withSignedCvUrls(
    client,
    (applicationsResult.data as CareerApplication[]) ?? []
  )
  const applications: CareerApplication[] = signed.map((a) => ({
    ...a,
    handled_by_email: a.handled_by ? emailById.get(a.handled_by) ?? null : null,
  }))

  return (
    <AdminApplicants
      careers={careers}
      applications={applications}
      role={role}
      currentUserId={user.id}
      currentUserEmail={user.email ?? ''}
    />
  )
}

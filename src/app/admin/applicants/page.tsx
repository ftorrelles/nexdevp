import { redirect } from 'next/navigation'
import { createAuthServerClient } from '@/lib/supabase-server'
import { createServiceClient, type Career, type CareerApplication, type UserRole } from '@/lib/supabase'
import { AdminApplicants } from './AdminApplicants'

export default async function ApplicantsPage() {
  const supabase = await createAuthServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/admin/login')
  }

  const role = (user.user_metadata?.role ?? 'vendor') as UserRole

  // Only owners and supervisors have access to Applicants section
  if (role !== 'owner' && role !== 'supervisor') {
    redirect('/admin')
  }

  const client = createServiceClient()

  // Fetch careers and applications in parallel
  const [careersResult, applicationsResult] = await Promise.all([
    client.from('careers').select('*').order('created_at', { ascending: false }),
    client.from('career_applications').select('*, careers(title_es, title_en)').order('created_at', { ascending: false })
  ])

  if (careersResult.error) {
    console.error('Failed to fetch careers:', careersResult.error)
  }
  if (applicationsResult.error) {
    console.error('Failed to fetch applications:', applicationsResult.error)
  }

  const careers = (careersResult.data as Career[]) ?? []
  const applications = (applicationsResult.data as CareerApplication[]) ?? []

  return (
    <AdminApplicants
      careers={careers}
      applications={applications}
      role={role}
      currentUserId={user.id}
    />
  )
}

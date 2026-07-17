import { redirect } from 'next/navigation'
import { createAuthServerClient } from '@/lib/supabase-server'
import { createServiceClient, type UserRole } from '@/lib/supabase'
import { computeProgressPct } from '@/lib/projects'
import { AdminNav } from '@/app/admin/AdminNav'
import { ProjectEditor } from './ProjectEditor'

export default async function ProyectoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<React.JSX.Element> {
  const supabase = await createAuthServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const role = (user.app_metadata?.role ?? 'vendor') as UserRole
  if (!['owner', 'supervisor', 'vendor'].includes(role)) redirect('/admin')

  const { id } = await params
  const client = createServiceClient()

  let query = client
    .from('projects')
    .select('*, leads!inner(id, nombre, assigned_to, email)')
    .eq('id', id)

  if (role === 'vendor') {
    query = query.eq('leads.assigned_to', user.id)
  }

  const { data: project, error: projErr } = await query.maybeSingle()

  if (projErr || !project) {
    redirect('/admin/proyectos')
  }

  const { data: deliverables } = await client
    .from('project_deliverables')
    .select('*')
    .eq('project_id', id)
    .order('sort_order', { ascending: true })

  const progressPct = computeProgressPct(deliverables ?? [])

  // Fetch vendor users for assigned_to dropdown (owner/supervisor only)
  let vendorUsers: { id: string; email: string }[] = []
  if (role === 'owner' || role === 'supervisor') {
    const { data: { users } } = await client.auth.admin.listUsers()
    vendorUsers = (users ?? [])
      .filter((u) => ['owner', 'supervisor', 'vendor'].includes(u.app_metadata?.role ?? ''))
      .map((u) => ({ id: u.id, email: u.email ?? u.id }))
      .sort((a, b) => a.email.localeCompare(b.email))
  }

  const projectData = {
    id: project.id,
    name: project.name,
    status: project.status,
    vercel_url: project.vercel_url,
    progress_pct: progressPct,
    deliverables: (deliverables ?? []).map((d) => ({
      id: d.id,
      name: d.name,
      hours: d.hours,
      status: d.status,
      assigned_to: d.assigned_to,
      sort_order: d.sort_order,
    })),
  }

  return (
    <div className="min-h-screen bg-nex-black text-nex-white">
      <AdminNav role={role} currentPath="/admin/proyectos" />
      <main className="px-4 sm:px-6 py-10 max-w-4xl mx-auto">
        <ProjectEditor
          project={projectData}
          role={role}
          vendorUsers={vendorUsers}
          clientEmail={project.client_email as string | null}
          leadEmail={(project as unknown as { leads: { email: string | null } }).leads?.email ?? null}
        />
      </main>
    </div>
  )
}

import { redirect } from 'next/navigation'
import { createAuthServerClient } from '@/lib/supabase-server'
import { createServiceClient, type UserRole, type BriefTemplate, type ProjectBrief, type ProjectBriefQuestion, type ProjectBriefAnswer } from '@/lib/supabase'
import { computeProgressPct } from '@/lib/projects'
import { withSignedBriefUrls } from '@/lib/brief-storage'
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
  if (!['owner', 'supervisor', 'vendor', 'developer'].includes(role)) redirect('/admin')

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

  // Developer: verify they have at least one deliverable assigned in this project
  if (role === 'developer') {
    const { data: assigned } = await client
      .from('project_deliverables')
      .select('id')
      .eq('project_id', id)
      .eq('assigned_to', user.id)
      .limit(1)
      .maybeSingle()
    if (!assigned) redirect('/admin/proyectos')
  }

  const { data: deliverables } = await client
    .from('project_deliverables')
    .select('*, project_deliverable_parts(id, name, done, done_at, done_by, sort_order)')
    .eq('project_id', id)
    .order('sort_order', { ascending: true })

  const progressPct = computeProgressPct(deliverables ?? [])

  // Fetch assignable users for the dropdown (owner/supervisor only can assign)
  let vendorUsers: { id: string; email: string; role: string }[] = []
  if (role === 'owner' || role === 'supervisor') {
    const { data: { users } } = await client.auth.admin.listUsers()
    vendorUsers = (users ?? [])
      .filter((u) => ['owner', 'supervisor', 'developer', 'vendor'].includes(u.app_metadata?.role ?? ''))
      .map((u) => ({ id: u.id, email: u.email ?? u.id, role: u.app_metadata?.role ?? '' }))
      .sort((a, b) => a.email.localeCompare(b.email))
  }

  // Fetch brief data + templates for BriefSection
  type BriefWithQuestions = ProjectBrief & {
    project_brief_questions: (ProjectBriefQuestion & { project_brief_answers: ProjectBriefAnswer[] })[]
  }
  let briefData: BriefWithQuestions | null = null
  let templates: BriefTemplate[] = []

  const { data: rawBrief } = await client
    .from('project_briefs')
    .select(`
      *,
      project_brief_questions (
        *,
        project_brief_answers (*)
      )
    `)
    .eq('project_id', id)
    .maybeSingle()

  if (rawBrief) {
    // PostgREST returns a single object (not an array) when a UNIQUE constraint exists
    // on brief_question_id. Normalize to always produce an array regardless of cardinality.
    const toAnswerArray = (val: unknown): ProjectBriefAnswer[] => {
      if (!val) return []
      if (Array.isArray(val)) return val as ProjectBriefAnswer[]
      return [val as ProjectBriefAnswer]
    }

    const questions = ((rawBrief.project_brief_questions ?? []) as (ProjectBriefQuestion & { project_brief_answers: unknown })[])
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((q) => ({ ...q, project_brief_answers: toAnswerArray(q.project_brief_answers) }))

    const allAnswers = questions.flatMap((q) => q.project_brief_answers)
    const signedAnswers = await withSignedBriefUrls(allAnswers)
    const signedMap = new Map(signedAnswers.map((a) => [a.id, a]))
    briefData = {
      ...(rawBrief as unknown as ProjectBrief),
      project_brief_questions: questions.map((q) => ({
        ...q,
        project_brief_answers: q.project_brief_answers.map((a) => signedMap.get(a.id) ?? a),
      })),
    }
  }

  if (role === 'owner' || role === 'supervisor') {
    const { data: tmpl } = await client
      .from('brief_templates')
      .select('*')
      .order('created_at', { ascending: false })
    templates = (tmpl ?? []) as BriefTemplate[]
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
      requires_client_approval: d.requires_client_approval ?? true,
      effective_price: d.effective_price ?? null,
      parts: ((d.project_deliverable_parts ?? []) as {
        id: string; name: string; done: boolean; sort_order: number
      }[]).sort((a, b) => a.sort_order - b.sort_order),
    })),
  }

  return (
    <div className="min-h-screen bg-nex-black text-nex-white">
      <AdminNav role={role} currentPath="/admin/proyectos" email={user.email ?? ''} name={user.user_metadata?.full_name as string | undefined} />
      <main className="px-4 sm:px-6 py-10 max-w-4xl mx-auto">
        <ProjectEditor
          project={projectData}
          role={role}
          currentUserId={user.id}
          vendorUsers={vendorUsers}
          clientEmail={project.client_email as string | null}
          leadEmail={(project as unknown as { leads: { email: string | null } }).leads?.email ?? null}
          initialBrief={briefData}
          templates={templates}
        />
      </main>
    </div>
  )
}

import { redirect, notFound } from 'next/navigation'
import { setRequestLocale } from 'next-intl/server'
import { createAuthServerClient } from '@/lib/supabase-server'
import { computeProgressPct } from '@/lib/projects'
import { Link } from '@/i18n/navigation'
import type { Locale } from '@/content/types'

type Props = {
  params: Promise<{ locale: string; id: string }>
}

const STATUS_LABELS: Record<Locale, Record<string, string>> = {
  es: { activo: 'Activo', pausado: 'Pausado', entregado: 'Entregado', cerrado: 'Cerrado' },
  en: { activo: 'Active', pausado: 'Paused', entregado: 'Delivered', cerrado: 'Closed' },
}

const STATUS_COLORS: Record<string, string> = {
  activo: 'text-nex-green bg-nex-green/10 border-nex-green/30',
  pausado: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30',
  entregado: 'text-blue-400 bg-blue-400/10 border-blue-400/30',
  cerrado: 'text-nex-grey bg-white/5 border-white/20',
}

const DELIVERABLE_STATUS_LABELS: Record<Locale, Record<string, string>> = {
  es: {
    pendiente: 'Por iniciar',
    en_curso: 'En desarrollo',
    en_revision: 'En revisión',
    aprobado: 'Completado',
    cambios_solicitados: 'Ajustes en curso',
  },
  en: {
    pendiente: 'Not started',
    en_curso: 'In development',
    en_revision: 'Under review',
    aprobado: 'Completed',
    cambios_solicitados: 'Adjustments in progress',
  },
}

const DELIVERABLE_STATUS_COLORS: Record<string, string> = {
  pendiente: 'text-nex-grey bg-white/5 border-white/20',
  en_curso: 'text-blue-400 bg-blue-400/10 border-blue-400/30',
  en_revision: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30',
  aprobado: 'text-nex-green bg-nex-green/10 border-nex-green/30',
  cambios_solicitados: 'text-red-400 bg-red-400/10 border-red-400/30',
}

export default async function ProyectoDetailPage({ params }: Props): Promise<React.JSX.Element> {
  const { locale, id } = await params
  const loc = locale as Locale
  setRequestLocale(loc)

  const auth = await createAuthServerClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) redirect('/admin/login')
  if (user.app_metadata?.role !== 'client') redirect('/admin')

  // Fetch project with deliverables (no assigned_to, no hours in rendered output)
  const { data: project } = await auth
    .from('projects')
    .select('id, name, status, vercel_url, project_deliverables(id, name, status, sort_order)')
    .eq('id', id)
    .eq('client_user_id', user.id)
    .maybeSingle()

  if (!project) notFound()

  // Fetch hours separately for progress computation only
  const { data: progressData } = await auth
    .from('project_deliverables')
    .select('hours, status')
    .eq('project_id', id)

  const pct = computeProgressPct(progressData ?? [])
  const progressColor = pct === 100 ? 'bg-nex-green' : pct >= 50 ? 'bg-blue-400' : 'bg-yellow-400'

  type DeliverableRow = { id: string; name: string; status: string; sort_order: number }
  const deliverables = (project.project_deliverables as DeliverableRow[] | undefined) ?? []
    .sort((a: DeliverableRow, b: DeliverableRow) => a.sort_order - b.sort_order)

  return (
    <main className="px-4 sm:px-6 py-10 max-w-3xl mx-auto">
      {/* Back link */}
      <Link
        href="/proyecto"
        className="inline-flex items-center gap-2 font-dm-mono text-[10px] tracking-[0.2em] uppercase text-nex-grey hover:text-nex-white transition-colors mb-8"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M8 2L4 6l4 4" />
        </svg>
        {loc === 'es' ? '← Volver a proyectos' : '← Back to projects'}
      </Link>

      {/* Project header */}
      <div className="bg-nex-dark border border-white/10 rounded-xl p-6 space-y-6">
        <div className="flex items-center justify-between gap-4">
          <h1 className="font-jost font-bold text-2xl text-nex-white">{project.name}</h1>
          <span className={[
            'font-dm-mono text-[10px] uppercase tracking-wider rounded-full border px-2.5 py-1 shrink-0',
            STATUS_COLORS[project.status] ?? STATUS_COLORS.activo,
          ].join(' ')}>
            {STATUS_LABELS[loc][project.status] ?? project.status}
          </span>
        </div>

        {/* Progress bar */}
        <div>
          <p className="font-dm-mono text-[10px] uppercase tracking-[0.1em] text-nex-grey mb-2">
            {loc === 'es' ? 'Progreso general' : 'Overall progress'}
          </p>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${progressColor} transition-all`} style={{ width: `${pct}%` }} />
            </div>
            <span className="font-jost font-bold text-lg text-nex-white">{pct}%</span>
          </div>
        </div>

        {/* Vercel link */}
        {project.vercel_url && (
          <a
            href={project.vercel_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-nex-green text-nex-black font-jost font-bold text-sm py-2.5 px-5 rounded-lg hover:bg-nex-green/90 transition-colors"
          >
            {loc === 'es' ? 'Ver sitio →' : 'View site →'}
          </a>
        )}
      </div>

      {/* Deliverables */}
      <div className="bg-nex-dark border border-white/10 rounded-xl p-6 mt-6">
        <p className="font-dm-mono text-[10px] tracking-[0.15em] uppercase text-nex-green mb-4">
          {loc === 'es' ? 'Entregables' : 'Deliverables'}
        </p>

        {deliverables.length === 0 ? (
          <p className="font-jost text-sm text-nex-grey italic py-4 text-center">
            {loc === 'es'
              ? 'Todavía no hay entregables cargados.'
              : 'No deliverables have been added yet.'}
          </p>
        ) : (
          <div className="space-y-2">
            {deliverables.map((d: DeliverableRow) => (
              <div
                key={d.id}
                className="flex items-center justify-between gap-4 bg-nex-black rounded-lg px-4 py-3"
              >
                <p className="font-jost text-sm text-nex-white">{d.name}</p>
                <span className={[
                  'font-dm-mono text-[10px] uppercase tracking-wider rounded-full border px-2.5 py-0.5 shrink-0',
                  DELIVERABLE_STATUS_COLORS[d.status] ?? DELIVERABLE_STATUS_COLORS.pendiente,
                ].join(' ')}>
                  {DELIVERABLE_STATUS_LABELS[loc][d.status] ?? d.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}

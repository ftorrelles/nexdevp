import { redirect } from 'next/navigation'
import { setRequestLocale } from 'next-intl/server'
import { createAuthServerClient } from '@/lib/supabase-server'
import { createServiceClient } from '@/lib/supabase'
import { computeProgressPct } from '@/lib/projects'
import { Link } from '@/i18n/navigation'
import type { Locale } from '@/content/types'

type Props = {
  params: Promise<{ locale: string }>
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

export default async function ProyectoListPage({ params }: Props): Promise<React.JSX.Element> {
  const { locale } = await params
  const loc = locale as Locale
  setRequestLocale(loc)

  const auth = await createAuthServerClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) redirect('/admin/login')
  if (user.app_metadata?.role !== 'client') redirect('/admin')

  const db = createServiceClient()
  const { data: projects } = await db
    .from('projects')
    .select('id, name, status, project_deliverables(hours, status)')
    .eq('client_user_id', user.id)
    .order('created_at', { ascending: false })

  const rows = (projects as unknown as {
    id: string
    name: string
    status: string
    project_deliverables: { hours: number; status: string }[]
  }[]) ?? []

  return (
    <main className="px-4 sm:px-6 py-10 max-w-3xl mx-auto">
      <div className="mb-10">
        <h1 className="font-jost font-bold text-3xl text-nex-white mb-1">
          {loc === 'es' ? 'Tus proyectos' : 'Your projects'}
        </h1>
        <p className="font-jost text-sm text-nex-grey">
          {loc === 'es' ? 'El estado de tu desarrollo.' : 'The status of your development.'}
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="bg-nex-dark border border-white/10 rounded-2xl p-8 text-center">
          <p className="font-jost text-sm text-nex-grey">
            {loc === 'es'
              ? 'Todavía no tenés proyectos activos.'
              : "You don't have any active projects yet."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {rows.map((p) => {
            const pct = computeProgressPct(p.project_deliverables ?? [])
            const color = pct === 100 ? 'bg-nex-green' : pct >= 50 ? 'bg-blue-400' : 'bg-yellow-400'
            return (
              <Link
                key={p.id}
                href={`/proyecto/${p.id}`}
                className="bg-nex-dark border border-white/10 rounded-xl p-5 flex items-center justify-between gap-4 hover:border-white/20 transition-colors block"
              >
                <div className="min-w-0">
                  <h2 className="font-jost font-bold text-base text-nex-white truncate">{p.name}</h2>
                  <div className="flex items-center gap-3 mt-2">
                    <span className={[
                      'font-dm-mono text-[10px] uppercase tracking-wider rounded-full border px-2.5 py-0.5',
                      STATUS_COLORS[p.status] ?? STATUS_COLORS.activo,
                    ].join(' ')}>
                      {STATUS_LABELS[loc][p.status] ?? p.status}
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
                      </div>
                      <span className="font-dm-mono text-[10px] text-nex-grey">{pct}%</span>
                    </div>
                  </div>
                </div>
                <span className="font-jost text-xs text-nex-grey hover:text-nex-white transition-colors shrink-0">
                  {loc === 'es' ? 'Ver proyecto' : 'View project'} →
                </span>
              </Link>
            )
          })}
        </div>
      )}
    </main>
  )
}

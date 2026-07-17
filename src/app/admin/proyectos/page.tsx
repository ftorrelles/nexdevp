import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createAuthServerClient } from '@/lib/supabase-server'
import { createServiceClient, type UserRole } from '@/lib/supabase'
import { computeProgressPct } from '@/lib/projects'
import { AdminNav } from '@/app/admin/AdminNav'

const STATUS_LABELS: Record<string, string> = {
  activo: 'Activo',
  pausado: 'Pausado',
  entregado: 'Entregado',
  cerrado: 'Cerrado',
}

const STATUS_COLORS: Record<string, string> = {
  activo: 'text-nex-green bg-nex-green/10 border-nex-green/30',
  pausado: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30',
  entregado: 'text-blue-400 bg-blue-400/10 border-blue-400/30',
  cerrado: 'text-nex-grey bg-white/5 border-white/20',
}

function ProgressBar({ pct }: { pct: number }) {
  const color =
    pct === 100 ? 'bg-nex-green' : pct >= 50 ? 'bg-blue-400' : 'bg-yellow-400'
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="font-dm-mono text-[10px] text-nex-grey w-8 text-right">{pct}%</span>
    </div>
  )
}

export default async function ProyectosListPage(): Promise<React.JSX.Element> {
  const supabase = await createAuthServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const role = (user.app_metadata?.role ?? 'vendor') as UserRole
  if (!['owner', 'supervisor', 'vendor'].includes(role)) redirect('/admin')

  const client = createServiceClient()

  let query = client
    .from('projects')
    .select('*, leads!inner(nombre), project_deliverables(id, hours, status)')
    .order('created_at', { ascending: false })

  if (role === 'vendor') {
    query = query.eq('leads.assigned_to', user.id)
  }

  const { data: projects, error } = await query

  if (error) {
    console.error('Projects list error:', error)
  }

  const rows = (projects as unknown as {
    id: string
    name: string
    status: string
    created_at: string
    leads: { nombre: string }
    project_deliverables: { hours: number; status: string }[]
  }[]) ?? []

  return (
    <div className="min-h-screen bg-nex-black text-nex-white">
      <AdminNav role={role} currentPath="/admin/proyectos" />
      <main className="px-4 sm:px-6 py-10 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="font-dm-mono text-xs text-nex-green uppercase tracking-[0.2em] mb-2">CRM</p>
            <h1 className="font-jost font-bold text-3xl text-nex-white">Proyectos</h1>
          </div>
        </div>

        {rows.length === 0 ? (
          <div className="bg-nex-dark border border-white/10 rounded-xl p-10 text-center">
            <p className="font-jost text-sm text-nex-grey">
              {role === 'vendor'
                ? 'No tenés proyectos asignados todavía.'
                : 'Todavía no hay proyectos creados.'}
            </p>
          </div>
        ) : (
          <div className="bg-nex-dark border border-white/10 rounded-xl overflow-hidden">
            <div className="grid grid-cols-[1fr_1fr_auto_auto_auto] text-[10px] font-dm-mono uppercase tracking-[0.1em] text-nex-grey px-5 py-3 border-b border-white/5">
              <span>Proyecto</span>
              <span>Lead</span>
              <span className="px-3">Estado</span>
              <span className="px-3">Progreso</span>
              <span className="px-3 text-right">Creado</span>
            </div>
            {rows.map((p) => {
              const pct = computeProgressPct(p.project_deliverables ?? [])
              return (
                <Link
                  key={p.id}
                  href={`/admin/proyectos/${p.id}`}
                  className="grid grid-cols-[1fr_1fr_auto_auto_auto] items-center border-b border-white/5 px-5 py-3.5 hover:bg-white/[0.02] transition-colors"
                >
                  <p className="font-jost text-sm text-nex-white truncate">{p.name}</p>
                  <p className="font-jost text-sm text-nex-grey truncate">{p.leads?.nombre ?? '—'}</p>
                  <span className={[
                    'font-dm-mono text-[10px] uppercase tracking-wider rounded-full border px-2.5 py-0.5 mx-3',
                    STATUS_COLORS[p.status] ?? STATUS_COLORS.activo,
                  ].join(' ')}>
                    {STATUS_LABELS[p.status] ?? p.status}
                  </span>
                  <div className="px-3">
                    <ProgressBar pct={pct} />
                  </div>
                  <span className="font-jost text-xs text-nex-grey px-3 text-right">
                    {new Date(p.created_at).toLocaleDateString('es-ES', {
                      day: '2-digit', month: 'short', year: 'numeric',
                    })}
                  </span>
                </Link>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}

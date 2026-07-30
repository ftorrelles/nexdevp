import { redirect } from 'next/navigation'
import { createAuthServerClient } from '@/lib/supabase-server'
import { createServiceClient } from '@/lib/supabase'
import type { UserRole, CommissionType } from '@/lib/supabase'
import { AdminNav } from '@/app/admin/AdminNav'
import { BudgetRatesEditor } from './BudgetRatesEditor'
import {
  DEFAULT_BUDGET_SETTINGS, resolveBudgetRates, computeBudgetSplit,
  computeDeliverablePayouts, groupEarningsByPerson,
  type BudgetSettings, type BudgetSplit, type DeliverablePayout,
} from '@/lib/budget'
import { ProjectBudgetCard } from './ProjectBudgetCard'

const REGION_CURRENCY: Record<string, string> = { españa: 'EUR', eeuu: 'USD', latam: 'USD' }

function fmt(n: number, currency = 'EUR') {
  return n.toLocaleString('es-ES', { style: 'currency', currency, maximumFractionDigits: 0 })
}

interface DeliverableRow {
  id: string; name: string; status: string; hours: number
  assigned_to: string | null; effective_price: number | null
}

interface ProjectRow {
  id: string; name: string; status: string; region?: string | null
  contract_value: number | null
  commission_type_snapshot: CommissionType | null
  commission_rate_snapshot: number | null
  company_margin_rate_snapshot: number | null
  quotes: { total_snapshot: number | null; total_price: number | null; region: string | null } | null
  leads: { nombre: string | null; canal: string | null; assigned_to: string | null } | null
  project_deliverables: DeliverableRow[]
}

export default async function BudgetPage(): Promise<React.JSX.Element> {
  const auth = await createAuthServerClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) redirect('/admin/login')

  const role = (user.app_metadata?.role ?? 'vendor') as UserRole
  if (!['owner', 'supervisor', 'developer'].includes(role)) redirect('/admin')

  const isStaff = role === 'owner' || role === 'supervisor'
  const client  = createServiceClient()

  const [{ data: settingsRow }, { data: rawProjects }] = await Promise.all([
    client.from('budget_settings').select('*').eq('id', 1).maybeSingle(),
    client
      .from('projects')
      .select(`
        id, name, status, contract_value,
        commission_type_snapshot, commission_rate_snapshot, company_margin_rate_snapshot,
        quotes ( total_snapshot, total_price, region ),
        leads ( nombre, canal, assigned_to ),
        project_deliverables ( id, name, status, hours, assigned_to, effective_price )
      `)
      .order('created_at', { ascending: false }),
  ])

  const settings: BudgetSettings = settingsRow ?? DEFAULT_BUDGET_SETTINGS
  const projects = (rawProjects ?? []) as unknown as ProjectRow[]

  let userMap: Record<string, string> = {}
  if (isStaff) {
    const { data: { users } } = await client.auth.admin.listUsers()
    userMap = Object.fromEntries((users ?? []).map(u => [u.id, u.email ?? u.id]))
  } else {
    userMap = { [user.id]: user.email ?? user.id }
  }

  const analysed = projects.map(p => {
    const commissionType: CommissionType =
      p.commission_type_snapshot ??
      (p.leads?.canal === 'vendedor' ? 'own_lead' : 'nexdevp_pool')

    const rates = p.commission_rate_snapshot != null && p.company_margin_rate_snapshot != null
      ? {
          commission_type: commissionType,
          commission_rate: Number(p.commission_rate_snapshot),
          margin_rate:     Number(p.company_margin_rate_snapshot),
          dev_rate: Math.max(
            1 - Number(p.commission_rate_snapshot) - Number(p.company_margin_rate_snapshot), 0,
          ),
        }
      : resolveBudgetRates(settings, commissionType)

    const contractValue = Number(
      p.contract_value ?? p.quotes?.total_snapshot ?? p.quotes?.total_price ?? 0,
    )
    const split: BudgetSplit         = computeBudgetSplit(contractValue, rates)
    const payouts: DeliverablePayout[] = computeDeliverablePayouts(p.project_deliverables ?? [], split)

    return {
      project:  p,
      currency: REGION_CURRENCY[p.quotes?.region ?? ''] ?? 'EUR',
      frozen:   p.commission_rate_snapshot != null,
      split,
      payouts,
    }
  })

  const visible = isStaff
    ? analysed
    : analysed.filter(a => a.payouts.some(p => p.assigned_to === user.id))

  const allPayouts = visible.flatMap(a =>
    isStaff ? a.payouts : a.payouts.filter(p => p.assigned_to === user.id),
  )

  const totalContract   = visible.reduce((acc, a) => acc + a.split.contract_value, 0)
  const totalCommission = visible.reduce((acc, a) => acc + a.split.commission_amount, 0)
  const totalMargin     = visible.reduce((acc, a) => acc + a.split.margin_amount, 0)
  const totalDevPool    = visible.reduce((acc, a) => acc + a.split.dev_pool, 0)

  const earned    = allPayouts.filter(p => p.earned).reduce((a, p) => a + p.payout, 0)
  const projected = allPayouts.filter(p => !p.earned).reduce((a, p) => a + p.payout, 0)

  const byPerson = groupEarningsByPerson(allPayouts)

  return (
    <div className="min-h-screen bg-nex-black text-nex-white">
      <AdminNav role={role} currentPath="/admin/budget" email={user.email ?? ''} name={user.user_metadata?.full_name as string | undefined} />
      <main className="px-4 sm:px-6 py-10 max-w-5xl mx-auto space-y-10">

        <div>
          <p className="font-dm-mono text-xs text-nex-green uppercase tracking-[0.2em] mb-2">Proyectos</p>
          <h1 className="font-jost font-bold text-3xl text-nex-white">
            {isStaff ? 'Budget' : 'Mis ganancias'}
          </h1>
          <p className="font-jost text-sm text-nex-grey mt-1">
            {isStaff
              ? 'Cómo se reparte lo que entra: comisión del vendedor, margen de la empresa y pozo de desarrollo.'
              : 'Lo que generan las fases que construís. Se liquida cuando la fase queda aprobada.'}
          </p>
        </div>

        {isStaff && <BudgetRatesEditor initial={settings} canEdit={role === 'owner'} />}

        {/* Summary */}
        {isStaff ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Contratado',      value: totalContract,   accent: false },
              { label: 'Comisiones',      value: totalCommission, accent: false },
              { label: 'Margen empresa',  value: totalMargin,     accent: false },
              { label: 'Pozo desarrollo', value: totalDevPool,    accent: true  },
            ].map(card => (
              <div
                key={card.label}
                className={[
                  'rounded-xl border p-5',
                  card.accent ? 'bg-nex-dark border-nex-green/30' : 'bg-nex-dark border-nex-ink/10',
                ].join(' ')}
              >
                <p className="font-dm-mono text-[10px] uppercase tracking-[0.2em] text-nex-grey mb-1">{card.label}</p>
                <p className={['font-jost font-bold text-2xl', card.accent ? 'text-nex-green' : 'text-nex-white'].join(' ')}>
                  {fmt(card.value)}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-nex-dark border border-nex-green/30 rounded-xl p-5">
              <p className="font-dm-mono text-[10px] uppercase tracking-[0.2em] text-nex-grey mb-1">Ganado</p>
              <p className="font-jost font-bold text-2xl text-nex-green">{fmt(earned)}</p>
              <p className="font-jost text-[10px] text-nex-grey/70 mt-1">Fases aprobadas</p>
            </div>
            <div className="bg-nex-dark border border-nex-ink/10 rounded-xl p-5">
              <p className="font-dm-mono text-[10px] uppercase tracking-[0.2em] text-nex-grey mb-1">Proyectado</p>
              <p className="font-jost font-bold text-2xl text-nex-white">{fmt(projected)}</p>
              <p className="font-jost text-[10px] text-nex-grey/70 mt-1">Fases todavía abiertas</p>
            </div>
            <div className="bg-nex-dark border border-nex-ink/10 rounded-xl p-5">
              <p className="font-dm-mono text-[10px] uppercase tracking-[0.2em] text-nex-grey mb-1">Fases</p>
              <p className="font-jost font-bold text-2xl text-nex-white">{allPayouts.length}</p>
            </div>
          </div>
        )}

        {/* Earnings per person — staff only */}
        {isStaff && byPerson.length > 0 && (
          <section>
            <h2 className="font-jost font-bold text-lg text-nex-white mb-4">Ganancias por persona</h2>
            <div className="bg-nex-dark border border-nex-ink/10 rounded-xl overflow-hidden">
              <div className="grid grid-cols-[1fr_3.5rem_6.5rem_5.5rem] text-[10px] font-dm-mono uppercase tracking-[0.1em] text-nex-grey px-5 py-3 border-b border-nex-ink/5">
                <span>Persona</span>
                <span className="text-right">Fases</span>
                <span className="text-right">Proyectado</span>
                <span className="text-right">Ganado</span>
              </div>
              {byPerson.map(p => (
                <div
                  key={p.user_id ?? 'sin-asignar'}
                  className="grid grid-cols-[1fr_3.5rem_6.5rem_5.5rem] items-center border-b border-nex-ink/5 px-5 py-3.5 hover:bg-white/[0.02] transition-colors"
                >
                  <span className="font-jost text-sm text-nex-white truncate">
                    {p.user_id ? (userMap[p.user_id] ?? p.user_id) : 'Sin asignar'}
                  </span>
                  <span className="font-dm-mono text-xs text-nex-grey text-right">{p.phases}</span>
                  <span className="font-jost text-sm text-nex-grey text-right">{fmt(p.projected)}</span>
                  <span className="font-jost text-sm font-bold text-nex-green text-right">{fmt(p.earned)}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Per project */}
        <section>
          <h2 className="font-jost font-bold text-lg text-nex-white mb-4">
            {isStaff ? 'Recorrido del dinero por proyecto' : 'Mis fases'}
          </h2>

          {visible.length === 0 ? (
            <div className="bg-nex-dark border border-nex-ink/10 rounded-xl p-10 text-center">
              <p className="font-jost text-sm text-nex-grey">
                {isStaff
                  ? 'Todavía no hay proyectos con presupuesto asociado.'
                  : 'Todavía no tenés fases asignadas.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {visible.map(({ project: p, split, payouts, currency, frozen }) => (
                <ProjectBudgetCard
                  key={p.id}
                  project={p}
                  split={split}
                  payouts={payouts}
                  currency={currency}
                  frozen={frozen}
                  isStaff={isStaff}
                  userMap={userMap}
                  userId={user.id}
                />
              ))}
            </div>
          )}
        </section>

      </main>
    </div>
  )
}

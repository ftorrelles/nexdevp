import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createAuthServerClient } from '@/lib/supabase-server'
import { createServiceClient } from '@/lib/supabase'
import type { UserRole, QuoteStatus } from '@/lib/supabase'
import { metricsScope, canViewBusinessMetrics, isStaff } from '@/lib/permissions'
import { computeDashboardMetrics, type CurrencyAmount, type DashboardFilters } from '@/lib/metrics'
import { AdminNav } from '@/app/admin/AdminNav'

const CANAL_LABELS: Record<string, string> = {
  form: 'Formulario web', whatsapp: 'WhatsApp', cal: 'Cal.com', chatbot: 'Chatbot IA',
  maps: 'Google Maps', vendedor: 'Vendedor', referral: 'Referido', outbound: 'Outbound',
  desconocido: 'Desconocido',
}
const STATUS_LABELS: Record<QuoteStatus, string> = {
  draft: 'Borrador', sent: 'Enviado', accepted: 'Aceptado', rejected: 'Rechazado',
}

function fmtMoney(list: CurrencyAmount[]): string {
  if (list.length === 0) return '—'
  return list
    .map((c) => c.amount.toLocaleString('es-ES', { style: 'currency', currency: c.currency, maximumFractionDigits: 0 }))
    .join('  ·  ')
}

interface PageProps {
  searchParams: Promise<{
    from?: string; to?: string; vendor?: string; canal?: string; status?: string
  }>
}

export default async function DashboardPage({ searchParams }: PageProps): Promise<React.JSX.Element> {
  const auth = await createAuthServerClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) redirect('/admin/login')

  const role = (user.app_metadata?.role ?? 'vendor') as UserRole
  if (!isStaff(role) || !canViewBusinessMetrics(role)) redirect('/admin')

  const scope = metricsScope(role)
  const params = await searchParams
  const client = createServiceClient()

  // Vendor email map (owner/supervisor only — vendors never enumerate others).
  let vendorEmails: Record<string, string> = {}
  let vendorList: { id: string; email: string }[] = []
  if (scope === 'global') {
    const { data: { users } } = await client.auth.admin.listUsers()
    const staff = (users ?? []).filter((u) => isStaff(u.app_metadata?.role as UserRole))
    vendorEmails = Object.fromEntries(staff.map((u) => [u.id, u.email ?? u.id]))
    vendorList = staff.map((u) => ({ id: u.id, email: u.email ?? u.id })).sort((a, b) => a.email.localeCompare(b.email))
  }

  const filters: DashboardFilters = {
    dateFrom: params.from || null,
    dateTo:   params.to ? `${params.to}T23:59:59` : null,
    vendorId: scope === 'global' ? (params.vendor || null) : null,
    canal:    params.canal || null,
    quoteStatus: (params.status as QuoteStatus) || null,
  }

  const metrics = await computeDashboardMetrics(client, {
    scope, userId: user.id, filters, vendorEmails,
  })

  const maxChannel = Math.max(1, ...metrics.leadsByChannel.map((c) => c.count))

  const kpis: { label: string; value: string; accent?: boolean }[] = [
    { label: 'Leads', value: String(metrics.leadsTotal) },
    { label: 'Quotes generadas', value: String(metrics.quotesGenerated) },
    { label: 'Quotes aceptadas', value: String(metrics.quotesAccepted) },
    { label: 'Revenue estimado', value: fmtMoney(metrics.revenueEstimated), accent: true },
    { label: 'Comisiones devengadas', value: fmtMoney(metrics.commissionsAccrued), accent: true },
    { label: 'Tiempo medio respuesta', value: metrics.avgResponseHours == null ? '—' : `${metrics.avgResponseHours} h` },
    { label: 'Valor medio cotización', value: fmtMoney(metrics.avgQuoteValue) },
    { label: 'Valor medio aceptada', value: fmtMoney(metrics.avgAcceptedQuoteValue) },
  ]

  return (
    <div className="min-h-screen bg-nex-black text-nex-white">
      <AdminNav role={role} currentPath="/admin/dashboard" email={user.email ?? ''} />
      <main className="px-4 sm:px-6 py-10 max-w-6xl mx-auto space-y-10">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="font-dm-mono text-xs text-nex-green uppercase tracking-[0.2em] mb-2">CRM · Métricas</p>
            <h1 className="font-jost font-bold text-3xl text-nex-white">
              {scope === 'self' ? 'Mi panel comercial' : 'Dashboard de negocio'}
            </h1>
            <p className="font-jost text-sm text-nex-grey mt-1">
              {scope === 'self'
                ? 'Tus métricas comerciales. Revenue y comisiones desde snapshots congelados.'
                : 'Salud comercial global. Revenue y comisiones desde snapshots congelados.'}
            </p>
          </div>
        </div>

        {/* Filters */}
        <form method="GET" className="bg-nex-dark border border-white/10 rounded-xl p-4 flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <label className="font-dm-mono text-[10px] text-nex-grey uppercase tracking-[0.15em]">Desde</label>
            <input type="date" name="from" defaultValue={params.from ?? ''}
              className="font-jost text-sm bg-nex-black border border-white/10 text-nex-white rounded-lg px-3 py-2 focus:outline-none focus:border-nex-green/50" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-dm-mono text-[10px] text-nex-grey uppercase tracking-[0.15em]">Hasta</label>
            <input type="date" name="to" defaultValue={params.to ?? ''}
              className="font-jost text-sm bg-nex-black border border-white/10 text-nex-white rounded-lg px-3 py-2 focus:outline-none focus:border-nex-green/50" />
          </div>
          {scope === 'global' && (
            <div className="flex flex-col gap-1">
              <label className="font-dm-mono text-[10px] text-nex-grey uppercase tracking-[0.15em]">Vendedor</label>
              <select name="vendor" defaultValue={params.vendor ?? ''}
                className="font-jost text-sm bg-nex-black border border-white/10 text-nex-white rounded-lg px-3 py-2 focus:outline-none focus:border-nex-green/50 cursor-pointer">
                <option value="">Todos</option>
                {vendorList.map((v) => <option key={v.id} value={v.id}>{v.email}</option>)}
              </select>
            </div>
          )}
          <div className="flex flex-col gap-1">
            <label className="font-dm-mono text-[10px] text-nex-grey uppercase tracking-[0.15em]">Canal</label>
            <select name="canal" defaultValue={params.canal ?? ''}
              className="font-jost text-sm bg-nex-black border border-white/10 text-nex-white rounded-lg px-3 py-2 focus:outline-none focus:border-nex-green/50 cursor-pointer">
              <option value="">Todos</option>
              {Object.entries(CANAL_LABELS).filter(([k]) => k !== 'desconocido').map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-dm-mono text-[10px] text-nex-grey uppercase tracking-[0.15em]">Estado quote</label>
            <select name="status" defaultValue={params.status ?? ''}
              className="font-jost text-sm bg-nex-black border border-white/10 text-nex-white rounded-lg px-3 py-2 focus:outline-none focus:border-nex-green/50 cursor-pointer">
              <option value="">Todos</option>
              {(Object.keys(STATUS_LABELS) as QuoteStatus[]).map((s) => (
                <option key={s} value={s}>{STATUS_LABELS[s]}</option>
              ))}
            </select>
          </div>
          <button type="submit" className="font-jost text-sm font-bold bg-nex-green text-nex-black px-5 py-2 rounded-lg hover:bg-nex-green/90 transition-colors">
            Aplicar
          </button>
          <Link href="/admin/dashboard" className="font-jost text-xs text-nex-grey hover:text-nex-white transition-colors underline self-center">
            Limpiar
          </Link>
        </form>

        {/* KPI cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((k) => (
            <div key={k.label} className={`bg-nex-dark border rounded-xl p-5 ${k.accent ? 'border-nex-green/30' : 'border-white/10'}`}>
              <p className="font-dm-mono text-[10px] uppercase tracking-[0.2em] text-nex-grey mb-1">{k.label}</p>
              <p className={`font-jost font-bold ${k.accent ? 'text-2xl text-nex-green' : 'text-2xl text-nex-white'}`}>{k.value}</p>
            </div>
          ))}
        </div>

        {/* Leads por canal */}
        <section>
          <h2 className="font-jost font-bold text-lg text-nex-white mb-4">Leads por canal</h2>
          {metrics.leadsByChannel.length === 0 ? (
            <p className="font-jost text-sm text-nex-grey">Sin leads en el período.</p>
          ) : (
            <div className="bg-nex-dark border border-white/10 rounded-xl p-5 space-y-3">
              {metrics.leadsByChannel.map((c) => (
                <div key={c.canal} className="flex items-center gap-3">
                  <span className="font-jost text-xs text-nex-grey w-32 shrink-0">{CANAL_LABELS[c.canal] ?? c.canal}</span>
                  <div className="flex-1 bg-nex-black rounded-full h-2.5 overflow-hidden">
                    <div className="bg-nex-green h-full rounded-full" style={{ width: `${(c.count / maxChannel) * 100}%` }} />
                  </div>
                  <span className="font-dm-mono text-xs text-nex-white w-8 text-right shrink-0">{c.count}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Por vendedor (global scope only) */}
        {scope === 'global' && metrics.byVendor.length > 0 && (
          <section>
            <h2 className="font-jost font-bold text-lg text-nex-white mb-4">Conversión por vendedor</h2>
            <div className="bg-nex-dark border border-white/10 rounded-xl overflow-x-auto">
              <table className="w-full text-sm font-jost min-w-[680px]">
                <thead>
                  <tr className="border-b border-white/10 text-[10px] font-dm-mono uppercase tracking-[0.1em] text-nex-grey">
                    <th className="text-left px-4 py-3">Vendedor</th>
                    <th className="text-right px-4 py-3">Leads</th>
                    <th className="text-right px-4 py-3">Quotes</th>
                    <th className="text-right px-4 py-3">Aceptadas</th>
                    <th className="text-right px-4 py-3" title="Aceptadas / Leads">Conv. lead</th>
                    <th className="text-right px-4 py-3" title="Aceptadas / Quotes">Win rate</th>
                    <th className="text-right px-4 py-3">Revenue</th>
                    <th className="text-right px-4 py-3">Comisiones</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.byVendor.map((v) => (
                    <tr key={v.vendorId} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3 text-nex-white">{v.email}</td>
                      <td className="px-4 py-3 text-right text-nex-grey">{v.leadsAssigned}</td>
                      <td className="px-4 py-3 text-right text-nex-grey">{v.quotesGenerated}</td>
                      <td className="px-4 py-3 text-right text-nex-white font-bold">{v.quotesAccepted}</td>
                      <td className="px-4 py-3 text-right text-nex-grey">{Math.round(v.conversionRate * 100)}%</td>
                      <td className="px-4 py-3 text-right text-nex-grey">{Math.round(v.winRate * 100)}%</td>
                      <td className="px-4 py-3 text-right text-nex-white">{fmtMoney(v.revenue)}</td>
                      <td className="px-4 py-3 text-right text-nex-green font-bold">{fmtMoney(v.commissions)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Últimas quotes aceptadas */}
        <section>
          <h2 className="font-jost font-bold text-lg text-nex-white mb-4">Últimas ventas cerradas</h2>
          {metrics.recentAccepted.length === 0 ? (
            <p className="font-jost text-sm text-nex-grey">Sin ventas cerradas en el período.</p>
          ) : (
            <div className="bg-nex-dark border border-white/10 rounded-xl divide-y divide-white/5">
              {metrics.recentAccepted.map((q) => (
                <div key={q.id} className="px-5 py-3.5 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-jost text-sm text-nex-white truncate">{q.title}</p>
                    <p className="font-jost text-xs text-nex-grey mt-0.5">
                      {q.vendorEmail ?? 'Sin vendedor'} · {new Date(q.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <p className="font-jost font-bold text-base text-nex-green shrink-0">
                    {q.total.toLocaleString('es-ES', { style: 'currency', currency: q.currency, maximumFractionDigits: 0 })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

      </main>
    </div>
  )
}

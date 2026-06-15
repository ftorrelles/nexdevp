import { redirect } from 'next/navigation'
import { createAuthServerClient } from '@/lib/supabase-server'
import { createServiceClient } from '@/lib/supabase'
import type { UserRole } from '@/lib/supabase'
import { AdminNav } from '@/app/admin/AdminNav'

const COMMISSION_RATES: Record<string, number> = {
  pool:       0.15,
  vendor_own: 0.20,
}
const COMMISSION_LABELS: Record<string, string> = {
  pool:       'Pool nexdevp (15%)',
  vendor_own: 'Lead propio (20%)',
}
const CANAL_LABELS: Record<string, string> = {
  form:     'Formulario web',
  whatsapp: 'WhatsApp',
  cal:      'Cal.com',
  chatbot:  'Chatbot IA',
  maps:     'Google Maps IA',
  vendedor: 'Vendedor',
}
const REGION_CURRENCY: Record<string, string> = { españa: 'EUR', eeuu: 'USD', latam: 'USD' }

function fmt(n: number, currency = 'EUR') {
  return n.toLocaleString('es-ES', { style: 'currency', currency, maximumFractionDigits: 0 })
}

type QuoteRow = {
  id:              string
  title:           string
  total_price:     number
  commission_type: string
  created_at:      string
  region:          string
  leads:           { nombre: string; email: string; canal: string; assigned_to: string | null } | null
}

interface PageProps {
  searchParams: Promise<{ vendor?: string }>
}

export default async function ComisionesPage({ searchParams }: PageProps): Promise<React.JSX.Element> {
  const auth = await createAuthServerClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) redirect('/admin/login')

  const role      = (user.app_metadata?.role ?? 'vendor') as UserRole
  const isVendor  = role === 'vendor'
  const canSeeAll = role === 'owner' || role === 'supervisor'

  if (!['owner', 'supervisor', 'vendor'].includes(role)) redirect('/admin')

  const params       = await searchParams
  const vendorFilter = canSeeAll ? (params.vendor ?? '') : ''

  const client = createServiceClient()

  const { data: allQuotes } = await client
    .from('quotes')
    .select('id, title, total_price, commission_type, created_at, region, leads(nombre, email, canal, assigned_to)')
    .eq('status', 'accepted')
    .not('commission_type', 'is', null)
    .order('created_at', { ascending: false })

  let rows = (allQuotes ?? []) as unknown as QuoteRow[]

  if (isVendor) {
    rows = rows.filter(q => q.leads?.assigned_to === user.id)
  } else if (vendorFilter) {
    rows = rows.filter(q => q.leads?.assigned_to === vendorFilter)
  }

  // Vendor user list for supervisor/owner breakdowns
  let vendorMap: Record<string, string> = {}
  let allVendors: { id: string; email: string }[] = []
  if (canSeeAll) {
    const { data: { users } } = await client.auth.admin.listUsers()
    const staff = (users ?? []).filter(u =>
      ['owner', 'supervisor', 'vendor'].includes(u.app_metadata?.role ?? '')
    )
    vendorMap  = Object.fromEntries(staff.map(u => [u.id, u.email ?? u.id]))
    allVendors = staff.map(u => ({ id: u.id, email: u.email ?? u.id })).sort((a, b) => a.email.localeCompare(b.email))
  }

  // Summary by vendor (only for owner/supervisor, only when no filter active)
  const byVendor: Record<string, { email: string; total: number; count: number; currency: string }> = {}
  if (canSeeAll && !vendorFilter) {
    const allRows = (allQuotes ?? []) as unknown as QuoteRow[]
    for (const q of allRows) {
      const vendorId = q.leads?.assigned_to ?? 'sin-asignar'
      const email    = vendorId === 'sin-asignar' ? 'Sin asignar' : (vendorMap[vendorId] ?? vendorId)
      const currency = REGION_CURRENCY[q.region] ?? 'EUR'
      const amount   = q.total_price * (COMMISSION_RATES[q.commission_type] ?? 0)
      if (!byVendor[vendorId]) byVendor[vendorId] = { email, total: 0, count: 0, currency }
      byVendor[vendorId].total += amount
      byVendor[vendorId].count += 1
    }
  }

  const totalCommission = rows.reduce((acc, q) =>
    acc + q.total_price * (COMMISSION_RATES[q.commission_type] ?? 0), 0)

  const selectedVendorEmail = vendorFilter ? (vendorMap[vendorFilter] ?? vendorFilter) : null

  return (
    <div className="min-h-screen bg-nex-black text-nex-white">
      <AdminNav role={role} currentPath="/admin/comisiones" />
      <main className="px-4 sm:px-6 py-10 max-w-5xl mx-auto space-y-10">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="font-dm-mono text-xs text-nex-green uppercase tracking-[0.2em] mb-2">CRM</p>
            <h1 className="font-jost font-bold text-3xl text-nex-white">
              {isVendor
                ? 'Mis comisiones'
                : selectedVendorEmail
                  ? `Comisiones · ${selectedVendorEmail}`
                  : 'Comisiones'}
            </h1>
            <p className="font-jost text-sm text-nex-grey mt-1">
              {isVendor
                ? 'Ventas cerradas asignadas a vos.'
                : 'Ventas cerradas y comisiones por vendedor.'}
            </p>
          </div>

          {/* Vendor filter — owner/supervisor only */}
          {canSeeAll && (
            <form method="GET" className="flex items-center gap-2">
              <select
                name="vendor"
                defaultValue={vendorFilter}
                onChange={(e) => {
                  // handled by form submission — no-op for TS
                  void e
                }}
                className="font-jost text-sm bg-nex-dark border border-white/10 text-nex-white rounded-lg px-3 py-2 focus:outline-none focus:border-nex-green/50 appearance-none cursor-pointer"
              >
                <option value="">Todos los vendedores</option>
                {allVendors.map(v => (
                  <option key={v.id} value={v.id}>{v.email}</option>
                ))}
              </select>
              <button
                type="submit"
                className="font-jost text-sm bg-nex-dark border border-white/10 text-nex-grey hover:text-nex-white hover:border-white/20 rounded-lg px-4 py-2 transition-colors"
              >
                Filtrar
              </button>
              {vendorFilter && (
                <a
                  href="/admin/comisiones"
                  className="font-jost text-xs text-nex-grey hover:text-nex-white transition-colors underline"
                >
                  Limpiar
                </a>
              )}
            </form>
          )}
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-nex-dark border border-nex-green/30 rounded-xl p-5">
            <p className="font-dm-mono text-[10px] uppercase tracking-[0.2em] text-nex-grey mb-1">
              {isVendor ? 'Mis comisiones' : vendorFilter ? 'Comisiones filtradas' : 'Total comisiones'}
            </p>
            <p className="font-jost font-bold text-2xl text-nex-green">{fmt(totalCommission)}</p>
          </div>
          <div className="bg-nex-dark border border-white/10 rounded-xl p-5">
            <p className="font-dm-mono text-[10px] uppercase tracking-[0.2em] text-nex-grey mb-1">Ventas cerradas</p>
            <p className="font-jost font-bold text-2xl text-nex-white">{rows.length}</p>
          </div>
          {canSeeAll && !vendorFilter ? (
            <div className="bg-nex-dark border border-white/10 rounded-xl p-5">
              <p className="font-dm-mono text-[10px] uppercase tracking-[0.2em] text-nex-grey mb-1">Vendedores activos</p>
              <p className="font-jost font-bold text-2xl text-nex-white">{Object.keys(byVendor).length}</p>
            </div>
          ) : (
            <div className="bg-nex-dark border border-white/10 rounded-xl p-5">
              <p className="font-dm-mono text-[10px] uppercase tracking-[0.2em] text-nex-grey mb-1">% promedio</p>
              <p className="font-jost font-bold text-2xl text-nex-white">
                {rows.length === 0 ? '—' : `${Math.round(rows.reduce((a, q) => a + (COMMISSION_RATES[q.commission_type] ?? 0), 0) / rows.length * 100)}%`}
              </p>
            </div>
          )}
        </div>

        {/* By vendor — owner/supervisor only, no filter active */}
        {canSeeAll && !vendorFilter && Object.keys(byVendor).length > 0 && (
          <section>
            <h2 className="font-jost font-bold text-lg text-nex-white mb-4">Por vendedor</h2>
            <div className="space-y-3">
              {Object.entries(byVendor)
                .sort(([, a], [, b]) => b.total - a.total)
                .map(([id, v]) => (
                  <a
                    key={id}
                    href={id === 'sin-asignar' ? '/admin/comisiones' : `/admin/comisiones?vendor=${id}`}
                    className="bg-nex-dark border border-white/10 rounded-xl px-5 py-4 flex items-center justify-between gap-4 hover:border-white/20 transition-colors block"
                  >
                    <div>
                      <p className="font-jost text-sm font-bold text-nex-white">{v.email}</p>
                      <p className="font-jost text-xs text-nex-grey mt-0.5">
                        {v.count} venta{v.count !== 1 ? 's' : ''} cerrada{v.count !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <p className="font-jost font-bold text-xl text-nex-green">{fmt(v.total, v.currency)}</p>
                  </a>
                ))}
            </div>
          </section>
        )}

        {/* Detail table */}
        <section>
          <h2 className="font-jost font-bold text-lg text-nex-white mb-4">Detalle de ventas</h2>
          {rows.length === 0 ? (
            <div className="bg-nex-dark border border-white/10 rounded-xl p-10 text-center">
              <p className="font-jost text-sm text-nex-grey">
                {isVendor
                  ? 'Todavía no tenés ventas cerradas registradas.'
                  : 'Todavía no hay ventas cerradas con comisión registrada.'}
              </p>
            </div>
          ) : (
            <div className="bg-nex-dark border border-white/10 rounded-xl overflow-hidden">
              <div className={`grid text-[10px] font-dm-mono uppercase tracking-[0.1em] text-nex-grey px-5 py-3 border-b border-white/5 ${canSeeAll ? 'grid-cols-[1fr_auto_auto_auto_auto_auto]' : 'grid-cols-[1fr_auto_auto_auto_auto]'}`}>
                <span>Proyecto · Lead</span>
                {canSeeAll && <span className="px-4">Vendedor</span>}
                <span className="px-4">Canal</span>
                <span className="px-4">Tipo</span>
                <span className="px-4 text-right">Venta</span>
                <span className="px-4 text-right">Comisión</span>
              </div>
              {rows.map(q => {
                const currency    = REGION_CURRENCY[q.region] ?? 'EUR'
                const rate        = COMMISSION_RATES[q.commission_type] ?? 0
                const amount      = q.total_price * rate
                const vendorId    = q.leads?.assigned_to
                const vendorEmail = vendorId ? (vendorMap[vendorId] ?? vendorId) : 'Sin asignar'
                return (
                  <div
                    key={q.id}
                    className={`grid items-center border-b border-white/5 px-5 py-3.5 hover:bg-white/[0.02] transition-colors ${canSeeAll ? 'grid-cols-[1fr_auto_auto_auto_auto_auto]' : 'grid-cols-[1fr_auto_auto_auto_auto]'}`}
                  >
                    <div>
                      <p className="font-jost text-sm text-nex-white">{q.title}</p>
                      <p className="font-jost text-xs text-nex-grey mt-0.5">
                        {q.leads?.nombre ?? 'Sin lead'} ·{' '}
                        {new Date(q.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    {canSeeAll && (
                      <span className="font-jost text-xs text-nex-grey px-4">{vendorEmail}</span>
                    )}
                    <span className="font-dm-mono text-[10px] text-nex-grey px-4">
                      {CANAL_LABELS[q.leads?.canal ?? ''] ?? (q.leads?.canal ?? '—')}
                    </span>
                    <span className="font-dm-mono text-[10px] text-nex-grey px-4 whitespace-nowrap">
                      {COMMISSION_LABELS[q.commission_type] ?? q.commission_type}
                    </span>
                    <span className="font-jost text-sm text-nex-white px-4 text-right">{fmt(q.total_price, currency)}</span>
                    <span className="font-jost text-sm font-bold text-nex-green px-4 text-right">{fmt(amount, currency)}</span>
                  </div>
                )
              })}
            </div>
          )}
        </section>

      </main>
    </div>
  )
}

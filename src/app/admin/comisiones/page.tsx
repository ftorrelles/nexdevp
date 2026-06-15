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
  form:      'Formulario web',
  whatsapp:  'WhatsApp',
  cal:       'Cal.com',
  chatbot:   'Chatbot IA',
  maps:      'Google Maps IA',
  vendedor:  'Vendedor',
}

function fmt(n: number, currency = 'EUR') {
  return n.toLocaleString('es-ES', { style: 'currency', currency, maximumFractionDigits: 0 })
}

export default async function ComisionesPage(): Promise<React.JSX.Element> {
  const auth = await createAuthServerClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) redirect('/admin/login')

  const role = (user.app_metadata?.role ?? 'vendor') as UserRole
  if (!['owner', 'supervisor'].includes(role)) redirect('/admin')

  const client = createServiceClient()

  // Fetch accepted quotes with commission_type set, joined to lead info
  const { data: quotes } = await client
    .from('quotes')
    .select('id, title, total_price, commission_type, created_at, region, lead_id, leads(nombre, email, canal, assigned_to)')
    .eq('status', 'accepted')
    .not('commission_type', 'is', null)
    .order('created_at', { ascending: false })

  // Fetch vendor users for name lookup
  const { data: { users: vendorUsers } } = await client.auth.admin.listUsers()
  const vendorMap = Object.fromEntries(
    (vendorUsers ?? []).map(u => [u.id, u.email ?? u.id])
  )

  const REGION_CURRENCY: Record<string, string> = { españa: 'EUR', eeuu: 'USD', latam: 'USD' }

  type QuoteRow = {
    id: string
    title: string
    total_price: number
    commission_type: string
    created_at: string
    region: string
    lead_id: string | null
    leads: { nombre: string; email: string; canal: string; assigned_to: string | null } | null
  }

  const rows = (quotes ?? []) as unknown as QuoteRow[]

  // Summary by vendor
  const byVendor: Record<string, { email: string; total: number; count: number; currency: string }> = {}
  for (const q of rows) {
    const vendorId = q.leads?.assigned_to ?? 'sin-asignar'
    const email    = vendorId === 'sin-asignar' ? 'Sin asignar' : (vendorMap[vendorId] ?? vendorId)
    const currency = REGION_CURRENCY[q.region] ?? 'EUR'
    const rate     = COMMISSION_RATES[q.commission_type] ?? 0
    const amount   = q.total_price * rate
    if (!byVendor[vendorId]) byVendor[vendorId] = { email, total: 0, count: 0, currency }
    byVendor[vendorId].total += amount
    byVendor[vendorId].count += 1
  }

  const totalCommission = rows.reduce((acc, q) => {
    const rate = COMMISSION_RATES[q.commission_type] ?? 0
    return acc + q.total_price * rate
  }, 0)

  return (
    <div className="min-h-screen bg-nex-black text-nex-white">
      <AdminNav role={role} currentPath="/admin/comisiones" />
      <main className="px-4 sm:px-6 py-10 max-w-5xl mx-auto space-y-10">

        <div>
          <p className="font-dm-mono text-xs text-nex-green uppercase tracking-[0.2em] mb-2">CRM</p>
          <h1 className="font-jost font-bold text-3xl text-nex-white">Comisiones</h1>
          <p className="font-jost text-sm text-nex-grey mt-1">Ventas cerradas y comisiones por vendedor.</p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-nex-dark border border-nex-green/30 rounded-xl p-5">
            <p className="font-dm-mono text-[10px] uppercase tracking-[0.2em] text-nex-grey mb-1">Total comisiones</p>
            <p className="font-jost font-bold text-2xl text-nex-green">{fmt(totalCommission)}</p>
          </div>
          <div className="bg-nex-dark border border-white/10 rounded-xl p-5">
            <p className="font-dm-mono text-[10px] uppercase tracking-[0.2em] text-nex-grey mb-1">Ventas cerradas</p>
            <p className="font-jost font-bold text-2xl text-nex-white">{rows.length}</p>
          </div>
          <div className="bg-nex-dark border border-white/10 rounded-xl p-5">
            <p className="font-dm-mono text-[10px] uppercase tracking-[0.2em] text-nex-grey mb-1">Vendedores activos</p>
            <p className="font-jost font-bold text-2xl text-nex-white">{Object.keys(byVendor).length}</p>
          </div>
        </div>

        {/* By vendor */}
        {Object.keys(byVendor).length > 0 && (
          <section>
            <h2 className="font-jost font-bold text-lg text-nex-white mb-4">Por vendedor</h2>
            <div className="space-y-3">
              {Object.values(byVendor).map(v => (
                <div key={v.email} className="bg-nex-dark border border-white/10 rounded-xl px-5 py-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="font-jost text-sm font-bold text-nex-white">{v.email}</p>
                    <p className="font-jost text-xs text-nex-grey mt-0.5">{v.count} venta{v.count !== 1 ? 's' : ''} cerrada{v.count !== 1 ? 's' : ''}</p>
                  </div>
                  <p className="font-jost font-bold text-xl text-nex-green">{fmt(v.total, v.currency)}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Detail table */}
        <section>
          <h2 className="font-jost font-bold text-lg text-nex-white mb-4">Detalle de ventas</h2>
          {rows.length === 0 ? (
            <div className="bg-nex-dark border border-white/10 rounded-xl p-10 text-center">
              <p className="font-jost text-sm text-nex-grey">Todavía no hay ventas cerradas con comisión registrada.</p>
            </div>
          ) : (
            <div className="bg-nex-dark border border-white/10 rounded-xl overflow-hidden">
              <div className="grid grid-cols-[1fr_auto_auto_auto_auto] text-[10px] font-dm-mono uppercase tracking-[0.1em] text-nex-grey px-5 py-3 border-b border-white/5">
                <span>Proyecto · Lead</span>
                <span className="px-4">Canal</span>
                <span className="px-4">Tipo</span>
                <span className="px-4 text-right">Venta</span>
                <span className="px-4 text-right">Comisión</span>
              </div>
              {rows.map(q => {
                const currency = REGION_CURRENCY[q.region] ?? 'EUR'
                const rate     = COMMISSION_RATES[q.commission_type] ?? 0
                const amount   = q.total_price * rate
                return (
                  <div key={q.id} className="grid grid-cols-[1fr_auto_auto_auto_auto] items-center border-b border-white/5 px-5 py-3.5 hover:bg-white/[0.02] transition-colors">
                    <div>
                      <p className="font-jost text-sm text-nex-white">{q.title}</p>
                      <p className="font-jost text-xs text-nex-grey mt-0.5">
                        {q.leads?.nombre ?? 'Sin lead'} ·{' '}
                        {new Date(q.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
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

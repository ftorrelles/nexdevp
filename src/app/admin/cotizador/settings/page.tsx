import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createAuthServerClient } from '@/lib/supabase-server'
import { createServiceClient } from '@/lib/supabase'
import type { UserRole } from '@/lib/supabase'
import { AdminNav } from '@/app/admin/AdminNav'
import { PricingEditor } from './PricingEditor'
import { CatalogEditor } from './CatalogEditor'

export default async function CotizadorSettingsPage(): Promise<React.JSX.Element> {
  const supabase = await createAuthServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/admin/login')

  const role = (user.app_metadata?.role ?? 'vendor') as UserRole
  if (!['owner', 'supervisor'].includes(role)) redirect('/admin/cotizador')

  const client = createServiceClient()
  const [settingsRes, catalogRes] = await Promise.all([
    client.from('pricing_settings').select('*').order('region'),
    client.from('quote_catalog').select('*').order('tipo').order('product').order('size').order('name'),
  ])

  const canEditPricing = role === 'owner'
  const canEditCatalog = ['owner', 'supervisor'].includes(role)

  return (
    <div className="min-h-screen bg-nex-black text-nex-white">
      <AdminNav role={role} currentPath="/admin/cotizador" />
      <main className="px-4 sm:px-6 py-10 max-w-5xl mx-auto space-y-12">

        <div className="flex items-start justify-between">
          <div>
            <Link
              href="/admin/cotizador"
              className="font-jost text-xs text-nex-grey hover:text-nex-white transition-colors mb-3 inline-block"
            >
              ← Presupuestos
            </Link>
            <p className="font-dm-mono text-xs text-nex-green uppercase tracking-[0.2em] mb-2">
              Cotizador
            </p>
            <h1 className="font-jost font-bold text-3xl text-nex-white">Configuración</h1>
            <p className="font-jost text-sm text-nex-grey mt-1">
              Tarifas por región y catálogo de funcionalidades.
            </p>
          </div>
        </div>

        {/* Pricing settings */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-jost font-bold text-lg text-nex-white">Tarifas por región</h2>
            {!canEditPricing && (
              <span className="font-dm-mono text-xs text-nex-grey border border-white/10 rounded-full px-3 py-1">
                Solo lectura
              </span>
            )}
          </div>
          {canEditPricing ? (
            <PricingEditor initialSettings={settingsRes.data ?? []} />
          ) : (
            <div className="space-y-4">
              {(settingsRes.data ?? []).map(s => (
                <div key={s.region} className="bg-nex-dark border border-white/10 rounded-xl px-5 py-4">
                  <p className="font-jost font-bold text-sm text-nex-white mb-3">
                    {{ españa: 'España', eeuu: 'Estados Unidos', latam: 'Latinoamérica' }[s.region as string] ?? s.region}
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-xs">
                    {[
                      { label: 'Tarifa/h', value: `${s.hourly_rate} ${s.currency}` },
                      { label: 'PM', value: `${Math.round(s.overhead_pm * 100)}%` },
                      { label: 'QA', value: `${Math.round(s.overhead_qa * 100)}%` },
                      { label: 'Contingencia', value: `${Math.round(s.overhead_cx * 100)}%` },
                      { label: 'Mantenimiento', value: `${Math.round(s.maint_rate * 100)}%` },
                    ].map(({ label, value }) => (
                      <div key={label}>
                        <p className="font-dm-mono text-nex-grey">{label}</p>
                        <p className="font-jost font-bold text-nex-white mt-0.5">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Catalog */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-jost font-bold text-lg text-nex-white">Catálogo de funcionalidades</h2>
            <span className="font-dm-mono text-xs text-nex-grey">
              {catalogRes.data?.length ?? 0} ítems
            </span>
          </div>
          <CatalogEditor
            initialItems={catalogRes.data ?? []}
            canEdit={canEditCatalog}
          />
        </section>

      </main>
    </div>
  )
}

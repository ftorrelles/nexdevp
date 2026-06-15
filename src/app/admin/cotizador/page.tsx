import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createAuthServerClient } from '@/lib/supabase-server'
import { createServiceClient } from '@/lib/supabase'
import type { UserRole } from '@/lib/supabase'
import { AdminNav } from '@/app/admin/AdminNav'
import { QuotesList } from './QuotesList'

export default async function CotizadorListPage(): Promise<React.JSX.Element> {
  const supabase = await createAuthServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/admin/login')

  const role = (user.app_metadata?.role ?? 'vendor') as UserRole
  if (!['owner', 'supervisor', 'vendor'].includes(role)) redirect('/admin')

  const client = createServiceClient()
  const { data } = await client
    .from('quotes')
    .select('id, title, tipo, product, region, status, total_hours, total_price, maint_month, created_at')
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-nex-black text-nex-white">
      <AdminNav role={role} currentPath="/admin/cotizador" />
      <main className="px-4 sm:px-6 py-10 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="font-dm-mono text-xs text-nex-green uppercase tracking-[0.2em] mb-2">
              Cotizador
            </p>
            <h1 className="font-jost font-bold text-3xl text-nex-white">Presupuestos</h1>
          </div>
          <div className="flex items-center gap-3">
            {['owner', 'supervisor'].includes(role) && (
              <Link
                href="/admin/cotizador/settings"
                className="border border-white/20 text-nex-grey font-jost text-sm py-2.5 px-4 rounded-lg hover:border-white/40 hover:text-nex-white transition-colors"
              >
                Configuración
              </Link>
            )}
            <Link
              href="/admin/cotizador/nueva"
              className="bg-nex-green text-nex-black font-jost font-bold text-sm py-2.5 px-5 rounded-lg hover:bg-nex-green/90 transition-colors"
            >
              + Nueva cotización
            </Link>
          </div>
        </div>
        <QuotesList quotes={data ?? []} />
      </main>
    </div>
  )
}

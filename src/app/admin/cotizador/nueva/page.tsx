import { redirect } from 'next/navigation'
import { createAuthServerClient } from '@/lib/supabase-server'
import type { UserRole } from '@/lib/supabase'
import { AdminNav } from '@/app/admin/AdminNav'
import { QuoteWizard } from './QuoteWizard'

type Props = {
  searchParams: Promise<{ lead_id?: string }>
}

export default async function CotizadorNuevaPage({ searchParams }: Props): Promise<React.JSX.Element> {
  const supabase = await createAuthServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/admin/login')

  const role = (user.app_metadata?.role ?? 'vendor') as UserRole
  if (!['owner', 'supervisor', 'vendor'].includes(role)) redirect('/admin')

  const { lead_id } = await searchParams

  return (
    <div className="min-h-screen bg-nex-black text-nex-white">
      <AdminNav role={role} currentPath="/admin/cotizador" />
      <main className="px-4 sm:px-6 py-10 max-w-4xl mx-auto">
        <div className="mb-8">
          <p className="font-dm-mono text-xs text-nex-green uppercase tracking-[0.2em] mb-2">
            Cotizador
          </p>
          <h1 className="font-jost font-bold text-3xl text-nex-white">
            Nueva cotización
          </h1>
          <p className="font-jost text-sm text-nex-grey mt-1">
            Respondé las preguntas y el estimado se arma solo.
          </p>
        </div>
        <QuoteWizard initialLeadId={lead_id ?? null} />
      </main>
    </div>
  )
}

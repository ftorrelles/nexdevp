import { redirect } from 'next/navigation'
import { setRequestLocale } from 'next-intl/server'
import type { Locale } from '@/content/types'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/sections/Footer'
import { Link } from '@/i18n/navigation'
import { createAuthServerClient } from '@/lib/supabase-server'
import { createServiceClient, type CareerApplication } from '@/lib/supabase'
import { ApplicantLogout } from './ApplicantLogout'

type Props = {
  params: Promise<{ locale: string }>
}

type Estado = NonNullable<CareerApplication['estado']>

const ESTADO_STYLES: Record<Estado, string> = {
  nuevo: 'text-blue-400 bg-blue-400/10 border-blue-400/30',
  revisado: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30',
  aceptado: 'text-nex-green bg-nex-green/10 border-nex-green/30',
  rechazado: 'text-red-400 bg-red-400/10 border-red-400/30',
}

const ESTADO_LABELS: Record<Locale, Record<Estado, string>> = {
  es: { nuevo: 'En revisión', revisado: 'Revisado', aceptado: 'Aceptado', rechazado: 'No seleccionado' },
  en: { nuevo: 'Under review', revisado: 'Reviewed', aceptado: 'Accepted', rechazado: 'Not selected' },
}

export default async function ApplicantPortalPage({ params }: Props): Promise<React.JSX.Element> {
  const { locale } = await params
  const loc = locale as Locale
  setRequestLocale(loc)

  const auth = await createAuthServerClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) redirect(`/admin/login`)

  // Staff have the CRM; the portal is for applicants tracking their own status.
  if (user.app_metadata?.role !== 'applicant') redirect('/admin')

  const client = createServiceClient()
  const { data } = await client
    .from('career_applications')
    .select('*, careers(title_es, title_en)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const applications = (data as CareerApplication[]) ?? []
  const displayName = (user.user_metadata?.full_name as string) || user.email

  return (
    <main className="min-h-screen bg-nex-black text-nex-white">
      <Navbar locale={loc} />

      <section className="px-6 lg:px-12 py-16 max-w-3xl mx-auto">
        <div className="flex items-start justify-between gap-4 mb-10">
          <div>
            <h1 className="font-jost font-bold text-3xl text-nex-white mb-1">
              {loc === 'es' ? `Hola, ${displayName}` : `Hi, ${displayName}`}
            </h1>
            <p className="font-jost text-sm text-nex-grey">
              {loc === 'es' ? 'El estado de tus postulaciones.' : 'The status of your applications.'}
            </p>
          </div>
          <ApplicantLogout label={loc === 'es' ? 'Cerrar sesión' : 'Log out'} />
        </div>

        {applications.length === 0 ? (
          <div className="bg-nex-dark border border-white/10 rounded-2xl p-8 text-center">
            <p className="font-jost text-sm text-nex-grey mb-5">
              {loc === 'es'
                ? 'Todavía no te postulaste a ninguna posición.'
                : "You haven't applied to any position yet."}
            </p>
            <Link
              href="/careers"
              className="inline-block bg-nex-green text-nex-black font-jost font-bold text-sm py-2.5 px-6 rounded-lg hover:bg-nex-green/90 transition-colors"
            >
              {loc === 'es' ? 'Ver posiciones abiertas' : 'View open positions'}
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map((app) => {
              const estado = (app.estado ?? 'nuevo') as Estado
              const title = loc === 'en' ? app.careers?.title_en : app.careers?.title_es
              const date = app.created_at
                ? new Date(app.created_at).toLocaleDateString(loc === 'es' ? 'es-ES' : 'en-US', {
                    day: '2-digit', month: 'short', year: 'numeric',
                  })
                : ''
              return (
                <div
                  key={app.id}
                  className="bg-nex-dark border border-white/10 rounded-xl p-5 flex items-center justify-between gap-4"
                >
                  <div>
                    <h2 className="font-jost font-bold text-base text-nex-white">
                      {title ?? (loc === 'es' ? 'Posición' : 'Position')}
                    </h2>
                    <p className="font-dm-mono text-[11px] tracking-wider text-nex-grey mt-1">
                      {loc === 'es' ? 'Postulado el' : 'Applied on'} {date}
                    </p>
                  </div>
                  <span
                    className={[
                      'font-dm-mono text-[10px] tracking-[0.1em] uppercase rounded-full border px-3 py-1 shrink-0',
                      ESTADO_STYLES[estado],
                    ].join(' ')}
                  >
                    {ESTADO_LABELS[loc][estado]}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </section>

      <Footer locale={loc} />
    </main>
  )
}

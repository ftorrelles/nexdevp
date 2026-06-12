import { setRequestLocale } from 'next-intl/server'
import type { Locale } from '@/content/types'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/sections/Footer'
import { Link } from '@/i18n/navigation'
import { createAuthServerClient } from '@/lib/supabase-server'
import { createServiceClient, type Career } from '@/lib/supabase'
import { CareersListing } from './CareersListing'

type Props = {
  params: Promise<{ locale: string }>
}

export default async function PublicCareersPage({ params }: Props): Promise<React.JSX.Element> {
  const { locale } = await params
  setRequestLocale(locale as Locale)

  const auth = await createAuthServerClient()
  const { data: { user } } = await auth.auth.getUser()
  const currentUser = user
    ? { email: user.email ?? '', name: (user.user_metadata?.full_name as string) ?? '' }
    : null

  const client = createServiceClient()
  const { data, error } = await client
    .from('careers')
    .select('*')
    .eq('active', true)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Failed to fetch careers for public page:', error)
  }

  const activeCareers = (data as Career[]) ?? []

  return (
    <main className="min-h-screen bg-nex-black text-nex-white">
      <Navbar locale={locale as Locale} />

      {/* Account banner — applying requires an account */}
      <div className="px-6 lg:px-12 pt-8">
        <div className="max-w-5xl mx-auto rounded-xl border border-nex-green/30 bg-nex-dark px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          {currentUser ? (
            <>
              <p className="font-jost text-sm text-nex-grey text-center sm:text-left">
                {locale === 'es'
                  ? 'Ya podés postularte. Seguí el estado de tus aplicaciones en tu portal.'
                  : 'You can now apply. Track your applications in your portal.'}
              </p>
              <Link
                href="/careers/portal"
                className="bg-nex-green text-nex-black font-jost font-bold text-sm py-2 px-5 rounded-lg hover:bg-nex-green/90 transition-colors shrink-0"
              >
                {locale === 'es' ? 'Mi portal' : 'My portal'}
              </Link>
            </>
          ) : (
            <>
              <p className="font-jost text-sm text-nex-grey text-center sm:text-left">
                {locale === 'es'
                  ? 'Para postularte necesitás una cuenta. Creala y seguí el estado de tu aplicación.'
                  : 'You need an account to apply. Create one and track your application status.'}
              </p>
              <div className="flex items-center gap-3 shrink-0">
                <Link
                  href="/careers/registro"
                  className="bg-nex-green text-nex-black font-jost font-bold text-sm py-2 px-5 rounded-lg hover:bg-nex-green/90 transition-colors"
                >
                  {locale === 'es' ? 'Crear cuenta' : 'Create account'}
                </Link>
                <Link
                  href="/admin/login"
                  className="font-jost text-sm text-nex-grey hover:text-nex-white transition-colors"
                >
                  {locale === 'es' ? 'Ingresar' : 'Log in'}
                </Link>
              </div>
            </>
          )}
        </div>
      </div>

      <CareersListing careers={activeCareers} locale={locale as Locale} currentUser={currentUser} />
      <Footer locale={locale as Locale} />
    </main>
  )
}

import { setRequestLocale } from 'next-intl/server'
import type { Locale } from '@/content/types'
import { CareersHeader } from '@/components/layout/CareersHeader'
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
      <CareersHeader locale={locale as Locale} isLoggedIn={!!currentUser} />

      {/* Account note — only for visitors who aren't logged in */}
      {!currentUser && (
        <div className="px-6 lg:px-12 pt-8">
          <div className="max-w-5xl mx-auto rounded-xl border border-nex-green/30 bg-nex-dark px-6 py-4">
            <p className="font-jost text-sm text-nex-grey text-center sm:text-left">
              {locale === 'es'
                ? 'Para postularte necesitás una cuenta. Creala y seguí el estado de tu aplicación.'
                : 'You need an account to apply. Create one and track your application status.'}
            </p>
          </div>
        </div>
      )}

      <CareersListing careers={activeCareers} locale={locale as Locale} currentUser={currentUser} />
    </main>
  )
}

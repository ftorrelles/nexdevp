import { redirect } from 'next/navigation'
import { setRequestLocale } from 'next-intl/server'
import type { Locale } from '@/content/types'
import { CareersHeader } from '@/components/layout/CareersHeader'
import { createAuthServerClient } from '@/lib/supabase-server'
import { LoginForm } from './LoginForm'

type Props = {
  params: Promise<{ locale: string }>
}

export default async function CareersLoginPage({ params }: Props): Promise<React.JSX.Element> {
  const { locale } = await params
  setRequestLocale(locale as Locale)

  // Already logged in → skip the form.
  const auth = await createAuthServerClient()
  const { data: { user } } = await auth.auth.getUser()
  if (user) {
    redirect(user.app_metadata?.role === 'applicant' ? '/careers/portal' : '/admin')
  }

  return (
    <main className="min-h-screen bg-nex-black text-nex-white">
      <CareersHeader locale={locale as Locale} isLoggedIn={false} />
      <div className="px-4 py-16 sm:py-24 flex justify-center">
        <div className="w-full max-w-sm">
          <LoginForm />
        </div>
      </div>
    </main>
  )
}

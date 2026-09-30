import type { Metadata } from 'next'
import { setRequestLocale } from 'next-intl/server'
import type { Locale } from '@/content/types'
import { CareersHeader } from '@/components/layout/CareersHeader'
import { RegisterForm } from './RegisterForm'

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

type Props = {
  params: Promise<{ locale: string }>
}

export default async function CareersRegisterPage({ params }: Props): Promise<React.JSX.Element> {
  const { locale } = await params
  setRequestLocale(locale as Locale)

  return (
    <main className="min-h-screen bg-nex-black text-nex-white">
      <CareersHeader locale={locale as Locale} isLoggedIn={false} />
      <div className="px-4 py-16 sm:py-24 flex justify-center">
        <div className="w-full max-w-sm">
          <RegisterForm />
        </div>
      </div>
    </main>
  )
}

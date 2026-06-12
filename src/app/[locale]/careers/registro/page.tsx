import { setRequestLocale } from 'next-intl/server'
import type { Locale } from '@/content/types'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/sections/Footer'
import { RegisterForm } from './RegisterForm'

type Props = {
  params: Promise<{ locale: string }>
}

export default async function CareersRegisterPage({ params }: Props): Promise<React.JSX.Element> {
  const { locale } = await params
  setRequestLocale(locale as Locale)

  return (
    <main className="min-h-screen bg-nex-black text-nex-white">
      <Navbar locale={locale as Locale} />
      <div className="px-4 py-16 sm:py-24 flex justify-center">
        <div className="w-full max-w-sm">
          <RegisterForm />
        </div>
      </div>
      <Footer locale={locale as Locale} />
    </main>
  )
}

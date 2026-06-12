import { setRequestLocale } from 'next-intl/server'
import type { Locale } from '@/content/types'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/sections/Footer'
import { createServiceClient, type Career } from '@/lib/supabase'
import { CareersListing } from './CareersListing'

type Props = {
  params: Promise<{ locale: string }>
}

export default async function PublicCareersPage({ params }: Props): Promise<React.JSX.Element> {
  const { locale } = await params
  setRequestLocale(locale as Locale)

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
      <CareersListing careers={activeCareers} locale={locale as Locale} />
      <Footer locale={locale as Locale} />
    </main>
  )
}

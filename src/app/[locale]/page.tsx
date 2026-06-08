import { setRequestLocale } from 'next-intl/server'
import type { Locale } from '@/content/types'
import { Navbar } from '@/components/layout/Navbar'
import { Hero } from '@/components/sections/Hero'
import { Pillars } from '@/components/sections/Pillars'
import { DemoSection } from '@/components/sections/DemoSection'
import { CaseHero } from '@/components/sections/CaseHero'
import { Methodology } from '@/components/sections/Methodology'
import { Stats } from '@/components/sections/Stats'
import { CtaFinal } from '@/components/sections/CtaFinal'
import { Footer } from '@/components/sections/Footer'

type Props = {
  params: Promise<{ locale: string }>
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale as Locale)
  return (
    <main>
      <Navbar />
      <Hero />
      <Pillars />
      <DemoSection />
      <CaseHero />
      <Methodology />
      <Stats />
      <CtaFinal />
      <Footer locale={locale as Locale} />
    </main>
  )
}

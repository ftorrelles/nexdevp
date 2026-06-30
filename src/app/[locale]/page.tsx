import { setRequestLocale } from 'next-intl/server'
import type { Locale } from '@/content/types'
import { Navbar } from '@/components/layout/Navbar'
import { Hero } from '@/components/sections/Hero'
import { Pillars } from '@/components/sections/Pillars'
import { DemoSection } from '@/components/sections/DemoSection'
import { CasosExito } from '@/components/sections/CasosExito'
import { Methodology } from '@/components/sections/Methodology'
import { Stats } from '@/components/sections/Stats'
import { CtaFinal } from '@/components/sections/CtaFinal'
import { BeforeAfter } from '@/components/sections/BeforeAfter'
import { Portfolio } from '@/components/sections/Portfolio'
import { JoinUs } from '@/components/sections/JoinUs'
import { Footer } from '@/components/sections/Footer'

type Props = {
  params: Promise<{ locale: string }>
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale as Locale)
  return (
    <main>
      <Navbar locale={locale as Locale} />
      <Hero />
      <BeforeAfter />
      <Pillars />
      <DemoSection />
      <div aria-hidden="true" className="h-px bg-gradient-to-r from-transparent via-nex-green/20 to-transparent" />
      <CasosExito />
      <div aria-hidden="true" className="h-px bg-gradient-to-r from-transparent via-white/8 to-transparent" />
      <Methodology />
      <div aria-hidden="true" className="h-px bg-gradient-to-r from-transparent via-white/8 to-transparent" />
      <Portfolio />
      <Stats />
      <CtaFinal />
      <JoinUs locale={locale as Locale} />
      <Footer locale={locale as Locale} />
    </main>
  )
}

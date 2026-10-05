import type { Metadata } from 'next'
import { setRequestLocale } from 'next-intl/server'
import { buildMetadata, buildOrganizationSchema, buildWebSiteSchema } from '@/lib/seo'
import type { Locale } from '@/content/types'
import { isLocale } from '@/i18n/routing'
import { HASH_LOAD_SCRIPT } from '@/lib/offscreen'
import { JsonLd } from '@/components/seo/JsonLd'
import { Navbar } from '@/components/layout/Navbar'
import { OffscreenAnchors } from '@/components/layout/OffscreenAnchors'
import { OffscreenSection } from '@/components/layout/OffscreenSection'
import { Hero } from '@/components/sections/Hero'
import { Pillars } from '@/components/sections/Pillars'
import { DemoSection } from '@/components/sections/DemoSection'
import { CasosExito } from '@/components/sections/CasosExito'
import { Stats } from '@/components/sections/Stats'
import { CtaFinal } from '@/components/sections/CtaFinal'
import { BeforeAfter } from '@/components/sections/BeforeAfter'
import { Portfolio } from '@/components/sections/Portfolio'
import { JoinUs } from '@/components/sections/JoinUs'
import { Footer } from '@/components/sections/Footer'

type Props = {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  // Unknown locale: the layout answers 404, so there is nothing to describe.
  if (!isLocale(locale)) return {}
  return buildMetadata(locale, 'home')
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale as Locale)

  const orgSchema = buildOrganizationSchema(locale as Locale)
  const webSiteSchema = buildWebSiteSchema(locale as Locale)

  return (
    <>
      <JsonLd data={orgSchema} />
      <JsonLd data={webSiteSchema} />
      <script dangerouslySetInnerHTML={{ __html: HASH_LOAD_SCRIPT }} />
      <OffscreenAnchors />
      <main>
        <Navbar locale={locale as Locale} />
        <Hero />
        <OffscreenSection sizeClass="[contain-intrinsic-size:auto_1000px] lg:[contain-intrinsic-size:auto_620px]">
          <BeforeAfter />
        </OffscreenSection>
        <OffscreenSection sizeClass="[contain-intrinsic-size:auto_1750px] lg:[contain-intrinsic-size:auto_970px]">
          <Pillars />
        </OffscreenSection>
        <div aria-hidden="true" className="h-px bg-gradient-to-r from-transparent via-nex-green/20 to-transparent" />
        <OffscreenSection sizeClass="[contain-intrinsic-size:auto_2000px] lg:[contain-intrinsic-size:auto_1230px]">
          <DemoSection />
        </OffscreenSection>
        <div aria-hidden="true" className="h-px bg-gradient-to-r from-transparent via-nex-green/20 to-transparent" />
        <OffscreenSection sizeClass="[contain-intrinsic-size:auto_1400px] lg:[contain-intrinsic-size:auto_970px]">
          <CasosExito />
        </OffscreenSection>
        <div aria-hidden="true" className="h-px bg-gradient-to-r from-transparent via-white/8 to-transparent" />
        <OffscreenSection sizeClass="[contain-intrinsic-size:auto_2100px] lg:[contain-intrinsic-size:auto_1520px]">
          <Portfolio />
        </OffscreenSection>
        <OffscreenSection sizeClass="[contain-intrinsic-size:auto_400px] lg:[contain-intrinsic-size:auto_270px]">
          <Stats />
        </OffscreenSection>
        <OffscreenSection sizeClass="[contain-intrinsic-size:auto_1170px] lg:[contain-intrinsic-size:auto_950px]">
          <CtaFinal />
        </OffscreenSection>
        <OffscreenSection sizeClass="[contain-intrinsic-size:auto_1200px] lg:[contain-intrinsic-size:auto_900px]">
          <JoinUs locale={locale as Locale} />
        </OffscreenSection>
        <OffscreenSection sizeClass="[contain-intrinsic-size:auto_900px] lg:[contain-intrinsic-size:auto_440px]">
          <Footer locale={locale as Locale} />
        </OffscreenSection>
      </main>
    </>
  )
}

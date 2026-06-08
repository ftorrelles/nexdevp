import type { Metadata } from 'next'
import { setRequestLocale } from 'next-intl/server'
import { getPublishedCases } from '@/content/case-studies'
import { getServices } from '@/content/services'
import { Hero } from '@/components/sections/Hero'
import { Pains } from '@/components/sections/Pains'
import { Services } from '@/components/sections/Services'
import { Methodology } from '@/components/sections/Methodology'
import { Cases } from '@/components/sections/Cases'
import { Retainer } from '@/components/sections/Retainer'
import { About } from '@/components/sections/About'
import { LeadCapture } from '@/components/sections/LeadCapture'
import { Footer } from '@/components/sections/Footer'
import { buildMetadata, buildOrganizationSchema, buildServiceSchema } from '@/lib/seo'
import type { Locale } from '@/content/types'

type Props = {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  return buildMetadata(locale as Locale, 'home')
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale as Locale)

  const cases = getPublishedCases()
  const services = getServices()

  const orgSchema = buildOrganizationSchema(locale as Locale)
  const serviceSchema = buildServiceSchema(services, locale as Locale)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
      />
      <main>
        <Hero />
        <Pains />
        <Services services={services} locale={locale as Locale} />
        <Methodology />
        <Cases cases={cases} locale={locale as Locale} />
        <Retainer />
        <About />
        <LeadCapture />
        <Footer locale={locale as Locale} />
      </main>
    </>
  )
}

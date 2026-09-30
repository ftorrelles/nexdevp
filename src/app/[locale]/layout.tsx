import type { Metadata } from 'next'
import { SITE_URL } from '@/lib/constants'
import { CustomCursor } from '@/components/ui/CustomCursor'
import { FloatingWhatsApp } from '@/components/ui/FloatingWhatsApp'
import { DocumentShell } from '@/components/layout/DocumentShell'
import { MetaPixel } from '@/components/analytics/MetaPixel'
import { AttributionCapture } from '@/components/analytics/AttributionCapture'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { routing } from '@/i18n/routing'
import { getDefaultSeo } from '@/lib/seo'
import type { Locale } from '@/content/types'

type Props = {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

export function generateStaticParams(): { locale: string }[] {
  return routing.locales.map((locale) => ({ locale }))
}

// Site-wide defaults only. Canonical/hreflang/Open Graph are page-level and
// come from `buildMetadata` in `src/lib/seo.ts` (the single SEO source).
export async function generateMetadata({ params }: Omit<Props, 'children'>): Promise<Metadata> {
  const { locale } = await params
  const { title, description } = getDefaultSeo((locale === 'en' ? 'en' : 'es') as Locale)

  return {
    metadataBase: new URL(SITE_URL),
    title,
    description,
  }
}

export default async function LocaleLayout({ children, params }: Props): Promise<React.JSX.Element> {
  const { locale } = await params

  if (!routing.locales.includes(locale as 'es' | 'en')) {
    notFound()
  }

  setRequestLocale(locale)
  const messages = await getMessages()

  return (
    <DocumentShell lang={locale}>
      <NextIntlClientProvider messages={messages}>
        <CustomCursor />
        {children}
        <FloatingWhatsApp />
      </NextIntlClientProvider>
      <MetaPixel />
      <AttributionCapture />
    </DocumentShell>
  )
}

import type { Metadata } from 'next'
import { SITE_URL } from '@/lib/constants'
import { CustomCursor } from '@/components/ui/CustomCursor'
import { FloatingWhatsApp } from '@/components/ui/FloatingWhatsApp'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { routing } from '@/i18n/routing'

type Props = {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

const SEO = {
  es: {
    title: 'nexdevp — Software a medida e Ingeniería de Ventas con IA',
    description:
      'Consultoría tecnológica especializada en software a medida e ingeniería de ventas con IA. Tu sistema contacta, cualifica y agenda leads en menos de 60 segundos.',
  },
  en: {
    title: 'nexdevp — Custom Software & AI Sales Engineering',
    description:
      'Technology consultancy specialized in custom software and AI sales engineering. Your system contacts, qualifies, and books leads in under 60 seconds.',
  },
} as const

export async function generateMetadata({ params }: Omit<Props, 'children'>): Promise<Metadata> {
  const { locale } = await params
  const seo = SEO[locale as keyof typeof SEO] ?? SEO.es

  return {
    metadataBase: new URL(SITE_URL),
    title: seo.title,
    description: seo.description,
    alternates: {
      canonical: `/${locale}`,
      languages: { es: '/es', en: '/en', 'x-default': '/es' },
    },
    openGraph: {
      title: seo.title,
      description: seo.description,
      url: `/${locale}`,
      siteName: 'nexdevp',
      locale: locale === 'es' ? 'es_ES' : 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: seo.title,
      description: seo.description,
    },
  }
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params

  if (!routing.locales.includes(locale as 'es' | 'en')) {
    notFound()
  }

  setRequestLocale(locale)
  const messages = await getMessages()

  return (
    <NextIntlClientProvider messages={messages}>
      <CustomCursor />
      {children}
      <FloatingWhatsApp />
    </NextIntlClientProvider>
  )
}

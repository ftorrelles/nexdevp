import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { DocumentShell } from '@/components/layout/DocumentShell'
import { routing } from '@/i18n/routing'

// Renders for unmatched URLs and for notFound() thrown under `[locale]`.
// The root layout has no <html>, so this page provides its own document. The
// locale is unknown here, so every supported language is shown.
export default async function NotFound(): Promise<React.JSX.Element> {
  const sections = await Promise.all(
    routing.locales.map(async (locale) => ({
      locale,
      t: await getTranslations({ locale, namespace: 'notFound' }),
    })),
  )

  return (
    <DocumentShell lang={routing.defaultLocale}>
      <main className="min-h-screen flex flex-col items-center justify-center gap-10 px-6 py-16 text-center">
        {sections.map(({ locale, t }) => (
          <section key={locale} lang={locale} className="flex flex-col items-center gap-3">
            <h1 className="font-jost text-2xl font-semibold text-nex-white">{t('title')}</h1>
            <p className="font-jost text-sm text-nex-grey max-w-sm">{t('description')}</p>
            <Link
              href={`/${locale}`}
              className="font-dm-mono text-xs uppercase tracking-widest text-nex-green hover:text-nex-white transition-colors"
            >
              {t('home')}
            </Link>
          </section>
        ))}
      </main>
    </DocumentShell>
  )
}

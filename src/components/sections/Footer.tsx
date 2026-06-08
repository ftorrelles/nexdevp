import { getTranslations } from 'next-intl/server'
import Image from 'next/image'
import { Link } from '@/i18n/navigation'
import { LocaleSwitcher } from '@/components/editorial/LocaleSwitcher'
import type { Locale } from '@/content/types'

interface FooterProps {
  locale: Locale
}

export async function Footer({ locale }: FooterProps) {
  const t = await getTranslations('footer')

  const year = new Date().getFullYear()

  const navLinks = [
    { href: '/', label: t('nav.home') },
    { href: '/#services', label: t('nav.services') },
    { href: locale === 'es' ? '/casos' : '/cases', label: t('nav.cases') },
    { href: '/#about', label: t('nav.about') },
  ]

  return (
    <footer className="bg-surface border-t border-cream/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          {/* Logo */}
          <Link href="/" aria-label={t('nav.home')}>
            <Image
              src="/brand/logo-light.png"
              alt="nexdevp"
              width={120}
              height={40}
              className="h-8 w-auto"
            />
          </Link>

          {/* Nav */}
          <nav aria-label="Footer navigation">
            <ul className="flex flex-wrap gap-6">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="font-jost text-sm text-muted hover:text-cream transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Locale switcher */}
          <LocaleSwitcher locale={locale} />
        </div>

        <div className="mt-8 pt-8 border-t border-cream/10">
          <p className="font-jost text-xs text-muted">
            {t('copyright').replace('{year}', String(year))}
          </p>
        </div>
      </div>
    </footer>
  )
}

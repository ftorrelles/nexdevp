import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import type { Locale } from '@/content/types'
import { LocaleSwitcher } from '@/components/ui/LocaleSwitcher'
import { WHATSAPP_NUMBER } from '@/lib/constants'

interface FooterProps {
  locale: Locale
}

export function Footer({ locale }: FooterProps) {
  const t = useTranslations('footer')
  const tNav = useTranslations('navbar')
  const year = new Date().getFullYear()

  const navLinks = [
    { href: '/', label: tNav('home') },
    { href: '/#servicios', label: tNav('servicios') },
    { href: '#demo', label: tNav('demo') },
    { href: '/#casos', label: tNav('casos') },
    { href: '/#portfolio', label: tNav('portfolio') },
    { href: '/careers', label: tNav('trabaja') },
  ]

  return (
    <footer className="bg-nex-black border-t border-white/5">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-14">

        {/* Top row */}
        <div className="flex flex-col lg:flex-row items-center lg:items-start justify-between gap-10">

          {/* Brand */}
          <div className="flex flex-col items-center gap-4 w-full lg:w-64 text-center">
            <Link href="/" className="flex justify-center">
              <Image src="/brand/logo-mark.png" alt="nexdevp" width={52} height={52} />
            </Link>
            <p className="font-jost text-sm text-nex-grey max-w-xs leading-relaxed">
              {t('tagline')}
            </p>
          </div>

          {/* Nav links */}
          <nav>
            <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-nex-green mb-4">{t('navHeading')}</p>
            <ul className="flex flex-col gap-3">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="font-jost text-sm text-nex-grey hover:text-nex-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Contact */}
          <div>
            <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-nex-green mb-4">{t('contactHeading')}</p>
            <ul className="flex flex-col gap-3">
              <li>
                <a
                  href={`https://wa.me/${WHATSAPP_NUMBER.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-jost text-sm text-nex-grey hover:text-nex-white transition-colors flex items-center gap-2"
                >
                  <span className="text-nex-green">↗</span> WhatsApp
                </a>
              </li>
              <li>
                <span className="font-jost text-sm text-nex-grey">
                  nexdevp.com
                </span>
              </li>
            </ul>
          </div>

          {/* Locale switcher */}
          <div>
            <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-nex-green mb-4">{t('languageHeading')}</p>
            <LocaleSwitcher locale={locale} />
            <a
              href="/admin"
              className="mt-4 inline-block font-mono text-[10px] tracking-[0.2em] uppercase text-nex-grey/40 hover:text-nex-grey transition-colors"
            >
              Admin
            </a>
          </div>
        </div>

        {/* Bottom bar — extra bottom padding on mobile so the floating WhatsApp button doesn't cover the text */}
        <div className="mt-12 pt-6 pb-20 sm:pb-0 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-mono text-xs text-nex-grey">
            {t('copyright', { year })}
          </p>
          <p className="font-mono text-xs text-nex-grey/40">
            {t('builtWith')}
          </p>
        </div>

      </div>
    </footer>
  )
}

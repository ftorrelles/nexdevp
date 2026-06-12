'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Link, usePathname } from '@/i18n/navigation'
import { BookingDialog } from '@/components/cta/BookingDialog'
import { LocaleSwitcher } from '@/components/ui/LocaleSwitcher'
import type { Locale } from '@/content/types'

const sectionIds = ['hero', 'servicios', 'demo', 'casos', 'portfolio', 'contacto']

interface NavbarProps {
  locale: Locale
}

export function Navbar({ locale }: NavbarProps) {
  const t = useTranslations('navbar')
  const navLinks = [
    { href: '#hero',      label: t('home') },
    { href: '#servicios', label: t('servicios') },
    { href: '#demo',      label: t('demo') },
    { href: '#casos',      label: t('casos') },
    { href: '#portfolio',  label: t('portfolio') },
    { href: '#contacto',   label: t('contacto') },
  ]
  const pathname = usePathname()
  const isHome = pathname === '/'
  const [active, setActive] = useState('hero')
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const observers: IntersectionObserver[] = []
    sectionIds.forEach((id) => {
      const el = document.getElementById(id)
      if (!el) return
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActive(id) },
        { rootMargin: '-20% 0px -70% 0px', threshold: 0 }
      )
      obs.observe(el)
      observers.push(obs)
    })
    return () => observers.forEach((o) => o.disconnect())
  }, [])

  const scrollTo = (id: string) => {
    setMenuOpen(false)
    if (isHome) {
      const el = document.getElementById(id)
      if (el) el.scrollIntoView({ behavior: 'smooth' })
    } else {
      window.location.href = `/${locale}#${id}`
    }
  }

  return (
    <nav className="sticky top-0 z-50 bg-nex-black/90 backdrop-blur-md border-b border-white/5">
      <div className="px-6 lg:px-12 h-16 flex items-center justify-between">

        {/* Logo */}
        <Link href="/" aria-label="nexdevp home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/logo-dark.svg" alt="nexdevp" style={{ height: '40px', width: 'auto' }} />
        </Link>

        {/* Desktop nav */}
        <ul className="hidden lg:flex items-center gap-8">
          {navLinks.map((link) => {
            const id = link.href.replace('#', '')
            const isActive = active === id
            return (
              <li key={link.href}>
                <button
                  onClick={() => scrollTo(id)}
                  className="relative font-jost text-sm transition-colors duration-200 pb-0.5"
                  style={{ color: isActive ? '#22b561' : '#8a8c8b' }}
                >
                  {link.label}
                  {isActive && (
                    <span
                      className="absolute -bottom-0.5 left-0 right-0 h-px rounded-full"
                      style={{ background: '#22b561', boxShadow: '0 0 6px rgba(34,181,97,0.8)' }}
                    />
                  )}
                </button>
              </li>
            )
          })}
        </ul>

        {/* Desktop right: switcher + CTA */}
        <div className="hidden lg:flex items-center gap-4">
          <LocaleSwitcher locale={locale} />
          <BookingDialog triggerLabel={t('cta')} variant="primary" />
        </div>

        {/* Hamburger (mobile + tablet) */}
        <button
          className="lg:hidden flex flex-col gap-[5px] p-2"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          <span
            className="block h-px w-6 bg-nex-white transition-all duration-300 origin-center"
            style={menuOpen ? { transform: 'rotate(45deg) translateY(3px)' } : {}}
          />
          <span
            className="block h-px w-6 bg-nex-white transition-all duration-300"
            style={menuOpen ? { opacity: 0 } : {}}
          />
          <span
            className="block h-px w-6 bg-nex-white transition-all duration-300 origin-center"
            style={menuOpen ? { transform: 'rotate(-45deg) translateY(-3px)' } : {}}
          />
        </button>
      </div>

      {/* Mobile menu */}
      <div
        className="lg:hidden overflow-hidden transition-all duration-300"
        style={{ maxHeight: menuOpen ? '460px' : '0px' }}
      >
        <div className="px-6 pb-6 pt-2 flex flex-col gap-1 border-t border-white/5">
          {navLinks.map((link) => {
            const id = link.href.replace('#', '')
            const isActive = active === id
            return (
              <button
                key={link.href}
                onClick={() => scrollTo(id)}
                className="text-left py-3 font-jost text-base border-b border-white/5 last:border-0 transition-colors"
                style={{ color: isActive ? '#22b561' : '#8a8c8b' }}
              >
                {link.label}
              </button>
            )
          })}
          <div className="pt-4 flex items-center gap-4">
            <LocaleSwitcher locale={locale} />
            <BookingDialog triggerLabel={t('cta')} variant="primary" />
          </div>
        </div>
      </div>
    </nav>
  )
}

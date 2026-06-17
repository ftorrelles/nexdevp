'use client'

import { useState } from 'react'
import { Link } from '@/i18n/navigation'
import type { Locale } from '@/content/types'
import { ApplicantLogout } from '@/app/[locale]/careers/portal/ApplicantLogout'

interface Props {
  locale:     Locale
  isLoggedIn: boolean
}

export function CareersHeader({ locale, isLoggedIn }: Props) {
  const [menuOpen, setMenuOpen] = useState(false)

  const backToSite    = locale === 'es' ? 'Volver al sitio'  : 'Back to site'
  const myPortal      = locale === 'es' ? 'Mi portal'        : 'My portal'
  const logIn         = locale === 'es' ? 'Iniciar sesión'   : 'Log in'
  const createAccount = locale === 'es' ? 'Crear cuenta'     : 'Create account'
  const logOut        = locale === 'es' ? 'Cerrar sesión'    : 'Log out'

  return (
    <header className="sticky top-0 z-50 bg-nex-black/90 backdrop-blur-md border-b border-white/10">
      <div className="px-4 sm:px-6 lg:px-12 h-16 flex items-center justify-between gap-4">

        {/* Brand */}
        <Link href="/careers" className="flex items-center gap-3" aria-label="nexdevp careers">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/logo-dark.svg" alt="nexdevp" style={{ height: '36px', width: 'auto' }} />
          <span className="hidden sm:inline font-dm-mono text-[10px] tracking-[0.2em] uppercase text-nex-green border border-nex-green/30 rounded px-2 py-0.5">
            Careers
          </span>
        </Link>

        {/* Desktop actions */}
        <div className="hidden sm:flex items-center gap-4 sm:gap-6">
          <Link href="/" className="font-jost text-sm text-nex-grey hover:text-nex-white transition-colors">
            <span aria-hidden="true">←</span> {backToSite}
          </Link>
          {isLoggedIn ? (
            <>
              <Link href="/careers/portal" className="font-jost text-sm text-nex-grey hover:text-nex-white transition-colors">
                {myPortal}
              </Link>
              <ApplicantLogout label={logOut} />
            </>
          ) : (
            <>
              <Link href="/careers/login" className="font-jost text-sm text-nex-grey hover:text-nex-white transition-colors">
                {logIn}
              </Link>
              <Link href="/careers/registro" className="bg-nex-green text-nex-black font-jost font-bold text-sm py-2 px-5 rounded-lg hover:bg-nex-green/90 transition-colors">
                {createAccount}
              </Link>
            </>
          )}
        </div>

        {/* Hamburger (mobile) */}
        <button
          className="sm:hidden flex flex-col gap-[5px] p-2"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
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

      {/* Mobile dropdown */}
      <div
        className="sm:hidden overflow-hidden transition-all duration-300"
        style={{ maxHeight: menuOpen ? '320px' : '0px' }}
      >
        <div className="px-6 pb-6 pt-2 flex flex-col gap-1 border-t border-white/5">
          <Link
            href="/"
            onClick={() => setMenuOpen(false)}
            className="py-3 font-jost text-base text-nex-grey hover:text-nex-white border-b border-white/5 transition-colors"
          >
            ← {backToSite}
          </Link>
          {isLoggedIn ? (
            <>
              <Link
                href="/careers/portal"
                onClick={() => setMenuOpen(false)}
                className="py-3 font-jost text-base text-nex-grey hover:text-nex-white border-b border-white/5 transition-colors"
              >
                {myPortal}
              </Link>
              <div className="py-3">
                <ApplicantLogout label={logOut} />
              </div>
            </>
          ) : (
            <>
              <Link
                href="/careers/login"
                onClick={() => setMenuOpen(false)}
                className="py-3 font-jost text-base text-nex-grey hover:text-nex-white border-b border-white/5 transition-colors"
              >
                {logIn}
              </Link>
              <div className="pt-4">
                <Link
                  href="/careers/registro"
                  onClick={() => setMenuOpen(false)}
                  className="block w-full text-center bg-nex-green text-nex-black font-jost font-bold text-sm py-2.5 px-5 rounded-lg hover:bg-nex-green/90 transition-colors"
                >
                  {createAccount}
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

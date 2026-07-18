'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useTheme } from './ThemeProvider'
import { ChangePasswordModal } from './ChangePasswordModal'

interface Props {
  email: string
  onLogout: () => void | Promise<void>
  accountHref?: string
  locale?: 'es' | 'en'
}

function getInitials(email: string): string {
  const local = email.split('@')[0] ?? ''
  const parts = local.split(/[.\-_]/).filter(Boolean)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return local.slice(0, 2).toUpperCase() || '??'
}

export function UserMenu({ email, onLogout, accountHref, locale = 'es' }: Props) {
  const loc = locale
  const [open, setOpen] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const { theme, toggleTheme } = useTheme()
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={loc === 'es' ? 'Cuenta' : 'Account'}
        className="h-9 w-9 rounded-full bg-nex-green/15 border border-nex-green/30 text-nex-green font-dm-mono text-xs font-bold flex items-center justify-center hover:bg-nex-green/25 transition-colors"
      >
        {getInitials(email)}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-56 bg-nex-dark border border-nex-ink/10 rounded-xl shadow-xl py-2 z-40">
          <p className="px-4 py-1.5 font-jost text-xs text-nex-grey truncate">{email}</p>

          <div className="my-1 border-t border-nex-ink/10" />

          {accountHref && (
            <Link
              href={accountHref}
              onClick={() => setOpen(false)}
              className="block px-4 py-2 font-jost text-sm text-nex-white hover:bg-nex-ink/5 transition-colors"
            >
              {loc === 'es' ? 'Mi cuenta' : 'My account'}
            </Link>
          )}

          <button
            onClick={() => { setShowPasswordModal(true); setOpen(false) }}
            className="w-full text-left px-4 py-2 font-jost text-sm text-nex-white hover:bg-nex-ink/5 transition-colors"
          >
            {loc === 'es' ? 'Cambiar contraseña' : 'Change password'}
          </button>

          <button
            onClick={toggleTheme}
            className="w-full flex items-center justify-between px-4 py-2 font-jost text-sm text-nex-white hover:bg-nex-ink/5 transition-colors"
          >
            <span>{loc === 'es' ? 'Modo oscuro' : 'Dark mode'}</span>
            <span
              className={[
                'w-9 h-5 rounded-full relative transition-colors shrink-0',
                theme === 'dark' ? 'bg-nex-green' : 'bg-nex-ink/15',
              ].join(' ')}
            >
              <span
                className={[
                  'absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform',
                  theme === 'dark' ? 'translate-x-4' : 'translate-x-0.5',
                ].join(' ')}
              />
            </span>
          </button>

          <div className="my-1 border-t border-nex-ink/10" />

          <button
            onClick={() => { setOpen(false); onLogout() }}
            className="w-full text-left px-4 py-2 font-jost text-sm text-nex-grey hover:text-nex-white hover:bg-nex-ink/5 transition-colors"
          >
            {loc === 'es' ? 'Cerrar sesión' : 'Log out'}
          </button>
        </div>
      )}

      <ChangePasswordModal
        open={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        title={loc === 'es' ? 'Cambiar contraseña' : 'Change password'}
      />
    </div>
  )
}

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { UserRole } from '@/lib/supabase'

interface Props {
  role: UserRole
  currentPath: string
}

export function AdminNav({ role, currentPath }: Props) {
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)

  async function handleLogout() {
    await fetch('/api/admin/auth', { method: 'DELETE' })
    router.push('/admin/login')
  }

  const navItems = [
    { href: '/admin', label: 'Leads' },
    ...((role === 'owner' || role === 'supervisor') ? [{ href: '/admin/applicants', label: 'Applicants' }] : []),
    { href: '/admin/cotizador', label: 'Cotizador' },
    ...(['owner', 'supervisor', 'vendor'].includes(role) ? [{ href: '/admin/comisiones', label: 'Comisiones' }] : []),
    ...(role === 'owner' ? [{ href: '/admin/users', label: 'Usuarios' }] : []),
    { href: '/admin/profile', label: 'Mi cuenta' },
  ]

  function linkClass(href: string, block = false) {
    return [
      'font-jost text-sm rounded-lg transition-colors',
      block ? 'px-3 py-2.5 w-full' : 'px-3 py-1.5',
      currentPath === href
        ? 'text-nex-white bg-white/10'
        : 'text-nex-grey hover:text-nex-white',
    ].join(' ')
  }

  return (
    <header className="border-b border-white/10">
      <div className="px-4 sm:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <span className="font-jost font-bold text-xl text-nex-white">nexdevp</span>
            <span className="font-dm-mono text-[10px] tracking-[0.2em] uppercase text-nex-green border border-nex-green/30 rounded px-2 py-0.5">
              CRM
            </span>
          </div>
          {/* Desktop nav */}
          <nav className="hidden md:flex gap-1">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className={linkClass(item.href)}>
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Desktop logout */}
        <button
          onClick={handleLogout}
          className="hidden md:block font-jost text-sm text-nex-grey hover:text-nex-white transition-colors"
        >
          Cerrar sesión
        </button>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="md:hidden text-nex-grey hover:text-nex-white transition-colors p-1"
          aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
        >
          {menuOpen ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <nav className="md:hidden border-t border-white/10 px-4 py-3 flex flex-col gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMenuOpen(false)}
              className={linkClass(item.href, true)}
            >
              {item.label}
            </Link>
          ))}
          <button
            onClick={handleLogout}
            className="font-jost text-sm text-nex-grey hover:text-nex-white transition-colors text-left px-3 py-2.5 w-full"
          >
            Cerrar sesión
          </button>
        </nav>
      )}
    </header>
  )
}

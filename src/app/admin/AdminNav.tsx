'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { UserRole } from '@/lib/supabase'
import { UserMenu } from '@/components/theme/UserMenu'
import { BrandLogo } from '@/components/theme/BrandLogo'

interface Props {
  role: UserRole
  currentPath: string
  email: string
}

interface NavItem {
  href: string
  label: string
}

interface NavGroup {
  label: string
  items: NavItem[]
}

function NavDropdown({ group, currentPath }: { group: NavGroup; currentPath: string }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement | null>(null)
  const isActive = group.items.some((item) => item.href === currentPath)

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  if (group.items.length === 1) {
    const item = group.items[0]
    return (
      <Link
        href={item.href}
        className={[
          'font-jost text-sm rounded-lg transition-colors px-3 py-1.5',
          currentPath === item.href ? 'text-nex-white bg-nex-ink/10' : 'text-nex-grey hover:text-nex-white',
        ].join(' ')}
      >
        {group.label}
      </Link>
    )
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className={[
          'font-jost text-sm rounded-lg transition-colors px-3 py-1.5 flex items-center gap-1',
          isActive ? 'text-nex-white bg-nex-ink/10' : 'text-nex-grey hover:text-nex-white',
        ].join(' ')}
      >
        {group.label}
        <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={open ? 'rotate-180' : ''}>
          <path d="M2 4l4 4 4-4" />
        </svg>
      </button>
      {open && (
        <div className="absolute left-0 mt-1 w-44 bg-nex-dark border border-nex-ink/10 rounded-xl shadow-xl py-1.5 z-40">
          {group.items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={[
                'block px-4 py-2 font-jost text-sm transition-colors',
                currentPath === item.href ? 'text-nex-white bg-nex-ink/10' : 'text-nex-grey hover:text-nex-white',
              ].join(' ')}
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export function AdminNav({ role, currentPath, email }: Props) {
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)

  async function handleLogout() {
    await fetch('/api/admin/auth', { method: 'DELETE' })
    router.push('/admin/login')
  }

  const navGroups: NavGroup[] = [
    {
      label: 'Proyectos',
      items: [
        ...(['owner', 'supervisor', 'vendor', 'developer'].includes(role)
          ? [{ href: '/admin/proyectos', label: 'Proyectos' }]
          : []),
        ...(['owner', 'supervisor'].includes(role)
          ? [{ href: '/admin/brief-templates', label: 'Templates' }]
          : []),
      ],
    },
    {
      label: 'Ventas',
      items: [
        { href: '/admin', label: 'Leads' },
        { href: '/admin/cotizador', label: 'Cotizador' },
        ...(['owner', 'supervisor', 'vendor'].includes(role)
          ? [{ href: '/admin/comisiones', label: 'Comisiones' }]
          : []),
      ],
    },
    ...(role === 'owner' || role === 'supervisor'
      ? [{ label: 'Talento', items: [{ href: '/admin/applicants', label: 'Applicants' }] }]
      : []),
    ...(role === 'owner'
      ? [{ label: 'Usuarios', items: [{ href: '/admin/users', label: 'Usuarios' }] }]
      : []),
  ].filter((g) => g.items.length > 0)

  const flatItems = navGroups.flatMap((g) => g.items)

  return (
    <header className="border-b border-nex-ink/10">
      <div className="px-4 sm:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <BrandLogo />

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navGroups.map((group) => (
              <NavDropdown key={group.label} group={group} currentPath={currentPath} />
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {/* Desktop user menu */}
          <div className="hidden md:block">
            <UserMenu email={email} onLogout={handleLogout} accountHref="/admin/profile" />
          </div>

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
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <nav className="md:hidden border-t border-nex-ink/10 px-4 py-3 flex flex-col gap-1">
          {flatItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMenuOpen(false)}
              className={[
                'font-jost text-sm rounded-lg transition-colors px-3 py-2.5 w-full',
                currentPath === item.href ? 'text-nex-white bg-nex-ink/10' : 'text-nex-grey hover:text-nex-white',
              ].join(' ')}
            >
              {item.label}
            </Link>
          ))}
          <div className="border-t border-nex-ink/10 mt-2 pt-3 flex items-center justify-between px-3">
            <span className="font-jost text-xs text-nex-grey truncate">{email}</span>
            <UserMenu email={email} onLogout={handleLogout} accountHref="/admin/profile" />
          </div>
        </nav>
      )}
    </header>
  )
}

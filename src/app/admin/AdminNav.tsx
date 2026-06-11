'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { UserRole } from '@/lib/supabase'

interface Props {
  role: UserRole
  currentPath: string
}

export function AdminNav({ role, currentPath }: Props) {
  const router = useRouter()

  async function handleLogout() {
    await fetch('/api/admin/auth', { method: 'DELETE' })
    router.push('/admin/login')
  }

  const navItems = [
    { href: '/admin', label: 'Leads' },
    ...(role === 'owner' ? [{ href: '/admin/users', label: 'Usuarios' }] : []),
    { href: '/admin/profile', label: 'Mi cuenta' },
  ]

  return (
    <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <span className="font-jost font-bold text-xl text-nex-white">nexdevp</span>
          <span className="font-dm-mono text-[10px] tracking-[0.2em] uppercase text-nex-green border border-nex-green/30 rounded px-2 py-0.5">
            CRM
          </span>
        </div>
        <nav className="flex gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={[
                'font-jost text-sm px-3 py-1.5 rounded-lg transition-colors',
                currentPath === item.href
                  ? 'text-nex-white bg-white/10'
                  : 'text-nex-grey hover:text-nex-white',
              ].join(' ')}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
      <button
        onClick={handleLogout}
        className="font-jost text-sm text-nex-grey hover:text-nex-white transition-colors"
      >
        Cerrar sesión
      </button>
    </header>
  )
}

'use client'

import { useRouter } from 'next/navigation'
import { UserMenu } from '@/components/theme/UserMenu'

export function ProyectoUserMenu({ email, locale }: { email: string; locale: 'es' | 'en' }) {
  const router = useRouter()

  async function handleLogout() {
    await fetch('/api/admin/auth', { method: 'DELETE' })
    router.refresh()
  }

  return <UserMenu email={email} onLogout={handleLogout} locale={locale} />
}

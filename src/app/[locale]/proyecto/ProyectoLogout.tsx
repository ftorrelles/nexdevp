'use client'

import { useRouter } from 'next/navigation'
import { UserMenu } from '@/components/theme/UserMenu'

interface Props {
  email: string
  name?: string
  locale: 'es' | 'en'
}

export function ProyectoUserMenu({ email, name, locale }: Props) {
  const router = useRouter()

  async function handleLogout() {
    await fetch('/api/admin/auth', { method: 'DELETE' })
    router.refresh()
  }

  return <UserMenu email={email} name={name} onLogout={handleLogout} locale={locale} />
}

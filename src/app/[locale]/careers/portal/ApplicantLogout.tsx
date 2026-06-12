'use client'

import { useRouter } from 'next/navigation'

export function ApplicantLogout({ label }: { label: string }) {
  const router = useRouter()

  async function handleLogout() {
    await fetch('/api/admin/auth', { method: 'DELETE' })
    router.refresh()
  }

  return (
    <button
      onClick={handleLogout}
      className="font-jost text-sm text-nex-grey hover:text-nex-white transition-colors"
    >
      {label}
    </button>
  )
}

'use client'

import { ChangePasswordForm } from '@/app/admin/profile/ChangePasswordForm'

interface Props {
  open: boolean
  onClose: () => void
  title?: string
}

export function ChangePasswordModal({ open, onClose, title = 'Cambiar contraseña' }: Props) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute -top-3 -right-3 h-8 w-8 rounded-full bg-nex-dark border border-nex-ink/20 text-nex-grey hover:text-nex-white flex items-center justify-center transition-colors z-10"
        >
          ✕
        </button>
        <ChangePasswordForm title={title} />
      </div>
    </div>
  )
}

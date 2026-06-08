'use client'

import { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/editorial/Button'
import { BOOKING_URL } from '@/lib/constants'

interface BookingDialogProps {
  triggerLabel?: string
  variant?: 'primary' | 'ghost'
}

export function BookingDialog({ triggerLabel, variant = 'primary' }: BookingDialogProps) {
  const t = useTranslations()
  const [open, setOpen] = useState(false)
  const label = triggerLabel ?? t('cta.book')

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button variant={variant} aria-label={t('aria.bookingButton')}>
          {label}
        </Button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-50 w-[90vw] max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-xl bg-surface border border-cream/10 shadow-xl focus:outline-none"
          aria-describedby="booking-dialog-description"
        >
          <div className="flex items-start justify-between p-6 border-b border-cream/10">
            <div>
              <Dialog.Title className="text-cream font-cormorant text-2xl">
                {t('booking.dialogTitle')}
              </Dialog.Title>
              <p id="booking-dialog-description" className="text-muted text-sm mt-1">
                {t('booking.dialogDescription')}
              </p>
            </div>
            <Dialog.Close asChild>
              <button
                className="text-muted hover:text-cream transition-colors ml-4 mt-1 focus-visible:ring-2 focus-visible:ring-accent rounded"
                aria-label={t('aria.closeDialog')}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </Dialog.Close>
          </div>

          {/* Iframe loads ONLY when dialog is open — protects LCP */}
          {open && (
            <div className="p-2">
              <iframe
                src={BOOKING_URL}
                title={t('booking.dialogTitle')}
                className="w-full h-[500px] rounded-lg border-0"
                loading="lazy"
              />
            </div>
          )}

          <div className="px-6 py-4 border-t border-cream/10 flex justify-end gap-3">
            <a
              href={BOOKING_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted hover:text-cream text-sm underline underline-offset-2 transition-colors"
            >
              {t('booking.fallbackLink')}
              <span className="sr-only">{t('aria.externalLink')}</span>
            </a>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

'use client'

import { useTranslations } from 'next-intl'
import { Button } from '@/components/editorial/Button'
import { WHATSAPP_NUMBER, BOOKING_URL } from '@/lib/constants'
import { pixelEvent } from '@/lib/pixel'

interface BookingDialogProps {
  triggerLabel?: string
  variant?: 'primary' | 'ghost'
}

const BOOKING_READY = !BOOKING_URL.includes('placeholder')

export function BookingDialog({ triggerLabel, variant = 'primary' }: BookingDialogProps) {
  const t = useTranslations()
  const label = triggerLabel ?? t('cta.book')

  if (BOOKING_READY) {
    return (
      <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer" onClick={() => pixelEvent('Schedule')}>
        <Button variant={variant} aria-label={t('aria.bookingButton')}>
          {label}
        </Button>
      </a>
    )
  }

  // Fallback: open WhatsApp with booking intent message
  const text = encodeURIComponent(
    'Hola, me gustaría agendar una llamada de diagnóstico gratuita con nexdevp.'
  )
  const waUrl = `https://wa.me/${WHATSAPP_NUMBER.replace(/\D/g, '')}?text=${text}`

  return (
    <a href={waUrl} target="_blank" rel="noopener noreferrer" onClick={() => pixelEvent('Schedule')}>
      <Button variant={variant} aria-label={t('aria.bookingButton')}>
        {label}
      </Button>
    </a>
  )
}

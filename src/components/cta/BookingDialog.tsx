'use client'

import { useTranslations } from 'next-intl'
import { Button } from '@/components/editorial/Button'
import { WHATSAPP_NUMBER, BOOKING_URL } from '@/lib/constants'
import { pixelEvent } from '@/lib/pixel'
import { appendUtmParams } from '@/lib/attribution'
import { readStoredAttribution } from '@/lib/attribution-storage'
import { PixelLink } from '@/components/analytics/PixelLink'

interface BookingDialogProps {
  triggerLabel?: string
  variant?: 'primary' | 'ghost'
}

const BOOKING_READY = !BOOKING_URL.includes('placeholder')

// Hands the stored campaign (utm_*) to the booking tool. Runs at click time so
// the page stays static; falls back to the plain link when nothing is stored.
function addCampaignToHref(e: React.SyntheticEvent<HTMLAnchorElement>): void {
  e.currentTarget.href = appendUtmParams(BOOKING_URL, readStoredAttribution())
}

export function BookingDialog({ triggerLabel, variant = 'primary' }: BookingDialogProps) {
  const t = useTranslations()
  const label = triggerLabel ?? t('cta.book')

  if (BOOKING_READY) {
    return (
      <a
        href={BOOKING_URL}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => {
          addCampaignToHref(e)
          pixelEvent('Schedule')
        }}
        onAuxClick={addCampaignToHref}
      >
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
    <PixelLink event="Contact" href={waUrl} target="_blank" rel="noopener noreferrer">
      <Button variant={variant} aria-label={t('aria.bookingButton')}>
        {label}
      </Button>
    </PixelLink>
  )
}

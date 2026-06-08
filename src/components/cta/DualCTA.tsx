import { BookingDialog } from './BookingDialog'
import { WhatsAppLink } from './WhatsAppLink'

type DualCTAVariant = 'hero' | 'section' | 'page'

interface DualCTAProps {
  variant?: DualCTAVariant
}

const layoutClasses: Record<DualCTAVariant, string> = {
  hero: 'flex flex-col sm:flex-row items-center gap-4',
  section: 'flex flex-col sm:flex-row items-start gap-3',
  page: 'flex flex-col items-center gap-3 w-full max-w-sm mx-auto',
}

export function DualCTA({ variant = 'section' }: DualCTAProps) {
  return (
    <div className={layoutClasses[variant]}>
      <BookingDialog />
      <WhatsAppLink />
    </div>
  )
}

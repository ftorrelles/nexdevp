'use client'

import { usePathname } from '@/i18n/navigation'
import { Link } from '@/i18n/navigation'
import type { Locale } from '@/content/types'

export function LocaleSwitcher({ locale }: { locale: Locale }) {
  const pathname = usePathname()

  return (
    <div className="flex gap-3">
      {(['es', 'en'] as Locale[]).map((loc) => (
        <Link
          key={loc}
          href={pathname}
          locale={loc}
          className={`font-mono text-xs px-3 py-1.5 rounded border transition-colors ${
            locale === loc
              ? 'border-nex-green text-nex-green bg-nex-green/10'
              : 'border-white/10 text-nex-grey hover:border-white/30 hover:text-nex-white'
          }`}
        >
          {loc.toUpperCase()}
        </Link>
      ))}
    </div>
  )
}

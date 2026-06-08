'use client'

import { usePathname, Link } from '@/i18n/navigation'
import type { Locale } from '@/content/types'

interface LocaleSwitcherProps {
  /** Current active locale */
  locale: Locale
  /**
   * Optional per-locale slug map for case study pages.
   * Keys are locale codes; values are the translated slugs.
   * When provided, the switcher builds locale-correct case URLs.
   */
  slugMap?: Record<string, string>
}

const locales: Locale[] = ['es', 'en']

export function LocaleSwitcher({ locale, slugMap }: LocaleSwitcherProps) {
  const pathname = usePathname()

  return (
    <nav aria-label="Language switcher" className="flex items-center gap-1">
      {locales.map((loc, i) => {
        // If we have a slugMap, we need to replace the slug segment in the path
        // for the target locale. The pathname from next-intl is locale-stripped.
        const href = slugMap
          ? pathname.replace(/[^/]+$/, slugMap[loc] ?? slugMap[locale] ?? '')
          : pathname

        const isActive = loc === locale

        return (
          <span key={loc} className="flex items-center gap-1">
            {i > 0 && <span className="text-muted text-xs select-none">|</span>}
            <Link
              href={href}
              locale={loc}
              className={[
                'text-xs font-dm-mono uppercase tracking-widest transition-colors',
                isActive
                  ? 'text-cream cursor-default pointer-events-none'
                  : 'text-muted hover:text-cream',
              ].join(' ')}
              aria-current={isActive ? 'true' : undefined}
            >
              {loc.toUpperCase()}
            </Link>
          </span>
        )
      })}
    </nav>
  )
}

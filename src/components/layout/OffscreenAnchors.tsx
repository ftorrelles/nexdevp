'use client'

import { useEffect } from 'react'
import { renderAllOffscreenSections } from '@/lib/offscreen'

// Keeps anchor navigation exact on a page whose sections use OffscreenSection:
// before any in-page link or hash change scrolls, all sections are rendered so
// the target position is not computed from estimated heights.
export function OffscreenAnchors(): null {
  useEffect(() => {
    // Arrived on `/#hash` through client-side navigation: the inline boot script
    // did not run, so fix the layout and re-align once.
    if (window.location.hash && renderAllOffscreenSections()) {
      document.getElementById(decodeURIComponent(window.location.hash.slice(1)))?.scrollIntoView()
    }

    const onClick = (event: MouseEvent): void => {
      if (!(event.target instanceof Element)) return
      if (event.target.closest('a[href*="#"]')) renderAllOffscreenSections()
    }
    const onHashChange = (): void => {
      renderAllOffscreenSections()
    }

    document.addEventListener('click', onClick, true)
    window.addEventListener('hashchange', onHashChange)
    return () => {
      document.removeEventListener('click', onClick, true)
      window.removeEventListener('hashchange', onHashChange)
    }
  }, [])

  return null
}

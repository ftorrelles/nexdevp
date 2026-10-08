'use client'

import { useEffect, useRef } from 'react'

const ENABLE_QUERY =
  '(pointer: fine) and (min-width: 1024px) and (prefers-reduced-motion: no-preference)'
const INTERACTIVE = 'a, button, [role="button"], label, select, summary, .cursor-pointer'
const TEXT_FIELD = 'input, textarea, [contenteditable="true"]'
const ACCENT_SURFACE_CLASS = 'bg-nex-green'
// Set on <html> only while the custom cursor is on screen; globals.css hides the native one.
const ACTIVE_CLASS = 'custom-cursor'

export function CustomCursor(): React.JSX.Element {
  const rootRef = useRef<HTMLDivElement>(null)
  const cursorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = rootRef.current
    const cursor = cursorRef.current
    if (!root || !cursor) return

    const query = window.matchMedia(ENABLE_QUERY)
    const html = document.documentElement
    let active = false
    let onScreen = false

    const hide = (): void => {
      onScreen = false
      root.dataset.visible = 'false'
      html.classList.remove(ACTIVE_CLASS)
    }

    // Follows the pointer exactly so it always sits under the real cursor position.
    const onMove = (e: MouseEvent): void => {
      cursor.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`
      if (!onScreen) {
        onScreen = true
        root.dataset.visible = 'true'
        html.classList.add(ACTIVE_CLASS)
      }
    }

    const onOver = (e: MouseEvent): void => {
      const el = e.target instanceof Element ? e.target : null
      const interactive = el?.closest(INTERACTIVE) ?? null
      root.dataset.state = el?.closest(TEXT_FIELD) ? 'text' : 'default'
      root.dataset.accent = String(Boolean(interactive?.classList.contains(ACCENT_SURFACE_CLASS)))
    }

    const enable = (): void => {
      if (active) return
      active = true
      window.addEventListener('mousemove', onMove, { passive: true })
      document.addEventListener('mouseover', onOver, { passive: true })
      html.addEventListener('mouseleave', hide)
    }

    const disable = (): void => {
      if (!active) return
      active = false
      window.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseover', onOver)
      html.removeEventListener('mouseleave', hide)
      hide()
    }

    // Follow the media query live: a window that starts narrow (or emulated as touch)
    // and later qualifies must get the cursor, and the other way round must give it back.
    const sync = (): void => (query.matches ? enable() : disable())
    sync()
    query.addEventListener('change', sync)

    return () => {
      query.removeEventListener('change', sync)
      disable()
    }
  }, [])

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      data-visible="false"
      data-state="default"
      data-accent="false"
      className="group pointer-events-none fixed left-0 top-0 z-[9999] hidden opacity-0 transition-opacity duration-150 data-[visible=true]:opacity-100 lg:block"
    >
      <div ref={cursorRef} className="absolute left-0 top-0 will-change-transform">
        <svg
          width="26"
          height="26"
          viewBox="0 0 26 26"
          className="-ml-[3px] -mt-[2px] transition-opacity duration-150 group-data-[state=text]:opacity-0"
        >
          <path
            d="M3 2 L3 19.5 L7.8 14.6 L10.4 21.4 L13.1 20.3 L10.4 13.4 L16 13.4 Z"
            className="fill-nex-black stroke-nex-green drop-shadow-[0_0_4px_rgba(34,181,97,0.9)] transition-[stroke,filter] duration-200 group-data-[accent=true]:stroke-nex-white group-data-[accent=true]:drop-shadow-[0_0_4px_rgba(255,255,255,0.9)]"
            strokeWidth={1.7}
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  )
}

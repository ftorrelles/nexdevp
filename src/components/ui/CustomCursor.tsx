'use client'

import { useEffect, useRef } from 'react'

const ENABLE_QUERY =
  '(pointer: fine) and (min-width: 1024px) and (prefers-reduced-motion: no-preference)'
const INTERACTIVE = 'a, button, [role="button"], label, select, summary, .cursor-pointer'
const TEXT_FIELD = 'input, textarea, [contenteditable="true"]'
const ACCENT_SURFACE_CLASS = 'bg-nex-green'
// Set on <html> only while the custom cursor is on screen; globals.css hides the native one.
const ACTIVE_CLASS = 'custom-cursor'
const RING_EASE = 0.2
const SETTLED_PX = 0.1

function place(el: HTMLElement, x: number, y: number): void {
  el.style.transform = `translate3d(${x}px, ${y}px, 0)`
}

export function CustomCursor(): React.JSX.Element {
  const rootRef = useRef<HTMLDivElement>(null)
  const dotRef = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = rootRef.current
    const dot = dotRef.current
    const ring = ringRef.current
    if (!root || !dot || !ring) return

    const query = window.matchMedia(ENABLE_QUERY)
    const html = document.documentElement
    const target = { x: 0, y: 0 }
    const ringPos = { x: 0, y: 0 }
    let frame = 0
    let active = false
    let onScreen = false

    // The ring eases towards the pointer and the loop stops once it arrives.
    const tick = (): void => {
      ringPos.x += (target.x - ringPos.x) * RING_EASE
      ringPos.y += (target.y - ringPos.y) * RING_EASE
      place(ring, ringPos.x, ringPos.y)
      const settled =
        Math.abs(target.x - ringPos.x) < SETTLED_PX && Math.abs(target.y - ringPos.y) < SETTLED_PX
      frame = settled ? 0 : requestAnimationFrame(tick)
    }

    const hide = (): void => {
      onScreen = false
      root.dataset.visible = 'false'
      html.classList.remove(ACTIVE_CLASS)
    }

    const onMove = (e: MouseEvent): void => {
      target.x = e.clientX
      target.y = e.clientY
      place(dot, target.x, target.y)
      if (!onScreen) {
        // First move (or re-entry): snap the ring, then swap the native cursor for ours.
        onScreen = true
        ringPos.x = target.x
        ringPos.y = target.y
        place(ring, ringPos.x, ringPos.y)
        root.dataset.visible = 'true'
        html.classList.add(ACTIVE_CLASS)
      }
      if (!frame) frame = requestAnimationFrame(tick)
    }

    const onOver = (e: MouseEvent): void => {
      const el = e.target instanceof Element ? e.target : null
      const interactive = el?.closest(INTERACTIVE) ?? null
      const state = el?.closest(TEXT_FIELD) ? 'text' : interactive ? 'link' : 'default'
      root.dataset.state = state
      root.dataset.accent = String(
        state === 'link' && Boolean(interactive?.classList.contains(ACCENT_SURFACE_CLASS)),
      )
    }

    const onDown = (): void => {
      root.dataset.pressed = 'true'
    }
    const onUp = (): void => {
      root.dataset.pressed = 'false'
    }

    const enable = (): void => {
      if (active) return
      active = true
      window.addEventListener('mousemove', onMove, { passive: true })
      document.addEventListener('mouseover', onOver, { passive: true })
      document.addEventListener('mousedown', onDown, { passive: true })
      document.addEventListener('mouseup', onUp, { passive: true })
      html.addEventListener('mouseleave', hide)
    }

    const disable = (): void => {
      if (!active) return
      active = false
      window.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseover', onOver)
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('mouseup', onUp)
      html.removeEventListener('mouseleave', hide)
      if (frame) cancelAnimationFrame(frame)
      frame = 0
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
      data-pressed="false"
      className="group pointer-events-none fixed left-0 top-0 z-[9999] hidden opacity-0 transition-opacity duration-200 data-[visible=true]:opacity-100 lg:block"
    >
      <div ref={ringRef} className="absolute left-0 top-0 will-change-transform">
        <div className="-ml-[18px] -mt-[18px] h-9 w-9 rounded-full border-[1.5px] border-nex-green/50 transition-[transform,background-color,border-color,opacity] duration-200 ease-out group-data-[pressed=true]:scale-75 group-data-[state=link]:scale-150 group-data-[state=link]:border-nex-green group-data-[state=link]:bg-nex-green/10 group-data-[state=link]:group-data-[pressed=true]:scale-125 group-data-[state=link]:group-data-[accent=true]:border-nex-white group-data-[state=link]:group-data-[accent=true]:bg-nex-white/15 group-data-[state=text]:opacity-0" />
      </div>
      <div ref={dotRef} className="absolute left-0 top-0 will-change-transform">
        <div className="-ml-[3px] -mt-[3px] h-1.5 w-1.5 rounded-full bg-nex-green transition-[transform,opacity] duration-150 ease-out group-data-[state=link]:scale-0 group-data-[state=text]:opacity-0" />
      </div>
    </div>
  )
}

'use client'

import { useEffect, useRef, useState, type ReactElement } from 'react'
import type { CyberGridHandle } from './cyberGridScene'

/**
 * Section backdrop that lazily mounts the Three.js cyber grid, keeps it paused
 * while off-screen or on a hidden tab, and falls back to a static gradient when
 * the visitor asks for reduced motion.
 */
export function CyberGridBackdrop(): ReactElement {
  const ref = useRef<HTMLDivElement>(null)
  const handleRef = useRef<CyberGridHandle | null>(null)
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    setReduced(reducedMotion)
    if (reducedMotion) return

    let cancelled = false
    let inView = false

    function sync(): void {
      const handle = handleRef.current
      if (!handle) return
      if (inView && !document.hidden) handle.resume()
      else handle.pause()
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting
        sync()
      },
      { threshold: 0 },
    )
    observer.observe(element)

    function onVisibility(): void {
      sync()
    }
    document.addEventListener('visibilitychange', onVisibility)

    void import('./cyberGridScene').then((module) => {
      if (cancelled) return
      handleRef.current = module.createCyberGrid(element)
      sync()
    })

    return () => {
      cancelled = true
      observer.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
      handleRef.current?.dispose()
      handleRef.current = null
    }
  }, [])

  return (
    <div ref={ref} aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {reduced ? (
        <div className="h-full w-full bg-[radial-gradient(ellipse_at_50%_100%,rgba(34,181,97,0.12),transparent_65%)]" />
      ) : null}
    </div>
  )
}

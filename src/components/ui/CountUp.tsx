'use client'

import { useEffect, useRef, useState, type ReactElement } from 'react'

interface CountUpProps {
  value: number
  /** Renders the value at each animation frame. Defaults to rounding to an integer. */
  format?: (value: number) => string
  /** Animation length in milliseconds. */
  durationMs?: number
  /** Extra classes applied to the rendered span. */
  className?: string
  /**
   * Literal text prepended to the value when no `format` is given. Kept serializable so a
   * Server Component can render this client component without crossing the RSC function boundary.
   */
  prefix?: string
  /** Zero-pads the rounded value to this many digits when no `format` is given. */
  padTo?: number
  /** Literal text appended to the value when no `format` is given. */
  suffix?: string
}

const DEFAULT_DURATION_MS = 900
const VIEWPORT_THRESHOLD = 0.3

// Cubic ease-out: fast start, soft landing.
const easeOut = (progress: number): number => 1 - Math.pow(1 - progress, 3)

export function CountUp({
  value,
  format,
  durationMs = DEFAULT_DURATION_MS,
  className,
  prefix = '',
  padTo,
  suffix = '',
}: CountUpProps): ReactElement {
  const ref = useRef<HTMLSpanElement>(null)
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (prefersReducedMotion) {
      setCurrent(value)
      return
    }

    let frame = 0
    let observer: IntersectionObserver | null = null

    const animate = (): void => {
      const start = performance.now()
      const step = (now: number): void => {
        const progress = Math.min(1, (now - start) / durationMs)
        setCurrent(value * easeOut(progress))
        if (progress < 1) {
          frame = requestAnimationFrame(step)
        } else {
          setCurrent(value)
          frame = 0
        }
      }
      frame = requestAnimationFrame(step)
    }

    if (typeof IntersectionObserver === 'undefined') {
      animate()
    } else {
      observer = new IntersectionObserver(
        (entries) => {
          if (!entries.some((entry) => entry.isIntersecting)) return
          observer?.disconnect()
          observer = null
          animate()
        },
        { threshold: VIEWPORT_THRESHOLD },
      )
      observer.observe(element)
    }

    return () => {
      if (frame) cancelAnimationFrame(frame)
      observer?.disconnect()
    }
  }, [value, durationMs])

  const rounded = String(Math.round(current))
  const rendered = format
    ? format(current)
    : `${prefix}${padTo ? rounded.padStart(padTo, '0') : rounded}${suffix}`

  return (
    <span ref={ref} className={className ? `tabular-nums ${className}` : 'tabular-nums'}>
      {rendered}
    </span>
  )
}

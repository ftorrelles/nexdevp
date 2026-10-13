'use client'

import dynamic from 'next/dynamic'
import { useEffect, useRef, useState, type ReactElement } from 'react'

const AgentCoreScene = dynamic(
  () => import('./AgentCoreScene').then((module) => module.AgentCoreScene),
  { ssr: false },
)

export function ParticleBackground(): ReactElement {
  const ref = useRef<HTMLDivElement>(null)
  const scrollRef = useRef(0)
  const pointerRef = useRef({ x: 0, y: 0 })
  const [visible, setVisible] = useState(false)
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(media.matches)
    const el = ref.current

    function updateScroll(): void {
      if (!el) return
      const rect = el.getBoundingClientRect()
      const total = rect.height + window.innerHeight
      scrollRef.current = Math.min(1, Math.max(0, (window.innerHeight - rect.top) / total))
    }

    function updatePointer(event: PointerEvent): void {
      pointerRef.current.x = (event.clientX / window.innerWidth) * 2 - 1
      pointerRef.current.y = -((event.clientY / window.innerHeight) * 2 - 1)
    }

    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), {
      threshold: 0,
    })
    if (el) observer.observe(el)
    window.addEventListener('scroll', updateScroll, { passive: true })
    window.addEventListener('pointermove', updatePointer, { passive: true })
    updateScroll()

    return () => {
      observer.disconnect()
      window.removeEventListener('scroll', updateScroll)
      window.removeEventListener('pointermove', updatePointer)
    }
  }, [])

  return (
    <div ref={ref} aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {reduced ? (
        <div className="h-full w-full bg-[radial-gradient(circle_at_center,rgba(34,181,97,0.12),transparent_65%)]" />
      ) : (
        <AgentCoreScene scroll={scrollRef} pointer={pointerRef} paused={!visible} />
      )}
    </div>
  )
}

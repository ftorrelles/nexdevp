'use client'

import { useEffect, useRef } from 'react'

export function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)
  const posRef = useRef({ x: -100, y: -100 })
  const ringPosRef = useRef({ x: -100, y: -100 })
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    const move = (e: MouseEvent) => {
      posRef.current = { x: e.clientX, y: e.clientY }
    }
    window.addEventListener('mousemove', move)

    const animate = () => {
      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${posRef.current.x - 4}px, ${posRef.current.y - 4}px)`
      }
      ringPosRef.current.x += (posRef.current.x - ringPosRef.current.x) * 0.12
      ringPosRef.current.y += (posRef.current.y - ringPosRef.current.y) * 0.12
      if (ringRef.current) {
        ringRef.current.style.transform = `translate(${ringPosRef.current.x - 20}px, ${ringPosRef.current.y - 20}px)`
      }
      rafRef.current = requestAnimationFrame(animate)
    }
    rafRef.current = requestAnimationFrame(animate)

    const attachListeners = () => {
      const onEnter = (e: Event) => {
        const target = e.currentTarget as HTMLElement
        const isGreen =
          target.classList.contains('bg-nex-green') ||
          target.classList.toString().includes('green') ||
          getComputedStyle(target).backgroundColor.includes('34, 181') ||
          getComputedStyle(target).backgroundColor.includes('34,181')

        if (dotRef.current) {
          dotRef.current.style.background = '#ffffff'
          dotRef.current.style.boxShadow = '0 0 8px 3px rgba(255,255,255,0.8), 0 0 20px 6px rgba(255,255,255,0.3)'
        }
        if (ringRef.current) {
          ringRef.current.style.borderColor = isGreen ? 'rgba(255,255,255,0.9)' : 'rgba(34,181,97,0.9)'
          ringRef.current.style.boxShadow = isGreen
            ? '0 0 14px 3px rgba(255,255,255,0.2)'
            : '0 0 14px 3px rgba(34,181,97,0.4)'
          ringRef.current.style.width = '48px'
          ringRef.current.style.height = '48px'
          ringRef.current.style.marginLeft = '-4px'
          ringRef.current.style.marginTop = '-4px'
        }
      }

      const onLeave = () => {
        if (dotRef.current) {
          dotRef.current.style.background = '#22b561'
          dotRef.current.style.boxShadow =
            '0 0 8px 3px rgba(34,181,97,0.8), 0 0 20px 6px rgba(34,181,97,0.4)'
        }
        if (ringRef.current) {
          ringRef.current.style.borderColor = 'rgba(34,181,97,0.6)'
          ringRef.current.style.boxShadow =
            '0 0 12px 2px rgba(34,181,97,0.2), inset 0 0 12px 2px rgba(34,181,97,0.05)'
          ringRef.current.style.width = '40px'
          ringRef.current.style.height = '40px'
          ringRef.current.style.marginLeft = '0'
          ringRef.current.style.marginTop = '0'
        }
      }

      document.querySelectorAll('a, button, [role="button"], input, textarea, select, label').forEach((el) => {
        el.addEventListener('mouseenter', onEnter)
        el.addEventListener('mouseleave', onLeave)
      })
    }

    // Run once DOM is ready, then observe for new elements (e.g. modals)
    attachListeners()
    const observer = new MutationObserver(attachListeners)
    observer.observe(document.body, { childList: true, subtree: true })

    return () => {
      window.removeEventListener('mousemove', move)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      observer.disconnect()
    }
  }, [])

  return (
    <>
      {/* Dot */}
      <div
        ref={dotRef}
        className="fixed top-0 left-0 w-2 h-2 rounded-full pointer-events-none z-[9999]"
        style={{
          background: '#22b561',
          boxShadow: '0 0 8px 3px rgba(34,181,97,0.8), 0 0 20px 6px rgba(34,181,97,0.4)',
          willChange: 'transform',
          transition: 'background 0.15s, box-shadow 0.15s',
        }}
      />
      {/* Ring */}
      <div
        ref={ringRef}
        className="fixed top-0 left-0 w-10 h-10 rounded-full pointer-events-none z-[9998]"
        style={{
          border: '1px solid rgba(34,181,97,0.6)',
          boxShadow: '0 0 12px 2px rgba(34,181,97,0.2), inset 0 0 12px 2px rgba(34,181,97,0.05)',
          willChange: 'transform',
          transition: 'width 0.2s, height 0.2s, border-color 0.15s, box-shadow 0.15s, margin 0.2s',
        }}
      />
    </>
  )
}

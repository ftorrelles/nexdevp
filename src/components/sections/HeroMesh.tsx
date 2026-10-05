'use client'

import { useEffect, useId, useRef, type ReactElement } from 'react'
import { MESH_DURATION, MESH_RADIUS, meshPoint, meshStrength } from './heroMeshGeometry'

export function HeroMesh(): ReactElement {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const patternId = useId()

  useEffect(() => {
    const canvas = canvasRef.current
    const section = canvas?.closest('section')
    const context = canvas?.getContext('2d')
    if (!canvas || !section || !context) return

    const motion = matchMedia('(prefers-reduced-motion: reduce)')
    const finePointer = matchMedia('(hover: hover) and (pointer: fine)')
    let width = 0
    let height = 0
    let frame = 0
    let visible = false
    let lastMove = -Infinity
    let lastDraw = 0
    let pointerX = 0
    let pointerY = 0
    let clientX = 0
    let clientY = 0
    let ink = ''
    let green = ''

    const canAnimate = (): boolean => visible && !document.hidden && !motion.matches && finePointer.matches

    function draw(strength = 0, phase = 0): void {
      context!.clearRect(0, 0, width, height)
      const path = new Path2D()
      for (let x = 15; x <= width + 30; x += 30) {
        for (let y = 15; y <= height + 30; y += 30) {
          const [dotX, dotY] = meshPoint(x, y, pointerX, pointerY, phase, strength)
          path.moveTo(dotX + 1, dotY)
          path.arc(dotX, dotY, 1, 0, Math.PI * 2)
        }
      }
      context!.fillStyle = `rgb(${ink} / 0.1)`
      context!.fill(path)
      if (strength > 0) {
        const highlight = context!.createRadialGradient(pointerX, pointerY, 0, pointerX, pointerY, MESH_RADIUS)
        highlight.addColorStop(0, `rgb(${green} / ${0.5 * strength})`)
        highlight.addColorStop(0.5, `rgb(${green} / ${0.25 * strength})`)
        highlight.addColorStop(1, `rgb(${green} / 0)`)
        context!.fillStyle = highlight
        context!.fill(path)
      }
    }

    function stop(): void {
      cancelAnimationFrame(frame)
      frame = 0
      lastMove = -Infinity
    }

    function tick(now: number): void {
      frame = 0
      if (!canAnimate()) return
      const elapsed = now - lastMove
      if (elapsed >= MESH_DURATION) {
        draw()
        return
      }
      if (now - lastDraw >= 16) {
        const rect = section!.getBoundingClientRect()
        pointerX += (clientX - rect.left - pointerX) * 0.28
        pointerY += (clientY - rect.top - pointerY) * 0.28
        draw(meshStrength(elapsed), now / 180)
        lastDraw = now
      }
      frame = requestAnimationFrame(tick)
    }

    function move(event: PointerEvent): void {
      if (!canAnimate() || event.pointerType === 'touch') return
      clientX = event.clientX
      clientY = event.clientY
      if (performance.now() - lastMove >= MESH_DURATION) {
        const rect = section!.getBoundingClientRect()
        pointerX = clientX - rect.left
        pointerY = clientY - rect.top
      }
      lastMove = performance.now()
      if (!frame) frame = requestAnimationFrame(tick)
    }

    function reset(): void {
      stop()
      if (visible && !document.hidden) draw()
    }

    function resize(): void {
      stop()
      const rect = section!.getBoundingClientRect()
      width = rect.width
      height = rect.height
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
      canvas!.width = Math.round(width * dpr)
      canvas!.height = Math.round(height * dpr)
      context!.setTransform(dpr, 0, 0, dpr, 0, 0)
      const tokens = getComputedStyle(section!)
      ink = tokens.getPropertyValue('--nex-ink').trim()
      green = tokens.getPropertyValue('--nex-green').trim()
      draw()
      canvas!.parentElement!.dataset.ready = 'true'
    }

    const resizeObserver = new ResizeObserver(resize)
    const visibilityObserver = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      reset()
    })
    const themeObserver = new MutationObserver(resize)
    resize()
    resizeObserver.observe(section)
    visibilityObserver.observe(section)
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    section.addEventListener('pointermove', move, { passive: true })
    section.addEventListener('pointerleave', reset, { passive: true })
    document.addEventListener('visibilitychange', reset)
    motion.addEventListener('change', reset)
    finePointer.addEventListener('change', reset)
    window.addEventListener('resize', resize, { passive: true })

    return () => {
      stop()
      resizeObserver.disconnect()
      visibilityObserver.disconnect()
      themeObserver.disconnect()
      section.removeEventListener('pointermove', move)
      section.removeEventListener('pointerleave', reset)
      document.removeEventListener('visibilitychange', reset)
      motion.removeEventListener('change', reset)
      finePointer.removeEventListener('change', reset)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <div aria-hidden="true" className="group pointer-events-none absolute inset-0 overflow-hidden">
      <svg className="absolute inset-0 h-full w-full group-data-[ready=true]:hidden" focusable="false">
        <defs>
          <pattern id={patternId} width="30" height="30" patternUnits="userSpaceOnUse">
            <circle cx="15" cy="15" r="1" className="fill-nex-ink/10" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${patternId})`} />
      </svg>
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
    </div>
  )
}

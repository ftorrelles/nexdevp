'use client'

import { useEffect, useRef, type ReactElement } from 'react'

const NODE_COUNT = 52
const LINK_DISTANCE = 150
const POINTER_RADIUS = 160
const DRIFT = 0.22

interface Node {
  x: number
  y: number
  vx: number
  vy: number
}

export function JoinUsNetwork(): ReactElement {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const section = canvas?.closest('section')
    const context = canvas?.getContext('2d')
    if (!canvas || !section || !context) return

    const motion = matchMedia('(prefers-reduced-motion: reduce)')
    let width = 0
    let height = 0
    let frame = 0
    let visible = false
    let ink = ''
    let green = ''
    let pointerX = -99999
    let pointerY = -99999
    let nodes: Node[] = []

    const canAnimate = (): boolean => visible && !document.hidden && !motion.matches

    function seed(): void {
      nodes = Array.from({ length: NODE_COUNT }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * DRIFT,
        vy: (Math.random() - 0.5) * DRIFT,
      }))
    }

    function draw(): void {
      context!.clearRect(0, 0, width, height)

      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i]
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j]
          const dist = Math.hypot(a.x - b.x, a.y - b.y)
          if (dist >= LINK_DISTANCE) continue
          const midX = (a.x + b.x) / 2
          const midY = (a.y + b.y) / 2
          const nearPointer = Math.hypot(midX - pointerX, midY - pointerY) < POINTER_RADIUS
          const weight = 1 - dist / LINK_DISTANCE
          context!.strokeStyle = nearPointer
            ? `rgb(${green} / ${0.1 + weight * 0.5})`
            : `rgb(${ink} / ${weight * 0.12})`
          context!.lineWidth = 1
          context!.beginPath()
          context!.moveTo(a.x, a.y)
          context!.lineTo(b.x, b.y)
          context!.stroke()
        }
      }

      for (const node of nodes) {
        const nearPointer = Math.hypot(node.x - pointerX, node.y - pointerY) < POINTER_RADIUS
        context!.fillStyle = nearPointer ? `rgb(${green} / 0.95)` : `rgb(${ink} / 0.28)`
        context!.beginPath()
        context!.arc(node.x, node.y, nearPointer ? 2.6 : 1.5, 0, Math.PI * 2)
        context!.fill()
      }
    }

    function step(): void {
      for (const node of nodes) {
        node.x += node.vx
        node.y += node.vy
        if (node.x <= 0 || node.x >= width) node.vx *= -1
        if (node.y <= 0 || node.y >= height) node.vy *= -1
      }
      draw()
    }

    function tick(): void {
      frame = 0
      if (!canAnimate()) return
      step()
      frame = requestAnimationFrame(tick)
    }

    function start(): void {
      if (!frame && canAnimate()) frame = requestAnimationFrame(tick)
    }

    function stop(): void {
      cancelAnimationFrame(frame)
      frame = 0
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
      seed()
      draw()
      canvas!.parentElement!.dataset.ready = 'true'
      start()
    }

    function onPointerMove(event: PointerEvent): void {
      const rect = section!.getBoundingClientRect()
      pointerX = event.clientX - rect.left
      pointerY = event.clientY - rect.top
      draw()
    }

    function onPointerLeave(): void {
      pointerX = -99999
      pointerY = -99999
      draw()
    }

    function onEnvironmentChange(): void {
      if (canAnimate()) start()
      else {
        stop()
        draw()
      }
    }

    const resizeObserver = new ResizeObserver(resize)
    const visibilityObserver = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      onEnvironmentChange()
    })
    resize()
    resizeObserver.observe(section)
    visibilityObserver.observe(section)
    section.addEventListener('pointermove', onPointerMove, { passive: true })
    section.addEventListener('pointerleave', onPointerLeave, { passive: true })
    document.addEventListener('visibilitychange', onEnvironmentChange)
    motion.addEventListener('change', onEnvironmentChange)
    window.addEventListener('resize', resize, { passive: true })

    return () => {
      stop()
      resizeObserver.disconnect()
      visibilityObserver.disconnect()
      section.removeEventListener('pointermove', onPointerMove)
      section.removeEventListener('pointerleave', onPointerLeave)
      document.removeEventListener('visibilitychange', onEnvironmentChange)
      motion.removeEventListener('change', onEnvironmentChange)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <div aria-hidden="true" className="group pointer-events-none absolute inset-0 overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
    </div>
  )
}

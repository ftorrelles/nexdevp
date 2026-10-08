'use client'

import { useEffect, useRef, type ReactElement } from 'react'

// Same 30px lattice the hero mesh uses, so the signal runs node-to-node along the existing dots.
const GRID = 30
const OFFSET = 15
const GROW_MS = 85 // one lattice step per this interval
const NODE_DECAY = 0.03 // glow lost per frame (~1.1s tail at 30fps)
const EDGE_DECAY = 0.03
const MAX_NODES = 90
const BRANCH_CHANCE = 0.25
const FRAME_MS = 33
const PAUSE_MIN_MS = 1800
const PAUSE_MAX_MS = 4200

const NEIGHBORS: ReadonlyArray<readonly [number, number]> = [
  [-1, 0], [1, 0], [0, -1], [0, 1],
  [-1, -1], [1, -1], [-1, 1], [1, 1],
]

interface Edge {
  ax: number
  ay: number
  bx: number
  by: number
  glow: number
}

interface SignalTree {
  nodes: Map<string, number> // lattice key -> glow
  edges: Edge[]
  tips: Array<{ i: number; j: number }>
}

export function HeroEnergy(): ReactElement {
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
    let last = 0
    let lastGrow = 0
    let green = ''
    let tree: SignalTree | null = null
    let nextSpawn = 0

    const canAnimate = (): boolean => visible && !document.hidden && !motion.matches
    const cols = (): number => Math.max(1, Math.round(width / GRID))
    const rows = (): number => Math.max(1, Math.round(height / GRID))
    const key = (i: number, j: number): string => `${i},${j}`

    function spawn(now: number): void {
      const i = Math.floor(Math.random() * cols())
      const j = Math.floor(Math.random() * rows())
      tree = { nodes: new Map([[key(i, j), 1]]), edges: [], tips: [{ i, j }] }
      lastGrow = now
    }

    function grow(): void {
      if (!tree) return
      if (tree.nodes.size >= MAX_NODES) {
        tree.tips = []
        return
      }
      const next: Array<{ i: number; j: number }> = []
      for (const tip of tree.tips) {
        const targets = [...NEIGHBORS].sort(() => Math.random() - 0.5).slice(0, 4)
        const wanted = 1 + (Math.random() < BRANCH_CHANCE ? 1 : 0)
        let made = 0
        for (const [di, dj] of targets) {
          if (made >= wanted) break
          const ni = tip.i + di
          const nj = tip.j + dj
          if (ni < 0 || nj < 0 || ni >= cols() || nj >= rows()) continue
          const nk = key(ni, nj)
          if (tree.nodes.has(nk)) continue
          tree.nodes.set(nk, 1)
          tree.edges.push({
            ax: OFFSET + tip.i * GRID,
            ay: OFFSET + tip.j * GRID,
            bx: OFFSET + ni * GRID,
            by: OFFSET + nj * GRID,
            glow: 1,
          })
          next.push({ i: ni, j: nj })
          made++
        }
      }
      tree.tips = next
    }

    function draw(): void {
      context!.clearRect(0, 0, width, height)
      if (!green) green = getComputedStyle(section!).getPropertyValue('--nex-green').trim()
      if (!tree) return

      context!.lineWidth = 1.3
      for (const edge of tree.edges) {
        context!.strokeStyle = `rgb(${green} / ${edge.glow * 0.5})`
        context!.beginPath()
        context!.moveTo(edge.ax, edge.ay)
        context!.lineTo(edge.bx, edge.by)
        context!.stroke()
      }

      for (const [nodeKey, glow] of tree.nodes) {
        const [i, j] = nodeKey.split(',').map(Number)
        const px = OFFSET + i * GRID
        const py = OFFSET + j * GRID
        context!.fillStyle = `rgb(${green} / ${glow * 0.9})`
        context!.beginPath()
        context!.arc(px, py, 1.2 + glow * 2, 0, Math.PI * 2)
        context!.fill()
      }
    }

    function loop(now: number): void {
      frame = 0
      if (!canAnimate()) return
      if (now - last >= FRAME_MS) {
        last = now

        if (!tree && now >= nextSpawn) spawn(now)

        if (tree) {
          if (tree.tips.length > 0 && now - lastGrow >= GROW_MS) {
            lastGrow = now
            grow()
          }
          for (const [nodeKey, glow] of tree.nodes) {
            const next = glow - NODE_DECAY
            if (next <= 0) tree.nodes.delete(nodeKey)
            else tree.nodes.set(nodeKey, next)
          }
          for (const edge of tree.edges) edge.glow -= EDGE_DECAY
          tree.edges = tree.edges.filter((edge) => edge.glow > 0)
          if (tree.nodes.size === 0) {
            tree = null
            nextSpawn = now + PAUSE_MIN_MS + Math.random() * (PAUSE_MAX_MS - PAUSE_MIN_MS)
          }
        }

        draw()
      }
      frame = requestAnimationFrame(loop)
    }

    function start(): void {
      if (!frame && canAnimate()) {
        last = 0
        frame = requestAnimationFrame(loop)
      }
    }

    function stop(): void {
      cancelAnimationFrame(frame)
      frame = 0
    }

    function resize(): void {
      const rect = section!.getBoundingClientRect()
      width = rect.width
      height = rect.height
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
      canvas!.width = Math.round(width * dpr)
      canvas!.height = Math.round(height * dpr)
      context!.setTransform(dpr, 0, 0, dpr, 0, 0)
      green = getComputedStyle(section!).getPropertyValue('--nex-green').trim()
      tree = null
      nextSpawn = performance.now() + 700
      draw()
      canvas!.parentElement!.dataset.ready = 'true'
    }

    function onEnvironmentChange(): void {
      if (canAnimate()) start()
      else stop()
    }

    const resizeObserver = new ResizeObserver(resize)
    const visibilityObserver = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      onEnvironmentChange()
    })
    resize()
    resizeObserver.observe(section)
    visibilityObserver.observe(section)
    document.addEventListener('visibilitychange', onEnvironmentChange)
    motion.addEventListener('change', onEnvironmentChange)
    window.addEventListener('resize', resize, { passive: true })

    return () => {
      stop()
      resizeObserver.disconnect()
      visibilityObserver.disconnect()
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

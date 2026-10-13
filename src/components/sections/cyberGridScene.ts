import * as THREE from 'three'

/**
 * Imperative Three.js backdrop: an undulating neon wireframe grid that recedes
 * into fog. Framework-agnostic — the caller owns the container element and the
 * scene lifecycle, and is expected to call dispose() when the element unmounts.
 */

export interface CyberGridOptions {
  /** When true, paints a single static frame and never starts the animation loop. */
  reducedMotion?: boolean
}

export interface CyberGridHandle {
  /** Stops the animation loop without releasing GPU resources. */
  pause: () => void
  /** Restarts the animation loop after a pause. */
  resume: () => void
  /** Stops the loop and releases every GPU and DOM resource. */
  dispose: () => void
}

/** Page background, so the fog blends the horizon into the section itself. */
const BACKGROUND_COLOR = 0x191a1b
/** Brand accent green (nex-green). */
const ACCENT_COLOR = 0x22b561
const FOG_DENSITY = 0.015
const PLANE_SIZE = 150
const PLANE_SEGMENTS = 60
const WAVE_AMPLITUDE = 1.5
const WAVE_FREQUENCY = 0.1
const TIME_SCALE = 0.0005
const LINE_OPACITY = 0.35
const MAX_PIXEL_RATIO = 1.75

export function createCyberGrid(container: HTMLElement, options: CyberGridOptions = {}): CyberGridHandle {
  const scene = new THREE.Scene()
  scene.fog = new THREE.FogExp2(BACKGROUND_COLOR, FOG_DENSITY)

  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000)
  camera.position.set(0, 5, 40)
  // Aim above the horizon so the grid sits in the lower part of the frame and
  // leaves the upper area clear for the section's heading and card.
  camera.lookAt(0, 12, 0)

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO))
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.setClearAlpha(0)

  const canvas = renderer.domElement
  canvas.style.display = 'block'
  canvas.style.width = '100%'
  canvas.style.height = '100%'
  container.appendChild(canvas)

  const geometry = new THREE.PlaneGeometry(PLANE_SIZE, PLANE_SIZE, PLANE_SEGMENTS, PLANE_SEGMENTS)
  // Lay the plane flat (XZ instead of XY) so it reads as terrain.
  geometry.rotateX(-Math.PI / 2)

  const material = new THREE.MeshBasicMaterial({
    color: ACCENT_COLOR,
    wireframe: true,
    transparent: true,
    opacity: LINE_OPACITY,
  })

  scene.add(new THREE.Mesh(geometry, material))

  const position = geometry.getAttribute('position') as THREE.BufferAttribute

  function resize(): void {
    const width = container.clientWidth
    const height = container.clientHeight
    if (width === 0 || height === 0) return
    camera.aspect = width / height
    camera.updateProjectionMatrix()
    renderer.setSize(width, height, false)
  }

  const resizeObserver = new ResizeObserver(resize)
  resizeObserver.observe(container)
  resize()

  function paint(time: number): void {
    for (let index = 0; index < position.count; index += 1) {
      const x = position.getX(index)
      const z = position.getZ(index)
      position.setY(
        index,
        Math.sin(x * WAVE_FREQUENCY + time) * WAVE_AMPLITUDE +
          Math.cos(z * WAVE_FREQUENCY + time) * WAVE_AMPLITUDE,
      )
    }
    position.needsUpdate = true
    renderer.render(scene, camera)
  }

  let frameId = 0
  let running = false

  function tick(): void {
    frameId = window.requestAnimationFrame(tick)
    // Wrapped to the wave period so the phase stays bounded on long sessions.
    paint((Date.now() * TIME_SCALE) % (Math.PI * 2))
  }

  function pause(): void {
    if (!running) return
    running = false
    window.cancelAnimationFrame(frameId)
  }

  function resume(): void {
    if (running) return
    running = true
    frameId = window.requestAnimationFrame(tick)
  }

  function dispose(): void {
    pause()
    resizeObserver.disconnect()
    geometry.dispose()
    material.dispose()
    renderer.dispose()
    canvas.remove()
  }

  // Paint one frame up front so the backdrop is visible even while paused.
  paint(0)
  if (!options.reducedMotion) resume()

  return { pause, resume, dispose }
}

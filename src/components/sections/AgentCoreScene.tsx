'use client'

import { useMemo, useRef, type ReactElement } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Bloom, EffectComposer } from '@react-three/postprocessing'
import * as THREE from 'three'

const GREEN = '#22b561'

interface Vec2 {
  x: number
  y: number
}

function makeSprite(): THREE.Texture {
  const size = 64
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const context = canvas.getContext('2d')
  if (context) {
    const gradient = context.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
    gradient.addColorStop(0, 'rgba(255,255,255,1)')
    gradient.addColorStop(0.4, 'rgba(255,255,255,0.5)')
    gradient.addColorStop(1, 'rgba(255,255,255,0)')
    context.fillStyle = gradient
    context.fillRect(0, 0, size, size)
  }
  return new THREE.CanvasTexture(canvas)
}

function Field({ count = 1500 }: { count?: number }): ReactElement {
  const ref = useRef<THREE.Points>(null)
  const sprite = useMemo(makeSprite, [])
  const geometry = useMemo(() => {
    const positions = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 18
      positions[i * 3 + 1] = (Math.random() - 0.5) * 12
      positions[i * 3 + 2] = -Math.random() * 30 + 4
    }
    const buffer = new THREE.BufferGeometry()
    buffer.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    return buffer
  }, [count])

  useFrame((state) => {
    const points = ref.current
    if (!points) return
    const t = state.clock.elapsedTime
    points.rotation.z = Math.sin(t * 0.06) * 0.04
    points.position.y = Math.sin(t * 0.12) * 0.15
  })

  return (
    <points ref={ref} geometry={geometry}>
      <pointsMaterial
        map={sprite}
        color={GREEN}
        size={0.08}
        sizeAttenuation
        transparent
        opacity={0.85}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

function Rig({ scroll, pointer }: { scroll: { current: number }; pointer: { current: Vec2 } }): null {
  const { camera } = useThree()
  useFrame((_, delta) => {
    const damp = 1 - Math.pow(0.0001, delta)
    const targetX = pointer.current.x * 1.1
    const targetY = pointer.current.y * 0.7
    const targetZ = 3 - scroll.current * 16
    camera.position.x += (targetX - camera.position.x) * damp
    camera.position.y += (targetY - camera.position.y) * damp
    camera.position.z += (targetZ - camera.position.z) * damp
  })
  return null
}

export function AgentCoreScene({
  scroll,
  pointer,
  paused,
}: {
  scroll: { current: number }
  pointer: { current: Vec2 }
  paused: boolean
}): ReactElement {
  return (
    <Canvas
      dpr={[1, 1.75]}
      camera={{ position: [0, 0, 3], fov: 55 }}
      gl={{ antialias: true, alpha: true }}
      frameloop={paused ? 'never' : 'always'}
    >
      <Rig scroll={scroll} pointer={pointer} />
      <Field />
      <EffectComposer>
        <Bloom intensity={0.55} luminanceThreshold={0.25} mipmapBlur radius={0.5} />
      </EffectComposer>
    </Canvas>
  )
}

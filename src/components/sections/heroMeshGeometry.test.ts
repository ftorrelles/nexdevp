import { describe, expect, it } from 'vitest'
import { MESH_DURATION, MESH_RADIUS, meshPoint, meshStrength } from './heroMeshGeometry'

describe('hero mesh deformation', () => {
  it('moves actual line coordinates locally and varies the wave with time', () => {
    const initial = meshPoint(120, 100, 100, 100, 0, 1)
    const later = meshPoint(120, 100, 100, 100, 2, 1)
    expect(initial[0]).toBeGreaterThan(130)
    expect(initial[1]).toBe(100)
    expect(later[0]).not.toBe(initial[0])
  })

  it('leaves points outside the cursor radius and the resting mesh untouched', () => {
    expect(meshPoint(MESH_RADIUS, 0, 0, 0, 1, 1)).toEqual([MESH_RADIUS, 0])
    expect(meshPoint(20, 30, 0, 0, 1, 0)).toEqual([20, 30])
    expect(meshPoint(0, 0, 0, 0, 1, 1)).toEqual([0, 0])
  })

  it('decays to exactly zero within the bounded animation window', () => {
    expect(meshStrength(-1)).toBe(1)
    expect(meshStrength(0)).toBe(1)
    expect(meshStrength(MESH_DURATION / 2)).toBe(0.25)
    expect(meshStrength(MESH_DURATION)).toBe(0)
    expect(meshStrength(MESH_DURATION * 2)).toBe(0)
  })

  it('keeps the deformation finite and bounded throughout the cursor area', () => {
    for (let x = -MESH_RADIUS; x <= MESH_RADIUS; x += 10) {
      for (let y = -MESH_RADIUS; y <= MESH_RADIUS; y += 10) {
        const point = meshPoint(x, y, 0, 0, 0.5, 1)
        expect(Math.hypot(point[0] - x, point[1] - y)).toBeLessThanOrEqual(48)
      }
    }
  })
})

export const MESH_RADIUS = 230
export const MESH_DURATION = 1100

export function meshStrength(elapsed: number): number {
  return Math.max(0, 1 - Math.max(0, elapsed) / MESH_DURATION) ** 2
}

// Displace the grid itself, not a light painted over a stationary grid.
export function meshPoint(
  x: number,
  y: number,
  pointerX: number,
  pointerY: number,
  phase: number,
  strength: number,
): [number, number] {
  const dx = x - pointerX
  const dy = y - pointerY
  const distance = Math.hypot(dx, dy)
  if (distance >= MESH_RADIUS || distance === 0 || strength === 0) return [x, y]
  const envelope = (1 - distance / MESH_RADIUS) ** 2
  const wave = Math.sin(distance / 24 - phase) * 30
  const displacement = (18 + wave) * envelope * strength
  return [x + dx / distance * displacement, y + dy / distance * displacement]
}

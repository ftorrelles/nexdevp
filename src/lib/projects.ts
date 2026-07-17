export function computeProgressPct(
  deliverables: { hours: number; status: string }[]
): number {
  const total = deliverables.reduce((s, d) => s + d.hours, 0)
  if (total === 0) return 0
  const done = deliverables
    .filter((d) => d.status === 'aprobado')
    .reduce((s, d) => s + d.hours, 0)
  return Math.round((done / total) * 100)
}

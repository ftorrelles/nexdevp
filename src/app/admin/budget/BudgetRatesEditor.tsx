'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { BudgetSettings } from '@/lib/budget'

const FIELDS: { key: keyof BudgetSettings; label: string; hint: string }[] = [
  { key: 'commission_pool_rate',     label: 'Comisión · lead del pool', hint: 'El lead lo trajo la empresa' },
  { key: 'commission_own_lead_rate', label: 'Comisión · lead propio',   hint: 'El vendedor trajo el lead' },
  { key: 'company_margin_rate',      label: 'Margen de la empresa',     hint: 'Se descuenta antes del pozo' },
]

export function BudgetRatesEditor({
  initial,
  canEdit,
}: {
  initial: BudgetSettings
  canEdit: boolean
}) {
  const router = useRouter()
  const [rates,  setRates]  = useState<BudgetSettings>(initial)
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState<string | null>(null)
  const [saved,  setSaved]  = useState(false)

  const dirty = FIELDS.some(f => rates[f.key] !== initial[f.key])

  // Worst case for the pool: the highest commission plus the margin.
  const devRate = Math.max(1 - rates.commission_own_lead_rate - rates.company_margin_rate, 0)

  async function save() {
    setSaving(true)
    setError(null)
    setSaved(false)
    try {
      const res = await fetch('/api/budget', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rates),
      })
      const json = await res.json()
      if (res.ok) {
        setSaved(true)
        router.refresh()
      } else {
        setError(json.error ?? 'No se pudo guardar.')
      }
    } catch {
      setError('Error de conexión.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-nex-dark border border-nex-ink/10 rounded-xl p-6">
      <div className="flex items-start justify-between gap-4 mb-1">
        <p className="font-dm-mono text-[10px] tracking-[0.15em] uppercase text-nex-green">
          Reparto por defecto
        </p>
        {!canEdit && (
          <span className="font-dm-mono text-[10px] text-nex-grey border border-nex-ink/10 rounded-full px-3 py-1">
            Solo lectura
          </span>
        )}
      </div>
      <p className="font-jost text-xs text-nex-grey mb-5">
        Aplica a los proyectos que se creen de acá en adelante. Los que ya existen
        conservan el reparto con el que nacieron.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {FIELDS.map(f => (
          <div key={f.key}>
            <label className="block font-jost text-xs text-nex-grey mb-1.5">{f.label}</label>
            <div className="flex items-center gap-1 bg-nex-black border border-nex-ink/10 rounded-lg px-3 py-2 focus-within:border-nex-green/50 transition-colors">
              <input
                type="number"
                min={0}
                max={100}
                step={0.5}
                disabled={!canEdit}
                value={Math.round(rates[f.key] * 1000) / 10}
                onChange={e =>
                  setRates(prev => ({ ...prev, [f.key]: (Number(e.target.value) || 0) / 100 }))
                }
                className="w-full bg-transparent font-jost font-bold text-lg text-nex-white outline-none disabled:opacity-70"
              />
              <span className="font-dm-mono text-xs text-nex-grey">%</span>
            </div>
            <p className="font-jost text-[10px] text-nex-grey/70 mt-1">{f.hint}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 pt-4 border-t border-nex-ink/5 flex flex-wrap items-center justify-between gap-3">
        <p className="font-jost text-sm text-nex-grey">
          Queda para desarrollo:{' '}
          <span className="font-bold text-nex-green">{Math.round(devRate * 1000) / 10}%</span>
          <span className="text-nex-grey/60 text-xs"> (en el peor caso, con lead propio)</span>
        </p>

        <div className="flex items-center gap-3">
          {error && <span className="font-jost text-xs text-red-400">{error}</span>}
          {saved && !dirty && <span className="font-jost text-xs text-nex-green">Guardado</span>}
          {canEdit && (
            <button
              onClick={save}
              disabled={saving || !dirty}
              className="font-jost text-sm font-bold bg-nex-green text-nex-black py-2 px-5 rounded-lg disabled:opacity-40 hover:bg-nex-green/90 transition-colors"
            >
              {saving ? 'Guardando…' : 'Guardar'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

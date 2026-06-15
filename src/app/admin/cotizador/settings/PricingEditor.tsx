'use client'

import { useState } from 'react'

interface PricingSetting {
  region:      string
  currency:    string
  hourly_rate: number
  overhead_pm: number
  overhead_qa: number
  overhead_cx: number
  maint_rate:  number
}

const REGION_LABELS: Record<string, string> = {
  españa: 'España',
  eeuu:   'Estados Unidos',
  latam:  'Latinoamérica',
}

function pct(n: number) { return Math.round(n * 100) }
function dec(n: number) { return n / 100 }

export function PricingEditor({ initialSettings }: { initialSettings: PricingSetting[] }) {
  const [settings, setSettings] = useState<PricingSetting[]>(initialSettings)
  const [saving,   setSaving]   = useState<string | null>(null)
  const [saved,    setSaved]    = useState<string | null>(null)

  function update(region: string, field: keyof PricingSetting, raw: string) {
    setSettings(prev => prev.map(s =>
      s.region !== region ? s : {
        ...s,
        [field]: ['overhead_pm', 'overhead_qa', 'overhead_cx', 'maint_rate'].includes(field)
          ? dec(parseFloat(raw) || 0)
          : parseFloat(raw) || 0,
      }
    ))
  }

  async function handleSave(region: string) {
    setSaving(region)
    const s = settings.find(x => x.region === region)
    if (!s) return
    const res = await fetch('/api/cotizador/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(s),
    })
    setSaving(null)
    if (res.ok) {
      setSaved(region)
      setTimeout(() => setSaved(null), 2000)
    }
  }

  return (
    <div className="space-y-4">
      {settings.map(s => (
        <div key={s.region} className="bg-nex-dark border border-white/10 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-jost font-bold text-sm text-nex-white">
              {REGION_LABELS[s.region] ?? s.region}
            </h3>
            <span className="font-dm-mono text-xs text-nex-grey">{s.currency}</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-4">
            {[
              { label: 'Tarifa / hora', field: 'hourly_rate' as const, suffix: s.currency, pctField: false },
              { label: 'PM overhead',   field: 'overhead_pm' as const, suffix: '%',        pctField: true  },
              { label: 'QA overhead',   field: 'overhead_qa' as const, suffix: '%',        pctField: true  },
              { label: 'Contingencia',  field: 'overhead_cx' as const, suffix: '%',        pctField: true  },
              { label: 'Mantenimiento', field: 'maint_rate'  as const, suffix: '%',        pctField: true  },
            ].map(({ label, field, suffix, pctField }) => (
              <div key={field}>
                <label className="block font-jost text-xs text-nex-grey mb-1">{label}</label>
                <div className="flex items-center gap-1 bg-nex-black border border-white/10 rounded-lg px-2.5 py-1.5 focus-within:border-nex-green/50 transition-colors">
                  <input
                    type="number"
                    min={0}
                    step={pctField ? 1 : 5}
                    value={pctField ? pct(s[field] as number) : (s[field] as number)}
                    onChange={e => update(s.region, field, e.target.value)}
                    className="w-full bg-transparent font-dm-mono text-sm text-nex-white outline-none text-right"
                  />
                  <span className="font-dm-mono text-xs text-nex-grey shrink-0">{suffix}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => handleSave(s.region)}
              disabled={saving === s.region}
              className="font-jost text-sm font-bold bg-nex-green text-nex-black py-1.5 px-4 rounded-lg disabled:opacity-40 hover:bg-nex-green/90 transition-colors"
            >
              {saving === s.region ? 'Guardando…' : saved === s.region ? '✓ Guardado' : 'Guardar'}
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

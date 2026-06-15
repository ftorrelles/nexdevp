'use client'

import { useState, useEffect, useCallback } from 'react'
import type {
  PricingSettings, QuoteSizeMap, QuoteCatalogItem,
  QuoteItem, QuoteRegion, QuoteTipo, QuoteSize,
} from '@/lib/supabase'

// ── Step config ──────────────────────────────────────────────────────────────

const TIPOS: { value: QuoteTipo; label: string; icon: string }[] = [
  { value: 'desarrollo', label: 'Desarrollo',   icon: '⚙️' },
  { value: 'marketing',  label: 'Marketing',    icon: '📣' },
  { value: 'chatbot',    label: 'Chatbot / IA', icon: '🤖' },
]

const PRODUCTS: Record<QuoteTipo, { value: string; label: string; icon: string }[]> = {
  desarrollo: [
    { value: 'software',      label: 'Software a medida', icon: '🛠️' },
    { value: 'pwa',           label: 'PWA',               icon: '📱' },
    { value: 'mvp',           label: 'MVP',               icon: '🚀' },
    { value: 'crm',           label: 'CRM',               icon: '📊' },
    { value: 'ecommerce',     label: 'E-commerce',        icon: '🛒' },
    { value: 'transformacion',label: 'Transformación digital', icon: '🔄' },
  ],
  marketing: [
    { value: 'landing', label: 'Landing page',    icon: '🎯' },
    { value: 'web',     label: 'Web corporativa', icon: '🌐' },
  ],
  chatbot: [
    { value: 'agente-ia', label: 'Agente IA WhatsApp', icon: '💬' },
  ],
}

const REGIONS: { value: QuoteRegion; label: string; symbol: string }[] = [
  { value: 'españa', label: 'España',  symbol: '€' },
  { value: 'eeuu',   label: 'EEUU',   symbol: '$' },
  { value: 'latam',  label: 'LATAM',  symbol: '$' },
]

const ADDONS = [
  'Login + roles',
  'Multi-idioma (i18n)',
  'Dashboard / reportes',
  'Pasarela de pago',
  'Notificaciones email',
  'Integración WhatsApp API',
  'Tiempo real',
  'PWA / offline',
]

const SIZE_COLORS: Record<QuoteSize, string> = {
  S:  'text-emerald-400 bg-emerald-400/10 border-emerald-400/30',
  M:  'text-blue-400   bg-blue-400/10   border-blue-400/30',
  L:  'text-orange-400 bg-orange-400/10 border-orange-400/30',
  XL: 'text-purple-400 bg-purple-400/10 border-purple-400/30',
}

type Step = 1 | 2 | 3 | 4 | 5

interface TemplateResponse {
  settings: PricingSettings[]
  sizes:    QuoteSizeMap[]
  items:    QuoteCatalogItem[]
}

// ── Component ─────────────────────────────────────────────────────────────────

export function QuoteWizard() {
  const [step, setStep] = useState<Step>(1)

  // Wizard selections
  const [tipo,    setTipo]    = useState<QuoteTipo | null>(null)
  const [product, setProduct] = useState<string | null>(null)
  const [addons,  setAddons]  = useState<string[]>([])
  const [region,  setRegion]  = useState<QuoteRegion>('españa')

  // Template data
  const [settings, setSettings] = useState<PricingSettings[]>([])
  const [sizes,    setSizes]    = useState<QuoteSizeMap[]>([])
  const [items,    setItems]    = useState<QuoteItem[]>([])
  const [loading,  setLoading]  = useState(false)

  // Quote title
  const [title, setTitle] = useState('')

  // ── Load template when tipo+product are set ─────────────────────────────
  const loadTemplate = useCallback(async (t: QuoteTipo, p: string) => {
    setLoading(true)
    try {
      const res  = await fetch(`/api/cotizador/template?tipo=${t}&product=${p}`)
      const data = (await res.json()) as TemplateResponse
      setSettings(data.settings ?? [])
      setSizes(data.sizes ?? [])
      setItems(
        (data.items ?? []).map((ci, idx) => ({
          id:         undefined,
          catalog_id: ci.id,
          name:       ci.name,
          size:       ci.size,
          hours:      data.sizes.find(s => s.size === ci.size)?.hours ?? 0,
          sort_order: idx,
        }))
      )
    } finally {
      setLoading(false)
    }
  }, [])

  // ── Derived calculations ────────────────────────────────────────────────
  const ps = settings.find(s => s.region === region)
  const hourlyRate = ps?.hourly_rate ?? 0
  const [customRate, setCustomRate] = useState<number | null>(null)
  const effectiveRate = customRate ?? hourlyRate

  const baseHours = items.reduce((acc, i) => acc + (i.hours ?? 0), 0)
  const pmHours   = Math.round(baseHours * (ps?.overhead_pm ?? 0.12))
  const qaHours   = Math.round(baseHours * (ps?.overhead_qa ?? 0.15))
  const cxHours   = Math.round(baseHours * (ps?.overhead_cx ?? 0.10))
  const totalHours = baseHours + pmHours + qaHours + cxHours

  const totalPrice  = totalHours * effectiveRate
  const maintMonth  = (totalPrice * (ps?.maint_rate ?? 0.175)) / 12
  const currency    = ps?.currency ?? 'EUR'

  const fmt = (n: number) =>
    n.toLocaleString('es-ES', { style: 'currency', currency, maximumFractionDigits: 0 })

  // ── Item helpers ─────────────────────────────────────────────────────────
  function updateItemHours(idx: number, hours: number) {
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, hours } : it))
  }

  function removeItem(idx: number) {
    setItems(prev => prev.filter((_, i) => i !== idx))
  }

  function addBlankItem() {
    setItems(prev => [...prev, {
      catalog_id: null, name: 'Nueva funcionalidad', size: 'M',
      hours: sizes.find(s => s.size === 'M')?.hours ?? 20,
      sort_order: prev.length,
    }])
  }

  function updateItemName(idx: number, name: string) {
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, name } : it))
  }

  // ── Step navigation ──────────────────────────────────────────────────────
  function goNext() { setStep(s => Math.min(s + 1, 5) as Step) }
  function goBack() { setStep(s => Math.max(s - 1, 1) as Step) }

  // Reset product when tipo changes
  function selectTipo(t: QuoteTipo) {
    setTipo(t); setProduct(null); setItems([]); setCustomRate(null)
  }

  async function selectProduct(p: string) {
    setProduct(p); setCustomRate(null)
    if (tipo) await loadTemplate(tipo, p)
  }

  // sync customRate when region changes
  useEffect(() => { setCustomRate(null) }, [region])

  // ── Step indicators ──────────────────────────────────────────────────────
  const steps = ['Tipo', 'Producto', 'Add-ons', 'Región', 'Resultado']

  return (
    <div className="space-y-6">
      {/* Progress bar */}
      <div className="flex items-center gap-2">
        {steps.map((s, i) => {
          const n = (i + 1) as Step
          const active  = step === n
          const done    = step > n
          return (
            <div key={s} className="flex items-center gap-2 flex-1 last:flex-none">
              <div className="flex items-center gap-1.5">
                <div className={[
                  'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors',
                  active ? 'bg-nex-green text-nex-black' :
                  done   ? 'bg-nex-green/30 text-nex-green' :
                           'bg-white/10 text-nex-grey',
                ].join(' ')}>
                  {done ? '✓' : n}
                </div>
                <span className={[
                  'hidden sm:block text-xs font-jost',
                  active ? 'text-nex-white' : 'text-nex-grey',
                ].join(' ')}>{s}</span>
              </div>
              {i < steps.length - 1 && (
                <div className={[
                  'flex-1 h-px transition-colors',
                  done ? 'bg-nex-green/50' : 'bg-white/10',
                ].join(' ')} />
              )}
            </div>
          )
        })}
      </div>

      {/* Card */}
      <div className="bg-nex-dark border border-white/10 rounded-2xl p-6 sm:p-8">

        {/* ── STEP 1: Tipo ── */}
        {step === 1 && (
          <div className="space-y-6">
            <h2 className="font-jost font-bold text-xl text-nex-white">
              ¿Qué tipo de proyecto es?
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {TIPOS.map(t => (
                <button
                  key={t.value}
                  onClick={() => selectTipo(t.value)}
                  className={[
                    'p-5 rounded-xl border text-left transition-all',
                    tipo === t.value
                      ? 'border-nex-green bg-nex-green/10'
                      : 'border-white/10 hover:border-white/25',
                  ].join(' ')}
                >
                  <div className="text-2xl mb-2">{t.icon}</div>
                  <div className="font-jost font-bold text-nex-white text-sm">{t.label}</div>
                </button>
              ))}
            </div>
            <div className="flex justify-end">
              <button
                onClick={goNext}
                disabled={!tipo}
                className="bg-nex-green text-nex-black font-jost font-bold text-sm py-2.5 px-6 rounded-lg disabled:opacity-40 hover:bg-nex-green/90 transition-colors"
              >
                Siguiente →
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 2: Producto ── */}
        {step === 2 && tipo && (
          <div className="space-y-6">
            <h2 className="font-jost font-bold text-xl text-nex-white">
              ¿Qué producto vas a construir?
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {PRODUCTS[tipo].map(p => (
                <button
                  key={p.value}
                  onClick={() => selectProduct(p.value)}
                  className={[
                    'p-4 rounded-xl border text-left transition-all',
                    product === p.value
                      ? 'border-nex-green bg-nex-green/10'
                      : 'border-white/10 hover:border-white/25',
                  ].join(' ')}
                >
                  <div className="text-xl mb-1.5">{p.icon}</div>
                  <div className="font-jost font-bold text-nex-white text-sm">{p.label}</div>
                </button>
              ))}
            </div>
            <div className="flex justify-between">
              <button onClick={goBack} className="font-jost text-sm text-nex-grey hover:text-nex-white transition-colors">
                ← Atrás
              </button>
              <button
                onClick={goNext}
                disabled={!product}
                className="bg-nex-green text-nex-black font-jost font-bold text-sm py-2.5 px-6 rounded-lg disabled:opacity-40 hover:bg-nex-green/90 transition-colors"
              >
                Siguiente →
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: Add-ons ── */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="font-jost font-bold text-xl text-nex-white">
                ¿Qué funcionalidades extra incluye?
              </h2>
              <p className="font-jost text-sm text-nex-grey mt-1">Opcional — ya vienen las más comunes según el producto.</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {ADDONS.map(a => {
                const on = addons.includes(a)
                return (
                  <button
                    key={a}
                    onClick={() => setAddons(prev => on ? prev.filter(x => x !== a) : [...prev, a])}
                    className={[
                      'px-3 py-2 rounded-lg border text-xs font-jost text-left transition-all',
                      on ? 'border-nex-green bg-nex-green/10 text-nex-green'
                         : 'border-white/10 text-nex-grey hover:border-white/25',
                    ].join(' ')}
                  >
                    {a}
                  </button>
                )
              })}
            </div>
            <div className="flex justify-between">
              <button onClick={goBack} className="font-jost text-sm text-nex-grey hover:text-nex-white transition-colors">
                ← Atrás
              </button>
              <button
                onClick={goNext}
                className="bg-nex-green text-nex-black font-jost font-bold text-sm py-2.5 px-6 rounded-lg hover:bg-nex-green/90 transition-colors"
              >
                Siguiente →
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 4: Región ── */}
        {step === 4 && (
          <div className="space-y-6">
            <h2 className="font-jost font-bold text-xl text-nex-white">
              ¿Dónde está el cliente?
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {REGIONS.map(r => {
                const ps = settings.find(s => s.region === r.value)
                return (
                  <button
                    key={r.value}
                    onClick={() => setRegion(r.value)}
                    className={[
                      'p-5 rounded-xl border text-left transition-all',
                      region === r.value
                        ? 'border-nex-green bg-nex-green/10'
                        : 'border-white/10 hover:border-white/25',
                    ].join(' ')}
                  >
                    <div className="font-jost font-bold text-nex-white text-base">{r.label}</div>
                    {ps && (
                      <div className="font-dm-mono text-xs text-nex-grey mt-1">
                        {r.symbol}{ps.hourly_rate}/h · {ps.currency}
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
            <div className="flex justify-between">
              <button onClick={goBack} className="font-jost text-sm text-nex-grey hover:text-nex-white transition-colors">
                ← Atrás
              </button>
              <button
                onClick={goNext}
                className="bg-nex-green text-nex-black font-jost font-bold text-sm py-2.5 px-6 rounded-lg hover:bg-nex-green/90 transition-colors"
              >
                Ver estimado →
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 5: Resultado ── */}
        {step === 5 && (
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="font-jost font-bold text-xl text-nex-white">Estimado del proyecto</h2>
              <div className="flex items-center gap-3">
                <span className="font-jost text-sm text-nex-grey">Tarifa/hora:</span>
                <div className="flex items-center gap-1 bg-nex-black border border-white/10 rounded-lg px-3 py-1.5">
                  <span className="font-dm-mono text-xs text-nex-grey">{currency}</span>
                  <input
                    type="number"
                    min={1}
                    value={customRate ?? hourlyRate}
                    onChange={e => setCustomRate(Number(e.target.value))}
                    className="w-16 bg-transparent font-dm-mono text-sm text-nex-white outline-none text-right"
                  />
                  <span className="font-dm-mono text-xs text-nex-grey">/h</span>
                </div>
                {customRate && (
                  <button onClick={() => setCustomRate(null)} className="text-xs text-nex-grey hover:text-nex-white transition-colors">
                    reset
                  </button>
                )}
              </div>
            </div>

            {/* Title field */}
            <div>
              <label className="block font-jost text-xs text-nex-grey mb-1.5">Nombre del presupuesto</label>
              <input
                type="text"
                placeholder={`${PRODUCTS[tipo!]?.find(p => p.value === product)?.label ?? 'Proyecto'} — cliente`}
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full bg-nex-black border border-white/10 rounded-lg px-3.5 py-2 text-sm text-nex-white focus:outline-none focus:border-nex-green/50 transition-colors"
              />
            </div>

            {loading ? (
              <p className="text-nex-grey text-sm animate-pulse">Cargando plantilla…</p>
            ) : (
              <>
                {/* Line items */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-dm-mono text-xs text-nex-green uppercase tracking-[0.15em]">
                      Fases / funcionalidades
                    </h3>
                    <button
                      onClick={addBlankItem}
                      className="font-jost text-xs text-nex-grey hover:text-nex-green transition-colors"
                    >
                      + Agregar línea
                    </button>
                  </div>
                  <div className="space-y-2">
                    {items.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-3 bg-nex-black border border-white/5 rounded-lg px-4 py-3"
                      >
                        {item.size && (
                          <span className={[
                            'font-dm-mono text-[10px] font-bold uppercase rounded border px-2 py-0.5 shrink-0',
                            SIZE_COLORS[item.size as QuoteSize],
                          ].join(' ')}>
                            {item.size}
                          </span>
                        )}
                        <input
                          type="text"
                          value={item.name}
                          onChange={e => updateItemName(idx, e.target.value)}
                          className="flex-1 bg-transparent font-jost text-sm text-nex-white outline-none"
                        />
                        <div className="flex items-center gap-1 shrink-0">
                          <input
                            type="number"
                            min={1}
                            value={item.hours}
                            onChange={e => updateItemHours(idx, Number(e.target.value))}
                            className="w-14 bg-nex-dark border border-white/10 rounded px-2 py-1 font-dm-mono text-xs text-nex-white text-right outline-none"
                          />
                          <span className="font-dm-mono text-xs text-nex-grey">h</span>
                        </div>
                        <button
                          onClick={() => removeItem(idx)}
                          className="text-nex-grey hover:text-red-400 transition-colors text-lg leading-none shrink-0"
                          aria-label="Eliminar"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Overhead breakdown */}
                <div className="bg-nex-black/40 border border-white/5 rounded-xl p-4 space-y-2">
                  <h3 className="font-dm-mono text-xs text-nex-green uppercase tracking-[0.15em] mb-3">
                    Desglose de horas
                  </h3>
                  {[
                    { label: 'Subtotal funcionalidades', hours: baseHours, highlight: false },
                    { label: `Gestión de proyecto (${Math.round((ps?.overhead_pm ?? 0.12) * 100)}%)`, hours: pmHours, highlight: false },
                    { label: `Testing / QA (${Math.round((ps?.overhead_qa ?? 0.15) * 100)}%)`,         hours: qaHours, highlight: false },
                    { label: `Contingencia (${Math.round((ps?.overhead_cx ?? 0.10) * 100)}%)`,         hours: cxHours, highlight: false },
                  ].map(row => (
                    <div key={row.label} className="flex justify-between font-jost text-sm">
                      <span className="text-nex-grey">{row.label}</span>
                      <span className="text-nex-white font-dm-mono">{row.hours}h</span>
                    </div>
                  ))}
                  <div className="border-t border-white/10 pt-2 flex justify-between font-jost text-sm font-bold">
                    <span className="text-nex-white">Total horas</span>
                    <span className="text-nex-green font-dm-mono">{totalHours}h</span>
                  </div>
                </div>

                {/* Price summary */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { label: 'Precio del proyecto', value: fmt(totalPrice), big: true },
                    { label: 'Mantenimiento / mes', value: fmt(maintMonth), big: false },
                    { label: 'Total horas',          value: `${totalHours}h`, big: false },
                  ].map(card => (
                    <div
                      key={card.label}
                      className={[
                        'rounded-xl border p-4',
                        card.big ? 'border-nex-green/40 bg-nex-green/5' : 'border-white/10 bg-nex-black/40',
                      ].join(' ')}
                    >
                      <p className="font-dm-mono text-xs text-nex-grey uppercase tracking-[0.1em] mb-1">
                        {card.label}
                      </p>
                      <p className={[
                        'font-jost font-bold',
                        card.big ? 'text-2xl text-nex-green' : 'text-xl text-nex-white',
                      ].join(' ')}>
                        {card.value}
                      </p>
                    </div>
                  ))}
                </div>

                {addons.length > 0 && (
                  <div>
                    <p className="font-dm-mono text-xs text-nex-grey uppercase tracking-[0.1em] mb-2">
                      Add-ons incluidos
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {addons.map(a => (
                        <span key={a} className="font-jost text-xs px-3 py-1 rounded-full border border-nex-green/30 bg-nex-green/5 text-nex-green">
                          {a}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            <div className="flex justify-between pt-2">
              <button onClick={goBack} className="font-jost text-sm text-nex-grey hover:text-nex-white transition-colors">
                ← Atrás
              </button>
              <button
                disabled
                title="Guardar presupuestos — próximamente (Fase 2)"
                className="bg-nex-green/40 text-nex-black font-jost font-bold text-sm py-2.5 px-6 rounded-lg opacity-50 cursor-not-allowed"
              >
                Guardar presupuesto
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

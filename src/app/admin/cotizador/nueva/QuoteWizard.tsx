'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type {
  PricingSettings, QuoteSizeMap, QuoteCatalogItem,
  QuoteItem, QuoteRegion, QuoteTipo, QuoteSize,
} from '@/lib/supabase'

// ── Static data ───────────────────────────────────────────────────────────────

const TIPOS: { value: QuoteTipo; label: string }[] = [
  { value: 'desarrollo', label: 'Desarrollo' },
  { value: 'marketing',  label: 'Marketing'  },
  { value: 'chatbot',    label: 'Chatbot / IA' },
]

const ALL_PRODUCTS: { value: string; label: string; icon: string; tipo: QuoteTipo }[] = [
  { value: 'software',       label: 'Software a medida',     icon: '🛠️', tipo: 'desarrollo' },
  { value: 'pwa',            label: 'PWA',                   icon: '📱', tipo: 'desarrollo' },
  { value: 'mvp',            label: 'MVP',                   icon: '🚀', tipo: 'desarrollo' },
  { value: 'crm',            label: 'CRM',                   icon: '📊', tipo: 'desarrollo' },
  { value: 'ecommerce',      label: 'E-commerce',            icon: '🛒', tipo: 'desarrollo' },
  { value: 'transformacion', label: 'Transformación digital', icon: '🔄', tipo: 'desarrollo' },
  { value: 'landing',        label: 'Landing page',          icon: '🎯', tipo: 'marketing'  },
  { value: 'web',            label: 'Web corporativa',       icon: '🌐', tipo: 'marketing'  },
  { value: 'agente-ia',      label: 'Agente IA WhatsApp',   icon: '💬', tipo: 'chatbot'    },
]

// Add-ons relevantes por producto
const ADDONS_BY_PRODUCT: Record<string, string[]> = {
  software:       ['Login + roles', 'Dashboard / reportes', 'Notificaciones email', 'Multi-idioma (i18n)', 'Tiempo real', 'Pasarela de pago', 'PWA / offline'],
  pwa:            ['Login + roles', 'Notificaciones push', 'PWA / offline', 'Tiempo real', 'Multi-idioma (i18n)'],
  mvp:            ['Login + roles', 'Dashboard / reportes', 'Pasarela de pago', 'Notificaciones email'],
  crm:            ['Login + roles', 'Dashboard / reportes', 'Notificaciones email', 'Integración WhatsApp API', 'Tiempo real', 'Multi-idioma (i18n)'],
  ecommerce:      ['Pasarela de pago', 'Dashboard / reportes', 'Login + roles', 'Notificaciones email', 'Multi-idioma (i18n)', 'PWA / offline'],
  transformacion: ['Dashboard / reportes', 'Integración WhatsApp API', 'Notificaciones email', 'Multi-idioma (i18n)'],
  landing:        ['Formulario de contacto', 'Multi-idioma (i18n)', 'Integración WhatsApp API', 'Analytics'],
  web:            ['Blog / CMS', 'Formulario de contacto', 'Multi-idioma (i18n)', 'Analytics', 'Integración WhatsApp API'],
  'agente-ia':    ['Integración WhatsApp API', 'Escalado a humano', 'Entrenamiento con docs propios', 'Multicanal (WA + web)', 'Base de conocimiento'],
}

const BUNDLE_DISCOUNT = 0.10 // 10% cuando se seleccionan 2+ productos

const REGIONS: { value: QuoteRegion; label: string; symbol: string }[] = [
  { value: 'españa', label: 'España', symbol: '€' },
  { value: 'eeuu',   label: 'EEUU',   symbol: '$' },
  { value: 'latam',  label: 'LATAM',  symbol: '$' },
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

interface WizardProps { initialLeadId?: string | null }

export function QuoteWizard({ initialLeadId }: WizardProps = {}) {
  const router = useRouter()
  const [step,   setStep]   = useState<Step>(1)
  const [saving, setSaving] = useState(false)

  // Selections
  const [tipo,     setTipo]     = useState<QuoteTipo | null>(null)
  const [products, setProducts] = useState<string[]>([])
  const [addons,   setAddons]   = useState<string[]>([])
  const [region,   setRegion]   = useState<QuoteRegion>('españa')

  // Template data
  const [settings,    setSettings]    = useState<PricingSettings[]>([])
  const [sizes,       setSizes]       = useState<QuoteSizeMap[]>([])
  const [items,       setItems]       = useState<QuoteItem[]>([])
  const [loading,     setLoading]     = useState(false)
  const [customRate,  setCustomRate]  = useState<number | null>(null)
  const [title,       setTitle]       = useState('')

  // ── Derived ─────────────────────────────────────────────────────────────────
  const isBundle       = products.length >= 2
  const ps             = settings.find(s => s.region === region)
  const hourlyRate     = ps?.hourly_rate ?? 0
  const effectiveRate  = customRate ?? hourlyRate

  const baseHours  = items.reduce((acc, i) => acc + (i.hours ?? 0), 0)
  const pmHours    = Math.round(baseHours * (ps?.overhead_pm ?? 0.12))
  const qaHours    = Math.round(baseHours * (ps?.overhead_qa ?? 0.15))
  const cxHours    = Math.round(baseHours * (ps?.overhead_cx ?? 0.10))
  const totalHours = baseHours + pmHours + qaHours + cxHours
  const basePrice  = totalHours * effectiveRate
  const discount   = isBundle ? basePrice * BUNDLE_DISCOUNT : 0
  const totalPrice = basePrice - discount
  const maintMonth = (totalPrice * (ps?.maint_rate ?? 0.175)) / 12
  const currency   = ps?.currency ?? 'EUR'

  const fmt = (n: number) =>
    n.toLocaleString('es-ES', { style: 'currency', currency, maximumFractionDigits: 0 })

  // Available add-ons = union of all selected products' add-on lists
  const availableAddons = Array.from(
    new Set(products.flatMap(p => ADDONS_BY_PRODUCT[p] ?? []))
  )

  // ── Load template for a single product ──────────────────────────────────────
  const fetchTemplate = useCallback(async (tipo: string, product: string): Promise<TemplateResponse> => {
    const res = await fetch(`/api/cotizador/template?tipo=${tipo}&product=${product}`)
    return res.json()
  }, [])

  // When products array changes, reload merged template
  useEffect(() => {
    if (products.length === 0) { setItems([]); return }

    let cancelled = false
    setLoading(true)

    async function load() {
      try {
        const results = await Promise.all(
          products.map(p => {
            const t = ALL_PRODUCTS.find(ap => ap.value === p)?.tipo ?? tipo ?? 'desarrollo'
            return fetchTemplate(t, p)
          })
        )

        if (cancelled) return

        // Use settings/sizes from the first result (same for all regions)
        const first = results[0]
        setSettings(first.settings ?? [])
        setSizes(first.sizes ?? [])

        // Merge items from all templates, prefixed with product label
        const merged: QuoteItem[] = []
        let order = 0
        for (const [i, result] of results.entries()) {
          const productLabel = ALL_PRODUCTS.find(ap => ap.value === products[i])?.label ?? products[i]
          const isMulti = results.length > 1
          for (const ci of (result.items ?? [])) {
            merged.push({
              catalog_id: ci.id,
              name:       isMulti ? `[${productLabel}] ${ci.name}` : ci.name,
              size:       ci.size,
              hours:      first.sizes.find(s => s.size === ci.size)?.hours ?? 0,
              sort_order: order++,
            })
          }
        }
        setItems(merged)
        setCustomRate(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [products, tipo, fetchTemplate])

  useEffect(() => { setCustomRate(null) }, [region])

  // Remove add-ons that are no longer relevant when products change
  useEffect(() => {
    setAddons(prev => prev.filter(a => availableAddons.includes(a)))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products])

  // ── Item helpers ─────────────────────────────────────────────────────────────
  function updateItemHours(idx: number, hours: number) {
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, hours } : it))
  }
  function updateItemName(idx: number, name: string) {
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, name } : it))
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

  // ── Navigation ───────────────────────────────────────────────────────────────
  function goNext() { setStep(s => Math.min(s + 1, 5) as Step) }
  function goBack() { setStep(s => Math.max(s - 1, 1) as Step) }

  function selectTipo(t: QuoteTipo) {
    setTipo(t)
    setProducts([])
    setItems([])
    setCustomRate(null)
  }

  function toggleProduct(p: string) {
    setProducts(prev =>
      prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]
    )
  }

  // ── Save ─────────────────────────────────────────────────────────────────────
  async function handleSave() {
    setSaving(true)
    try {
      const productLabel = products
        .map(p => ALL_PRODUCTS.find(ap => ap.value === p)?.label ?? p)
        .join(' + ')

      const res = await fetch('/api/cotizador/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title:       title || `${productLabel} — cliente`,
          region,
          hourly_rate: effectiveRate,
          tipo:        tipo ?? ALL_PRODUCTS.find(ap => ap.value === products[0])?.tipo ?? 'desarrollo',
          product:     products.join('+'),
          addons,
          status:      'draft',
          lead_id:     initialLeadId ?? null,
          total_hours: totalHours,
          total_price: totalPrice,
          maint_month: maintMonth,
          items,
        }),
      })
      const json = await res.json()
      if (res.ok) {
        router.push('/admin/cotizador')
      } else {
        alert(json.error ?? 'Error al guardar.')
      }
    } finally {
      setSaving(false)
    }
  }

  // ── Step labels ───────────────────────────────────────────────────────────────
  const stepLabels = ['Tipo', 'Productos', 'Add-ons', 'Región', 'Resultado']

  // Products to show in step 2: current tipo first, others below
  const mainProducts  = ALL_PRODUCTS.filter(p => p.tipo === tipo)
  const otherProducts = ALL_PRODUCTS.filter(p => p.tipo !== tipo)

  return (
    <div className="space-y-6">
      {/* Progress bar */}
      <div className="flex items-center gap-2">
        {stepLabels.map((s, i) => {
          const n = (i + 1) as Step
          const active = step === n
          const done   = step > n
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
              {i < stepLabels.length - 1 && (
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
                  <div className="font-jost font-bold text-nex-white text-sm">{t.label}</div>
                  <div className="font-jost text-xs text-nex-grey mt-1">
                    {ALL_PRODUCTS.filter(p => p.tipo === t.value).map(p => p.label).join(', ')}
                  </div>
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

        {/* ── STEP 2: Productos (multi-select) ── */}
        {step === 2 && tipo && (
          <div className="space-y-6">
            <div>
              <h2 className="font-jost font-bold text-xl text-nex-white">
                ¿Qué productos incluye?
              </h2>
              <p className="font-jost text-sm text-nex-grey mt-1">
                Podés elegir más de uno — si combinás dos o más se aplica un {Math.round(BUNDLE_DISCOUNT * 100)}% de descuento.
              </p>
            </div>

            {/* Bundle badge */}
            {isBundle && (
              <div className="flex items-center gap-2 bg-nex-green/10 border border-nex-green/30 rounded-lg px-4 py-2.5">
                <span className="font-dm-mono text-xs text-nex-green uppercase tracking-wider">Bundle activado</span>
                <span className="font-dm-mono text-xs text-nex-green font-bold">−{Math.round(BUNDLE_DISCOUNT * 100)}% sobre el total</span>
              </div>
            )}

            {/* Main tipo products */}
            <div>
              <p className="font-dm-mono text-[10px] text-nex-grey uppercase tracking-[0.15em] mb-3">
                {TIPOS.find(t2 => t2.value === tipo)?.label}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {mainProducts.map(p => {
                  const on = products.includes(p.value)
                  return (
                    <button
                      key={p.value}
                      onClick={() => toggleProduct(p.value)}
                      className={[
                        'p-4 rounded-xl border text-left transition-all relative',
                        on ? 'border-nex-green bg-nex-green/10' : 'border-white/10 hover:border-white/25',
                      ].join(' ')}
                    >
                      {on && (
                        <span className="absolute top-2 right-2 w-4 h-4 bg-nex-green rounded-full flex items-center justify-center text-[9px] text-nex-black font-bold">✓</span>
                      )}
                      <div className="text-xl mb-1.5">{p.icon}</div>
                      <div className="font-jost font-bold text-nex-white text-sm">{p.label}</div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Cross-tipo products */}
            <div>
              <p className="font-dm-mono text-[10px] text-nex-grey uppercase tracking-[0.15em] mb-3">
                Complementos de otros servicios
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {otherProducts.map(p => {
                  const on = products.includes(p.value)
                  return (
                    <button
                      key={p.value}
                      onClick={() => toggleProduct(p.value)}
                      className={[
                        'p-4 rounded-xl border text-left transition-all relative',
                        on ? 'border-nex-green bg-nex-green/10' : 'border-white/10 hover:border-white/25',
                      ].join(' ')}
                    >
                      {on && (
                        <span className="absolute top-2 right-2 w-4 h-4 bg-nex-green rounded-full flex items-center justify-center text-[9px] text-nex-black font-bold">✓</span>
                      )}
                      <div className="text-xl mb-1.5">{p.icon}</div>
                      <div className="font-jost font-bold text-nex-white text-sm">{p.label}</div>
                      <div className="font-jost text-[10px] text-nex-grey mt-0.5">
                        {TIPOS.find(t2 => t2.value === p.tipo)?.label}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="flex justify-between">
              <button onClick={goBack} className="font-jost text-sm text-nex-grey hover:text-nex-white transition-colors">
                ← Atrás
              </button>
              <button
                onClick={goNext}
                disabled={products.length === 0}
                className="bg-nex-green text-nex-black font-jost font-bold text-sm py-2.5 px-6 rounded-lg disabled:opacity-40 hover:bg-nex-green/90 transition-colors"
              >
                Siguiente →
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: Add-ons (contextual) ── */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="font-jost font-bold text-xl text-nex-white">
                ¿Qué funcionalidades extra incluye?
              </h2>
              <p className="font-jost text-sm text-nex-grey mt-1">
                Opcional — filtrados según los productos elegidos.
              </p>
            </div>

            {availableAddons.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {availableAddons.map(a => {
                  const on = addons.includes(a)
                  return (
                    <button
                      key={a}
                      onClick={() => setAddons(prev => on ? prev.filter(x => x !== a) : [...prev, a])}
                      className={[
                        'px-3 py-2.5 rounded-lg border text-xs font-jost text-left transition-all',
                        on ? 'border-nex-green bg-nex-green/10 text-nex-green'
                           : 'border-white/10 text-nex-grey hover:border-white/25',
                      ].join(' ')}
                    >
                      {a}
                    </button>
                  )
                })}
              </div>
            ) : (
              <p className="font-jost text-sm text-nex-grey italic">
                No hay add-ons definidos para los productos seleccionados.
              </p>
            )}

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
                const rps = settings.find(s => s.region === r.value)
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
                    {rps && (
                      <div className="font-dm-mono text-xs text-nex-grey mt-1">
                        {r.symbol}{rps.hourly_rate}/h · {rps.currency}
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
              <div>
                <h2 className="font-jost font-bold text-xl text-nex-white">Estimado del proyecto</h2>
                {isBundle && (
                  <p className="font-jost text-xs text-nex-green mt-0.5">
                    Bundle {products.length} productos — descuento {Math.round(BUNDLE_DISCOUNT * 100)}% aplicado
                  </p>
                )}
              </div>
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

            {/* Title */}
            <div>
              <label className="block font-jost text-xs text-nex-grey mb-1.5">Nombre del presupuesto</label>
              <input
                type="text"
                placeholder={`${products.map(p => ALL_PRODUCTS.find(ap => ap.value === p)?.label ?? p).join(' + ')} — cliente`}
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

                {/* Overhead */}
                <div className="bg-nex-black/40 border border-white/5 rounded-xl p-4 space-y-2">
                  <h3 className="font-dm-mono text-xs text-nex-green uppercase tracking-[0.15em] mb-3">
                    Desglose de horas
                  </h3>
                  {[
                    { label: 'Subtotal funcionalidades', hours: baseHours },
                    { label: `Gestión de proyecto (${Math.round((ps?.overhead_pm ?? 0.12) * 100)}%)`, hours: pmHours },
                    { label: `Testing / QA (${Math.round((ps?.overhead_qa ?? 0.15) * 100)}%)`,         hours: qaHours },
                    { label: `Contingencia (${Math.round((ps?.overhead_cx ?? 0.10) * 100)}%)`,         hours: cxHours },
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
                <div className="space-y-3">
                  {/* Bundle discount row */}
                  {isBundle && (
                    <div className="flex items-center justify-between bg-nex-green/5 border border-nex-green/20 rounded-xl px-5 py-3">
                      <div>
                        <p className="font-jost text-sm font-bold text-nex-green">Descuento Bundle ({Math.round(BUNDLE_DISCOUNT * 100)}%)</p>
                        <p className="font-jost text-xs text-nex-grey mt-0.5">
                          Precio base: <span className="line-through">{fmt(basePrice)}</span>
                        </p>
                      </div>
                      <p className="font-dm-mono text-base font-bold text-nex-green">−{fmt(discount)}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                      { label: 'Precio del proyecto', value: fmt(totalPrice), big: true  },
                      { label: 'Mantenimiento / mes', value: fmt(maintMonth),  big: false },
                      { label: 'Total horas',          value: `${totalHours}h`, big: false },
                    ].map(card => (
                      <div
                        key={card.label}
                        className={[
                          'rounded-xl border p-4',
                          card.big ? 'border-nex-green/40 bg-nex-green/5' : 'border-white/10 bg-nex-black/40',
                        ].join(' ')}
                      >
                        <p className="font-dm-mono text-xs text-nex-grey uppercase tracking-[0.1em] mb-1">{card.label}</p>
                        <p className={['font-jost font-bold', card.big ? 'text-2xl text-nex-green' : 'text-xl text-nex-white'].join(' ')}>
                          {card.value}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {addons.length > 0 && (
                  <div>
                    <p className="font-dm-mono text-xs text-nex-grey uppercase tracking-[0.1em] mb-2">Add-ons incluidos</p>
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
                onClick={handleSave}
                disabled={saving || items.length === 0}
                className="bg-nex-green text-nex-black font-jost font-bold text-sm py-2.5 px-6 rounded-lg disabled:opacity-40 hover:bg-nex-green/90 transition-colors"
              >
                {saving ? 'Guardando…' : 'Guardar presupuesto'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import type {
  PricingSettings, QuoteSizeMap, QuoteCatalogItem,
  QuoteItem, QuoteRegion, QuoteTipo, QuoteSize,
} from '@/lib/supabase'

// ── Static data ───────────────────────────────────────────────────────────────

const TIPOS: { value: QuoteTipo; label: string }[] = [
  { value: 'desarrollo', label: 'Software a medida' },
  { value: 'chatbot',    label: 'Automatización & IA' },
  { value: 'marketing',  label: 'Web & Marketing' },
]

const ALL_PRODUCTS: { value: string; label: string; icon: string; tipo: QuoteTipo; desc: string }[] = [
  { value: 'app-web',   label: 'Aplicación web a medida', icon: '🛠️', tipo: 'desarrollo', desc: 'Base técnica + los módulos que definas' },
  { value: 'ecommerce', label: 'E-commerce',              icon: '🛒', tipo: 'desarrollo', desc: 'Tienda online — carrito, checkout y pagos' },
  { value: 'app-movil', label: 'App móvil (tiendas)',     icon: '📱', tipo: 'desarrollo', desc: 'App nativa publicada en App Store + Play Store' },
  { value: 'agente-ia', label: 'Agente IA / Chatbot',     icon: '🤖', tipo: 'chatbot',    desc: 'Responde, califica y agenda 24/7 — 1 canal incluido' },
  { value: 'crm',       label: 'CRM + ventas',            icon: '📊', tipo: 'chatbot',    desc: 'Pipeline, asignación de leads y seguimiento' },
  { value: 'landing',   label: 'Landing page',            icon: '🎯', tipo: 'marketing',  desc: 'Página de conversión con captura de leads' },
  { value: 'web',       label: 'Web corporativa',         icon: '🌐', tipo: 'marketing',  desc: 'Sitio corporativo multi-página' },
  { value: 'redes',     label: 'Gestión de redes & Ads',  icon: '📣', tipo: 'marketing',  desc: 'Setup de marca y contenido — fee y pauta mensual aparte' },
]

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

const CATEGORY_LABEL: Record<string, string> = {
  base:   'Base',
  modulo: 'Módulo',
  cierre: 'Cierre',
  addon:  'Add-on',
}

// Natural build order: groundwork first, closing last. Applied when a line is
// added; moving a line by hand overrides it and is never re-sorted, because the
// build order is the vendor's call.
const CATEGORY_RANK: Record<string, number> = { base: 0, modulo: 1, addon: 2, cierre: 3 }
const rankOf = (categoria?: string | null) => CATEGORY_RANK[categoria ?? 'modulo'] ?? 1

/** Lowercased and stripped of accents, so "modulo" matches "Módulo". */
const norm = (s: string) =>
  s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()

/** Key used for the shared group holding work that two products would duplicate. */
const SHARED = '__shared__'

type Step = 1 | 2 | 3 | 4

interface TemplateResponse {
  settings: PricingSettings[]
  sizes:    QuoteSizeMap[]
  items:    QuoteCatalogItem[]
  addons:   QuoteCatalogItem[]
}

const productLabel = (p: string) => ALL_PRODUCTS.find(ap => ap.value === p)?.label ?? p

// ── Component ─────────────────────────────────────────────────────────────────

interface WizardProps { initialLeadId?: string | null }

export function QuoteWizard({ initialLeadId }: WizardProps = {}) {
  const router = useRouter()
  const [step,   setStep]   = useState<Step>(1)
  const [saving, setSaving] = useState(false)

  // Selections
  const [tipo,     setTipo]     = useState<QuoteTipo | null>(null)
  const [products, setProducts] = useState<string[]>([])
  const [region,   setRegion]   = useState<QuoteRegion>('españa')
  // Scope for "Aplicación web a medida": MVP loads a trimmed template
  const [appScope, setAppScope] = useState<'full' | 'mvp'>('full')

  // Template data
  const [settings,   setSettings]   = useState<PricingSettings[]>([])
  const [sizes,      setSizes]      = useState<QuoteSizeMap[]>([])
  const [items,      setItems]      = useState<QuoteItem[]>([])
  const [addonsByProduct, setAddonsByProduct] = useState<Record<string, QuoteCatalogItem[]>>({})
  const [loading,    setLoading]    = useState(false)
  const [customRate, setCustomRate] = useState<number | null>(null)
  const [title,      setTitle]      = useState('')
  const [finalPrice, setFinalPrice] = useState<number | null>(null)
  const [customMaint, setCustomMaint] = useState<number | null>(null)

  // Which group currently has its "add" panel open, and its search box
  const [addPanel, setAddPanel] = useState<string | null>(null)
  const [addQuery, setAddQuery] = useState('')

  function openAddPanel(key: string | null) {
    setAddPanel(key)
    setAddQuery('')
  }
  // Line indexes whose breakdown is expanded
  const [expanded, setExpanded] = useState<Set<number>>(new Set())

  function toggleExpanded(idx: number) {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(idx)) next.delete(idx); else next.add(idx)
      return next
    })
  }

  // ── Derived ─────────────────────────────────────────────────────────────────
  const isBundle      = products.length >= 2
  const ps            = settings.find(s => s.region === region)
  const hourlyRate    = ps?.hourly_rate ?? 0
  const effectiveRate = customRate ?? hourlyRate

  const billedItems   = items.filter(i => !i.gift)
  const giftItems     = items.filter(i => i.gift)

  const baseHours     = billedItems.reduce((acc, i) => acc + (i.hours ?? 0), 0)
  const giftHours     = giftItems.reduce((acc, i) => acc + (i.hours ?? 0), 0)
  const pmHours       = Math.round(baseHours * (ps?.overhead_pm ?? 0.12))
  const qaHours       = Math.round(baseHours * (ps?.overhead_qa ?? 0.15))
  const cxHours       = Math.round(baseHours * (ps?.overhead_cx ?? 0.10))
  const billedHours   = baseHours + pmHours + qaHours + cxHours
  const totalHours    = billedHours + giftHours
  const basePrice     = billedHours * effectiveRate
  const discount      = isBundle ? basePrice * BUNDLE_DISCOUNT : 0
  const calculatedPrice = basePrice - discount
  const specialDiscount = finalPrice !== null ? Math.max(0, calculatedPrice - finalPrice) : 0
  const totalPrice    = finalPrice !== null ? finalPrice : calculatedPrice
  // The percentage is a starting point; what gets agreed with the client wins.
  const suggestedMaint = (totalPrice * (ps?.maint_rate ?? 0.175)) / 12

  // What each line is really worth: overhead spread over it and every discount
  // applied. Gifts are worth nothing and are left out of the split.
  const effectivePriceOf = (item: QuoteItem) =>
    item.gift || baseHours === 0 ? 0 : ((item.hours ?? 0) / baseHours) * totalPrice
  const currency      = ps?.currency ?? 'EUR'

  const fmt = (n: number) =>
    n.toLocaleString('es-ES', { style: 'currency', currency, maximumFractionDigits: 0 })

  /**
   * Line items grouped for display: shared work first (only exists when two or
   * more products would otherwise duplicate it), then one group per product.
   */
  const groups = useMemo(() => {
    const order = [SHARED, ...products]
    return order
      .map(key => ({
        key,
        label: key === SHARED ? 'Base compartida' : productLabel(key),
        entries: items
          .map((item, idx) => ({ item, idx }))
          .filter(({ item }) => (item.product ?? SHARED) === key),
      }))
      .filter(g => g.entries.length > 0 || (g.key !== SHARED && products.includes(g.key)))
  }, [items, products])

  // Estimated recurring costs the CLIENT pays directly to providers (informational only)
  const recurringCosts: { label: string; value: string }[] = []
  if (products.some(p => ['app-web', 'ecommerce', 'app-movil', 'crm', 'landing', 'web'].includes(p))) {
    recurringCosts.push({ label: 'Hosting e infraestructura (Vercel / Supabase)', value: '$0–45/mes según tráfico' })
  }
  if (products.includes('agente-ia')) {
    recurringCosts.push({ label: 'API de IA (Groq / OpenAI / Anthropic)', value: '~$10–50/mes según conversaciones' })
    recurringCosts.push({ label: 'WhatsApp Business API (Meta) — si usa ese canal', value: '~$20–80/mes según volumen' })
  }
  if (products.includes('app-movil')) {
    recurringCosts.push({ label: 'Cuentas de desarrollador (Apple + Google)', value: '$99/año + $25 pago único' })
  }
  if (products.includes('redes')) {
    recurringCosts.push({ label: 'Pauta publicitaria (Meta / Google Ads)', value: 'mín. $300/mes — recomendado $500–1.500/mes' })
    recurringCosts.push({ label: 'Gestión mensual de contenido (nexdevp)', value: 'se cotiza aparte según paquete' })
  }

  // ── Load template for a single product ──────────────────────────────────────
  const fetchTemplate = useCallback(async (tipo: string, product: string): Promise<TemplateResponse> => {
    const res = await fetch(`/api/cotizador/template?tipo=${tipo}&product=${product}`)
    return res.json()
  }, [])

  // When the product selection changes, reload and merge the templates.
  useEffect(() => {
    if (products.length === 0) { setItems([]); setAddonsByProduct({}); return }

    let cancelled = false
    setLoading(true)

    async function load() {
      try {
        const results = await Promise.all(
          products.map(p => {
            const t = ALL_PRODUCTS.find(ap => ap.value === p)?.tipo ?? tipo ?? 'desarrollo'
            const param = p === 'app-web' && appScope === 'mvp' ? 'app-web-mvp' : p
            return fetchTemplate(t, param)
          })
        )
        if (cancelled) return

        // Settings and the size map are global — take them from the first response.
        const first = results[0]
        setSettings(first.settings ?? [])
        setSizes(first.sizes ?? [])

        setAddonsByProduct(
          Object.fromEntries(products.map((p, i) => [p, results[i]?.addons ?? []]))
        )

        // An item present in two or more selected products (setup, login, the
        // data model…) is ONE piece of work: it is charged once and moved to
        // the shared group instead of being repeated under each product.
        const idCount = new Map<string, number>()
        for (const result of results) {
          for (const ci of (result.items ?? [])) {
            idCount.set(ci.id, (idCount.get(ci.id) ?? 0) + 1)
          }
        }

        const merged: QuoteItem[] = []
        const seenShared = new Set<string>()
        let order = 0
        for (const [i, result] of results.entries()) {
          for (const ci of (result.items ?? [])) {
            // Cierre stays per product on purpose: every product gets its own
            // polish pass with the client, so it is never merged away — and it
            // keeps that product's own hours (12h on an app, 6h on a landing).
            const perProduct = ci.category === 'cierre' || (idCount.get(ci.id) ?? 1) === 1
            if (!perProduct) {
              if (seenShared.has(ci.id)) continue
              seenShared.add(ci.id)
            }
            merged.push({
              catalog_id: ci.id,
              name:       ci.name,
              size:       ci.size,
              hours:      ci.hours ?? 0,
              category:   ci.category,
              complexity: ci.complexity ?? null,
              parts:      ci.parts ?? [],
              requires_client_approval: ci.requires_client_approval ?? true,
              product:    perProduct ? products[i] : null,
              sort_order: order++,
            })
          }
        }

        // Lay the lines out in build order inside each product group.
        const groupRank = (it: QuoteItem) =>
          it.product ? products.indexOf(it.product) : -1
        merged.sort((a, b) =>
          groupRank(a) - groupRank(b) ||
          rankOf(a.category) - rankOf(b.category) ||
          (a.sort_order ?? 0) - (b.sort_order ?? 0)
        )
        merged.forEach((it, i) => { it.sort_order = i })

        // Keep gift flags and any manually added lines across a template reload.
        setItems(prev => {
          // Keyed by product too: the same catalog row can now appear once per
          // product (cierre), and gifting one must not gift the others.
          const giftKey = (it: QuoteItem) => `${it.product ?? ''}|${it.catalog_id}`
          const prevGifts = new Set(
            prev.filter(it => it.gift && it.catalog_id != null).map(giftKey)
          )
          const manual = prev
            .filter(it => it.catalog_id == null || it.category === 'addon')
            .filter(it => !it.product || products.includes(it.product))

          const rebuilt = merged.map(it => ({
            ...it,
            gift: it.catalog_id != null && prevGifts.has(giftKey(it)),
          }))
          return [...rebuilt, ...manual.map((it, i) => ({ ...it, sort_order: order + i }))]
        })
        setCustomRate(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [products, appScope, tipo, fetchTemplate])

  useEffect(() => { setCustomRate(null); setCustomMaint(null) }, [region])

  // ── Item helpers ─────────────────────────────────────────────────────────────
  function sizeFromHours(h: number): QuoteSize {
    const sorted = [...sizes].sort((a, b) => a.hours - b.hours)
    return (sorted.find(s => h <= s.hours)?.size ?? sorted[sorted.length - 1]?.size ?? 'XL') as QuoteSize
  }

  function updateItemHours(idx: number, hours: number) {
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, hours, size: sizeFromHours(hours) } : it))
  }
  function updateItemName(idx: number, name: string) {
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, name } : it))
  }
  function toggleItemGift(idx: number) {
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, gift: !it.gift } : it))
  }
  function removeItem(idx: number) {
    setItems(prev => prev.filter((_, i) => i !== idx))
    setExpanded(new Set())
  }

  /** Swaps two lines. Used to reorder within a product group. */
  function swapItems(a: number, b: number) {
    setItems(prev => {
      const next = [...prev]
      const tmp = next[a]
      next[a] = next[b]
      next[b] = tmp
      return next.map((it, i) => ({ ...it, sort_order: i }))
    })
    // Expanded rows are tracked by index, so a reorder would leave the marker
    // pointing at the wrong line.
    setExpanded(new Set())
  }

  /**
   * Places a new line after the last one of its own or an earlier stage inside
   * the same product group, so base / módulo / add-on / cierre stay in order
   * without disturbing anything the vendor moved by hand.
   */
  function insertOrdered(prev: QuoteItem[], item: QuoteItem): QuoteItem[] {
    const key  = item.product ?? null
    const rank = rankOf(item.category)

    let insertAt = -1
    let firstOfGroup = -1
    for (let i = 0; i < prev.length; i++) {
      if ((prev[i].product ?? null) !== key) continue
      if (firstOfGroup === -1) firstOfGroup = i
      if (rankOf(prev[i].category) <= rank) insertAt = i
    }
    // Nothing at or before this stage yet: sit just above the group, or at the
    // very end when the group has no lines at all.
    if (insertAt === -1) insertAt = firstOfGroup === -1 ? prev.length - 1 : firstOfGroup - 1

    const next = [...prev]
    next.splice(insertAt + 1, 0, item)
    return next.map((it, i) => ({ ...it, sort_order: i }))
  }

  /** Adds a catalog add-on to a product group, in build order. */
  function addCatalogItem(product: string, addon: QuoteCatalogItem, gift = false) {
    setItems(prev => insertOrdered(prev, {
      catalog_id: addon.id,
      name:       addon.name,
      size:       addon.size,
      hours:      addon.hours ?? addon.base_hours ?? 0,
      category:   addon.category,
      complexity: addon.complexity ?? null,
      parts:      addon.parts ?? [],
      requires_client_approval: addon.requires_client_approval ?? true,
      product:    product === SHARED ? null : product,
      sort_order: 0,
      gift,
    }))
    setExpanded(new Set())
    openAddPanel(null)
  }

  /**
   * Adds an empty, freely editable line — the escape hatch for one-offs. If the
   * search found nothing, whatever was typed becomes the line's name.
   */
  function addFreeItem(product: string, gift = false, name?: string) {
    setItems(prev => insertOrdered(prev, {
      catalog_id: null,
      name:       name?.trim() || (gift ? 'Funcionalidad de regalo' : 'Nueva funcionalidad'),
      size:       'M',
      hours:      sizes.find(s => s.size === 'M')?.hours ?? 16,
      category:   'addon',
      product:    product === SHARED ? null : product,
      sort_order: 0,
      gift,
    }))
    setExpanded(new Set())
    openAddPanel(null)
  }

  // ── Navigation ───────────────────────────────────────────────────────────────
  function goNext() { setStep(s => Math.min(s + 1, 4) as Step) }
  function goBack() { setStep(s => Math.max(s - 1, 1) as Step) }

  function selectTipo(t: QuoteTipo) {
    setTipo(t)
    setProducts([])
    setItems([])
    setCustomRate(null)
  }

  function toggleProduct(p: string) {
    setProducts(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])
  }

  // ── Save ─────────────────────────────────────────────────────────────────────
  async function handleSave() {
    setSaving(true)
    try {
      const label = products.map(productLabel).join(' + ')
      const res = await fetch('/api/cotizador/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title:            title || `${label} — cliente`,
          region,
          hourly_rate:      effectiveRate,
          tipo:             tipo ?? ALL_PRODUCTS.find(ap => ap.value === products[0])?.tipo ?? 'desarrollo',
          product:          products.join('+'),
          addons:           items.filter(i => i.category === 'addon').map(i => i.name),
          status:           'draft',
          lead_id:          initialLeadId ?? null,
          total_hours:      totalHours,
          total_price:      totalPrice,
          special_discount: specialDiscount,
          // Only sent when actually edited, so the server derives it from the
          // percentage otherwise instead of trusting a client-side number.
          maint_month:      customMaint,
          items,
        }),
      })
      const json = await res.json()
      if (res.ok) router.push('/admin/cotizador')
      else alert(json.error ?? 'Error al guardar.')
    } finally {
      setSaving(false)
    }
  }

  const stepLabels = ['Tipo', 'Productos', 'Región', 'Resultado']

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
                           'bg-nex-ink/10 text-nex-grey',
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
                  done ? 'bg-nex-green/50' : 'bg-nex-ink/10',
                ].join(' ')} />
              )}
            </div>
          )
        })}
      </div>

      <div className="bg-nex-dark border border-nex-ink/10 rounded-2xl p-6 sm:p-8">

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
                    tipo === t.value ? 'border-nex-green bg-nex-green/10' : 'border-nex-ink/10 hover:border-nex-ink/25',
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
                Cada producto trae sus entregables base. Los extras se agregan en el resultado.
                Si combinás dos o más se aplica un {Math.round(BUNDLE_DISCOUNT * 100)}% de descuento.
              </p>
            </div>

            {isBundle && (
              <div className="flex items-center gap-2 bg-nex-green/10 border border-nex-green/30 rounded-lg px-4 py-2.5">
                <span className="font-dm-mono text-xs text-nex-green uppercase tracking-wider">Bundle activado</span>
                <span className="font-dm-mono text-xs text-nex-green font-bold">−{Math.round(BUNDLE_DISCOUNT * 100)}% sobre el total</span>
              </div>
            )}

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
                        on ? 'border-nex-green bg-nex-green/10' : 'border-nex-ink/10 hover:border-nex-ink/25',
                      ].join(' ')}
                    >
                      {on && (
                        <span className="absolute top-2 right-2 w-4 h-4 bg-nex-green rounded-full flex items-center justify-center text-[9px] text-nex-black font-bold">✓</span>
                      )}
                      <div className="text-xl mb-1.5">{p.icon}</div>
                      <div className="font-jost font-bold text-nex-white text-sm">{p.label}</div>
                      <div className="font-jost text-[10px] text-nex-grey mt-0.5">{p.desc}</div>
                    </button>
                  )
                })}
              </div>
            </div>

            {products.includes('app-web') && (
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-nex-black/40 border border-nex-ink/10 rounded-xl px-4 py-3">
                <span className="font-jost text-xs text-nex-grey shrink-0">Alcance de la aplicación:</span>
                <div className="flex gap-2">
                  {([
                    { value: 'mvp',  label: 'MVP — validar la idea' },
                    { value: 'full', label: 'Completa — todos los módulos' },
                  ] as const).map(s => (
                    <button
                      key={s.value}
                      onClick={() => setAppScope(s.value)}
                      className={[
                        'px-3 py-1.5 rounded-lg border text-xs font-jost transition-all',
                        appScope === s.value
                          ? 'border-nex-green bg-nex-green/10 text-nex-green'
                          : 'border-nex-ink/10 text-nex-grey hover:border-nex-ink/25',
                      ].join(' ')}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

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
                        on ? 'border-nex-green bg-nex-green/10' : 'border-nex-ink/10 hover:border-nex-ink/25',
                      ].join(' ')}
                    >
                      {on && (
                        <span className="absolute top-2 right-2 w-4 h-4 bg-nex-green rounded-full flex items-center justify-center text-[9px] text-nex-black font-bold">✓</span>
                      )}
                      <div className="text-xl mb-1.5">{p.icon}</div>
                      <div className="font-jost font-bold text-nex-white text-sm">{p.label}</div>
                      <div className="font-jost text-[10px] text-nex-grey mt-0.5">{p.desc}</div>
                      <div className="font-dm-mono text-[9px] text-nex-grey/60 mt-1 uppercase tracking-wider">
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

        {/* ── STEP 3: Región ── */}
        {step === 3 && (
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
                      region === r.value ? 'border-nex-green bg-nex-green/10' : 'border-nex-ink/10 hover:border-nex-ink/25',
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

        {/* ── STEP 4: Resultado ── */}
        {step === 4 && (
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
                <div className="flex items-center gap-1 bg-nex-black border border-nex-ink/10 rounded-lg px-3 py-1.5">
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

            <div>
              <label className="block font-jost text-xs text-nex-grey mb-1.5">Nombre del presupuesto</label>
              <input
                type="text"
                placeholder={`${products.map(productLabel).join(' + ')} — cliente`}
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full bg-nex-black border border-nex-ink/10 rounded-lg px-3.5 py-2 text-sm text-nex-white focus:outline-none focus:border-nex-green/50 transition-colors"
              />
            </div>

            {loading ? (
              <p className="text-nex-grey text-sm animate-pulse">Cargando plantilla…</p>
            ) : (
              <>
                {/* Line items, grouped by product */}
                <div className="space-y-6">
                  <h3 className="font-dm-mono text-xs text-nex-green uppercase tracking-[0.15em]">
                    Fases / funcionalidades
                  </h3>

                  {groups.map(group => {
                    const groupHours = group.entries.reduce((acc, e) => acc + (e.item.hours ?? 0), 0)
                    const available  = group.key === SHARED ? [] : (addonsByProduct[group.key] ?? [])
                    // Only single-use items get blocked once added. A custom app
                    // legitimately has several complex modules, and a site can
                    // buy three extra pages.
                    const usedIds    = new Set(items.map(i => i.catalog_id).filter(Boolean))
                    const isOpen     = addPanel === group.key

                    // The search reaches into the breakdown too, so "PDF" finds
                    // the quoting module through its "Exportación a PDF" part.
                    const q = norm(addQuery.trim())
                    const matches = q
                      ? available
                          .map(addon => ({
                            addon,
                            viaPart: (addon.parts ?? []).find(p => norm(p).includes(q)) ?? null,
                          }))
                          .filter(({ addon, viaPart }) =>
                            norm(addon.name).includes(q) ||
                            norm(addon.description ?? '').includes(q) ||
                            viaPart !== null
                          )
                      : available.map(addon => ({ addon, viaPart: null as string | null }))

                    return (
                      <div key={group.key} className="space-y-2">
                        {/* Group header — only meaningful when more than one group exists */}
                        {groups.length > 1 && (
                          <div className="flex items-center gap-3 pt-1">
                            <span className="font-jost font-bold text-sm text-nex-white">{group.label}</span>
                            <span className="font-dm-mono text-[10px] text-nex-grey">{groupHours}h</span>
                            <div className="flex-1 h-px bg-nex-ink/10" />
                          </div>
                        )}

                        {group.entries.map(({ item, idx }, pos) => (
                          <div
                            key={idx}
                            className={[
                              'border rounded-lg px-4 py-3',
                              item.gift ? 'bg-nex-green/5 border-nex-green/20' : 'bg-nex-black border-nex-ink/5',
                            ].join(' ')}
                          >
                          <div className="flex items-center gap-3">
                            {/* Reorder within the group — the build order is
                                the vendor's decision, not the system's. */}
                            <div className="flex flex-col shrink-0 -my-1">
                              <button
                                disabled={pos === 0}
                                onClick={() => swapItems(idx, group.entries[pos - 1].idx)}
                                aria-label="Subir"
                                className="text-[9px] leading-none text-nex-grey hover:text-nex-green disabled:opacity-20 disabled:hover:text-nex-grey transition-colors"
                              >
                                ▲
                              </button>
                              <button
                                disabled={pos === group.entries.length - 1}
                                onClick={() => swapItems(idx, group.entries[pos + 1].idx)}
                                aria-label="Bajar"
                                className="text-[9px] leading-none text-nex-grey hover:text-nex-green disabled:opacity-20 disabled:hover:text-nex-grey transition-colors mt-0.5"
                              >
                                ▼
                              </button>
                            </div>
                            {item.gift ? (
                              <span className="font-dm-mono text-[10px] font-bold uppercase rounded border px-2 py-0.5 shrink-0 text-nex-green border-nex-green/40 bg-nex-green/10">
                                🎁
                              </span>
                            ) : item.size ? (
                              <span className={[
                                'font-dm-mono text-[10px] font-bold uppercase rounded border px-2 py-0.5 shrink-0',
                                SIZE_COLORS[item.size as QuoteSize],
                              ].join(' ')}>
                                {item.size}
                              </span>
                            ) : null}

                            {item.category && CATEGORY_LABEL[item.category] && (
                              <span className="hidden sm:inline font-dm-mono text-[9px] uppercase tracking-wider text-nex-grey/70 shrink-0">
                                {CATEGORY_LABEL[item.category]}
                              </span>
                            )}
                            {item.requires_client_approval === false && (
                              <span
                                title="Ingeniería interna: se cobra y se paga, pero el cliente no la aprueba"
                                className="hidden sm:inline font-dm-mono text-[9px] uppercase tracking-wider text-nex-grey/40 border border-nex-ink/15 rounded px-1.5 py-0.5 shrink-0"
                              >
                                interno
                              </span>
                            )}

                            <input
                              type="text"
                              value={item.name}
                              onChange={e => updateItemName(idx, e.target.value)}
                              className="flex-1 bg-transparent font-jost text-sm text-nex-white outline-none min-w-0"
                            />
                            {(item.parts?.length ?? 0) > 0 && (
                              <button
                                onClick={() => toggleExpanded(idx)}
                                title="Ver qué incluye"
                                className="font-dm-mono text-[10px] text-nex-grey hover:text-nex-green transition-colors shrink-0"
                              >
                                {expanded.has(idx) ? '▾' : '▸'} {item.parts!.length}
                              </button>
                            )}
                            {item.gift && (
                              <span className="font-dm-mono text-[9px] text-nex-green uppercase tracking-wider shrink-0">
                                sin cargo
                              </span>
                            )}
                            <div className="flex items-center gap-1 shrink-0">
                              <input
                                type="number"
                                min={1}
                                value={item.hours}
                                onChange={e => updateItemHours(idx, Number(e.target.value))}
                                className="w-14 bg-nex-dark border border-nex-ink/10 rounded px-2 py-1 font-dm-mono text-xs text-nex-white text-right outline-none"
                              />
                              <span className="font-dm-mono text-xs text-nex-grey">h</span>
                            </div>
                            {/* Real value of the phase: overhead in, discounts
                                applied. This is what the developer is paid on. */}
                            <span
                              title="Valor real de la fase, con descuentos aplicados"
                              className="hidden md:block font-dm-mono text-[10px] text-nex-grey/60 w-16 text-right shrink-0"
                            >
                              {item.gift ? '—' : fmt(effectivePriceOf(item))}
                            </span>
                            <button
                              onClick={() => toggleItemGift(idx)}
                              title={item.gift ? 'Quitar regalo' : 'Marcar como regalo'}
                              className={[
                                'text-sm shrink-0 transition-colors',
                                item.gift ? 'text-nex-green' : 'text-nex-grey hover:text-nex-green',
                              ].join(' ')}
                            >
                              🎁
                            </button>
                            <button
                              onClick={() => removeItem(idx)}
                              className="text-nex-grey hover:text-red-400 transition-colors text-lg leading-none shrink-0"
                              aria-label="Eliminar"
                            >
                              ×
                            </button>
                          </div>

                          {/* What the line includes. Descriptive only — the
                              hours above cover the whole module. */}
                          {expanded.has(idx) && (item.parts?.length ?? 0) > 0 && (
                            <ul className="mt-2.5 pt-2.5 border-t border-nex-ink/5 space-y-1">
                              {item.parts!.map(part => (
                                <li key={part} className="flex items-start gap-2 font-jost text-[11px] text-nex-grey">
                                  <span className="text-nex-green/50 mt-px">·</span>
                                  <span>{part}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                          </div>
                        ))}

                        {/* Add panel — only the add-ons that make sense for this product */}
                        {group.key !== SHARED && (
                          <div className="relative">
                            <button
                              onClick={() => openAddPanel(isOpen ? null : group.key)}
                              className="font-jost text-xs text-nex-grey hover:text-nex-green transition-colors"
                            >
                              {isOpen ? '× Cerrar' : `+ Agregar a ${group.label}`}
                            </button>

                            {isOpen && (
                              <div className="mt-2 bg-nex-black border border-nex-ink/10 rounded-xl">
                                {/* Search stays pinned; only the list scrolls */}
                                <div className="p-3 pb-2.5 border-b border-nex-ink/10">
                                  <input
                                    type="text"
                                    autoFocus
                                    value={addQuery}
                                    onChange={e => setAddQuery(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Escape') openAddPanel(null) }}
                                    placeholder="Buscar… (también busca dentro del desglose)"
                                    className="w-full bg-nex-dark border border-nex-ink/10 rounded-lg px-3 py-1.5 font-jost text-xs text-nex-white placeholder:text-nex-grey/60 focus:outline-none focus:border-nex-green/50 transition-colors"
                                  />
                                  {q && (
                                    <p className="font-dm-mono text-[10px] text-nex-grey/60 mt-1.5">
                                      {matches.length} de {available.length}
                                    </p>
                                  )}
                                </div>

                                <div className="p-3 space-y-1 max-h-64 overflow-y-auto">
                                {matches.length > 0 ? (
                                  matches.map(({ addon, viaPart }) => {
                                    const already = !addon.repeatable && usedIds.has(addon.id)
                                    return (
                                      <div
                                        key={addon.id}
                                        className={[
                                          'flex items-start gap-2 rounded-lg px-3 py-2 transition-colors',
                                          already ? 'opacity-40' : 'hover:bg-nex-dark',
                                        ].join(' ')}
                                      >
                                        <button
                                          disabled={already}
                                          onClick={() => addCatalogItem(group.key, addon)}
                                          className="flex-1 text-left disabled:cursor-not-allowed min-w-0"
                                        >
                                          <span className="flex items-center gap-2">
                                            <span className={[
                                              'font-dm-mono text-[9px] font-bold uppercase rounded border px-1.5 py-0.5 shrink-0',
                                              SIZE_COLORS[addon.size],
                                            ].join(' ')}>
                                              {addon.size}
                                            </span>
                                            <span className="font-jost text-xs text-nex-white truncate">{addon.name}</span>
                                            {addon.repeatable && (
                                              <span className="font-dm-mono text-[9px] text-nex-grey/60 shrink-0">×n</span>
                                            )}
                                            <span className="font-dm-mono text-[10px] text-nex-grey shrink-0 ml-auto">
                                              {addon.hours ?? addon.base_hours}h
                                            </span>
                                          </span>
                                          {/* When the hit came from the breakdown, show which
                                              part matched so the result is not a mystery. */}
                                          {viaPart ? (
                                            <span className="block font-jost text-[10px] text-nex-green/70 mt-0.5 pl-8 truncate">
                                              incluye: {viaPart}
                                            </span>
                                          ) : addon.description && (
                                            <span className="block font-jost text-[10px] text-nex-grey/70 mt-0.5 pl-8 truncate">
                                              {addon.description}
                                            </span>
                                          )}
                                        </button>
                                        <button
                                          disabled={already}
                                          onClick={() => addCatalogItem(group.key, addon, true)}
                                          title="Agregar como regalo"
                                          className="text-xs shrink-0 text-nex-grey hover:text-nex-green transition-colors disabled:cursor-not-allowed mt-0.5"
                                        >
                                          🎁
                                        </button>
                                      </div>
                                    )
                                  })
                                ) : (
                                  <p className="font-jost text-xs text-nex-grey italic px-3 py-2">
                                    {q
                                      ? `Nada coincide con "${addQuery.trim()}". Podés agregarlo como línea libre.`
                                      : 'Sin add-ons definidos para este producto.'}
                                  </p>
                                )}
                                </div>

                                <div className="border-t border-nex-ink/10 py-2.5 flex gap-4 px-3">
                                  <button
                                    onClick={() => addFreeItem(group.key, false, addQuery)}
                                    className="font-jost text-xs text-nex-grey hover:text-nex-green transition-colors"
                                  >
                                    ✎ Línea libre
                                  </button>
                                  <button
                                    onClick={() => addFreeItem(group.key, true, addQuery)}
                                    className="font-jost text-xs text-nex-grey hover:text-nex-green transition-colors"
                                  >
                                    🎁 Regalo libre
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* Overhead */}
                <div className="bg-nex-black/40 border border-nex-ink/5 rounded-xl p-4 space-y-2">
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
                  {giftHours > 0 && (
                    <div className="flex justify-between font-jost text-sm">
                      <span className="text-nex-green">🎁 Funcionalidades de regalo</span>
                      <span className="text-nex-green font-dm-mono">{giftHours}h</span>
                    </div>
                  )}
                  <div className="border-t border-nex-ink/10 pt-2 flex justify-between font-jost text-sm font-bold">
                    <span className="text-nex-white">Total horas del proyecto</span>
                    <span className="text-nex-green font-dm-mono">{totalHours}h</span>
                  </div>
                </div>

                {/* Price summary */}
                <div className="space-y-3">
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

                  {specialDiscount > 0 && (
                    <div className="flex items-center justify-between bg-nex-green/5 border border-nex-green/20 rounded-xl px-5 py-3">
                      <div>
                        <p className="font-jost text-sm font-bold text-nex-green">Descuento especial</p>
                        <p className="font-jost text-xs text-nex-grey mt-0.5">
                          Precio calculado: <span className="line-through">{fmt(calculatedPrice)}</span>
                        </p>
                      </div>
                      <p className="font-dm-mono text-base font-bold text-nex-green">−{fmt(specialDiscount)}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="rounded-xl border p-4 border-nex-green/40 bg-nex-green/5">
                      <p className="font-dm-mono text-xs text-nex-grey uppercase tracking-[0.1em] mb-1">
                        Precio del proyecto
                      </p>
                      <p className="font-jost font-bold text-2xl text-nex-green">{fmt(totalPrice)}</p>
                    </div>

                    {/* Editable: the percentage only suggests a number, the
                        maintenance fee is negotiated like anything else. */}
                    <div className="rounded-xl border p-4 border-nex-ink/10 bg-nex-black/40">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-dm-mono text-xs text-nex-grey uppercase tracking-[0.1em]">
                          Mantenimiento / mes
                        </p>
                        {customMaint !== null && (
                          <button
                            onClick={() => setCustomMaint(null)}
                            className="font-jost text-[10px] text-nex-grey hover:text-nex-white transition-colors"
                          >
                            reset
                          </button>
                        )}
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="font-dm-mono text-xs text-nex-grey">{currency}</span>
                        <input
                          type="number"
                          min={0}
                          value={customMaint ?? Math.round(suggestedMaint)}
                          onChange={e => setCustomMaint(Number(e.target.value))}
                          className="w-full bg-transparent font-jost font-bold text-xl text-nex-white outline-none focus:text-nex-green transition-colors"
                        />
                      </div>
                      {customMaint !== null && Math.round(customMaint) !== Math.round(suggestedMaint) && (
                        <p className="font-jost text-[10px] text-nex-grey/70 mt-0.5">
                          Sugerido: {fmt(suggestedMaint)}
                        </p>
                      )}
                    </div>

                    {[
                      { label: 'Total horas', value: `${totalHours}h`, big: false },
                    ].map(card => (
                      <div
                        key={card.label}
                        className={[
                          'rounded-xl border p-4',
                          card.big ? 'border-nex-green/40 bg-nex-green/5' : 'border-nex-ink/10 bg-nex-black/40',
                        ].join(' ')}
                      >
                        <p className="font-dm-mono text-xs text-nex-grey uppercase tracking-[0.1em] mb-1">{card.label}</p>
                        <p className={['font-jost font-bold', card.big ? 'text-2xl text-nex-green' : 'text-xl text-nex-white'].join(' ')}>
                          {card.value}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="bg-nex-black/40 border border-nex-ink/10 rounded-xl p-4">
                    <p className="font-dm-mono text-xs text-nex-green uppercase tracking-[0.15em] mb-3">
                      Ajuste de precio final
                    </p>
                    <div className="flex items-center gap-3">
                      <span className="font-jost text-sm text-nex-grey shrink-0">Precio final al cliente:</span>
                      <div className="flex items-center gap-1 bg-nex-dark border border-nex-ink/10 rounded-lg px-3 py-1.5 focus-within:border-nex-green/50 transition-colors">
                        <span className="font-dm-mono text-xs text-nex-grey">{currency}</span>
                        <input
                          type="number"
                          min={0}
                          value={finalPrice ?? Math.round(calculatedPrice)}
                          onChange={e => setFinalPrice(Number(e.target.value))}
                          className="w-24 bg-transparent font-dm-mono text-sm text-nex-white outline-none text-right"
                        />
                      </div>
                      {finalPrice !== null && (
                        <button
                          onClick={() => setFinalPrice(null)}
                          className="font-jost text-xs text-nex-grey hover:text-nex-white transition-colors"
                        >
                          reset
                        </button>
                      )}
                      {specialDiscount > 0 && (
                        <span className="font-jost text-xs text-nex-green">
                          Descuento de {fmt(specialDiscount)} aplicado
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {recurringCosts.length > 0 && (
                  <div className="bg-nex-black/40 border border-nex-ink/5 rounded-xl p-4">
                    <h3 className="font-dm-mono text-xs text-nex-green uppercase tracking-[0.15em] mb-1">
                      Costos recurrentes estimados del cliente
                    </h3>
                    <p className="font-jost text-[11px] text-nex-grey mb-3">
                      Informativo — no forma parte del presupuesto. Montos en USD, el cliente los paga directo al proveedor.
                    </p>
                    <div className="space-y-2">
                      {recurringCosts.map(r => (
                        <div key={r.label} className="flex flex-col sm:flex-row sm:justify-between gap-0.5 font-jost text-sm">
                          <span className="text-nex-grey">{r.label}</span>
                          <span className="text-nex-white font-dm-mono text-xs sm:text-sm shrink-0">{r.value}</span>
                        </div>
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

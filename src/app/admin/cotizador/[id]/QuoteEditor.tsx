'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { PricingSettings, QuoteItem, QuoteSize, QuoteStatus } from '@/lib/supabase'

interface LeadOption { id: string; nombre: string; email: string; estado: string; canal?: string }

type CommissionType = 'pool' | 'vendor_own' | null

const SIZE_COLORS: Record<QuoteSize, string> = {
  S:  'text-emerald-400 bg-emerald-400/10 border-emerald-400/30',
  M:  'text-blue-400   bg-blue-400/10   border-blue-400/30',
  L:  'text-orange-400 bg-orange-400/10 border-orange-400/30',
  XL: 'text-purple-400 bg-purple-400/10 border-purple-400/30',
}

const STATUS_OPTIONS: { value: QuoteStatus; label: string }[] = [
  { value: 'draft',    label: 'Borrador' },
  { value: 'sent',     label: 'Enviado'  },
  { value: 'accepted', label: 'Aceptado' },
  { value: 'rejected', label: 'Rechazado'},
]

interface QuoteRow {
  id:              string
  lead_id:         string | null
  title:           string
  tipo:            string
  product:         string
  region:          string
  hourly_rate:     number
  status:          QuoteStatus
  total_hours:     number
  total_price:     number
  maint_month:     number
  addons:          string[]
  notes:           string | null
  commission_type: CommissionType
}

interface Props {
  quote:    QuoteRow
  items:    QuoteItem[]
  settings: PricingSettings[]
}

const COMMISSION_RATES: Record<NonNullable<CommissionType>, number> = {
  pool:       0.15,
  vendor_own: 0.20,
}

const COMMISSION_LABELS: Record<NonNullable<CommissionType>, string> = {
  pool:       'Lead de nexdevp (15%)',
  vendor_own: 'Lead propio del vendedor (20%)',
}

export function QuoteEditor({ quote, items: initialItems, settings }: Props) {
  const router = useRouter()
  const [title,          setTitle]          = useState(quote.title)
  const [status,         setStatus]         = useState<QuoteStatus>(quote.status)
  const [notes,          setNotes]          = useState(quote.notes ?? '')
  const [items,          setItems]          = useState<QuoteItem[]>(initialItems)
  const [rate,           setRate]           = useState(quote.hourly_rate)
  const [leadId,         setLeadId]         = useState<string>(quote.lead_id ?? '')
  const [leads,          setLeads]          = useState<LeadOption[]>([])
  const [commissionType, setCommissionType] = useState<CommissionType>(quote.commission_type)
  const [saving,         setSaving]         = useState(false)

  // PDF options panel
  const [pdfOpen,     setPdfOpen]     = useState(false)
  const [pdfShowHrs,  setPdfShowHrs]  = useState(true)
  const [pdfShowRate, setPdfShowRate] = useState(false)
  const pdfRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/cotizador/leads')
      .then(r => r.json())
      .then(d => setLeads(d.leads ?? []))
      .catch(() => {})
  }, [])

  // Auto-derive commission type from lead canal
  useEffect(() => {
    if (!leadId) { setCommissionType(null); return }
    const lead = leads.find(l => l.id === leadId)
    if (!lead) return
    setCommissionType(lead.canal === 'vendedor' ? 'vendor_own' : 'pool')
  }, [leadId, leads])

  // Close PDF panel on outside click
  useEffect(() => {
    if (!pdfOpen) return
    function handler(e: MouseEvent) {
      if (pdfRef.current && !pdfRef.current.contains(e.target as Node)) {
        setPdfOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [pdfOpen])

  const ps       = settings.find(s => s.region === quote.region)
  const currency = ps?.currency ?? 'EUR'

  const baseHours  = items.reduce((acc, i) => acc + (i.hours ?? 0), 0)
  const pmHours    = Math.round(baseHours * (ps?.overhead_pm ?? 0.12))
  const qaHours    = Math.round(baseHours * (ps?.overhead_qa ?? 0.15))
  const cxHours    = Math.round(baseHours * (ps?.overhead_cx ?? 0.10))
  const totalHours = baseHours + pmHours + qaHours + cxHours
  const totalPrice = totalHours * rate
  const maintMonth = (totalPrice * (ps?.maint_rate ?? 0.175)) / 12

  const commissionAmount = commissionType
    ? totalPrice * COMMISSION_RATES[commissionType]
    : null

  const fmt = (n: number) =>
    n.toLocaleString('es-ES', { style: 'currency', currency, maximumFractionDigits: 0 })

  function pdfUrl() {
    const params = new URLSearchParams()
    if (!pdfShowHrs)  params.set('show_hours', '0')
    if (!pdfShowRate) params.set('show_rate',  '0')
    const qs = params.toString()
    return `/api/cotizador/quotes/${quote.id}/pdf${qs ? `?${qs}` : ''}`
  }

  function updateHours(idx: number, hours: number) {
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, hours } : it))
  }
  function updateName(idx: number, name: string) {
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, name } : it))
  }
  function removeItem(idx: number) {
    setItems(prev => prev.filter((_, i) => i !== idx))
  }
  function addItem() {
    setItems(prev => [...prev, { catalog_id: null, name: 'Nueva funcionalidad', size: 'M', hours: 20, sort_order: prev.length }])
  }

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch(`/api/cotizador/quotes/${quote.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          status,
          notes:           notes || null,
          lead_id:         leadId || null,
          hourly_rate:     rate,
          total_hours:     totalHours,
          total_price:     totalPrice,
          maint_month:     maintMonth,
          commission_type: commissionType,
          items,
        }),
      })
      if (res.ok) {
        router.push('/admin/cotizador')
        router.refresh()
      } else {
        const j = await res.json()
        alert(j.error ?? 'Error al guardar.')
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <Link href="/admin/cotizador" className="font-jost text-xs text-nex-grey hover:text-nex-white transition-colors mb-3 inline-block">
            ← Presupuestos
          </Link>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full bg-transparent font-jost font-bold text-2xl text-nex-white outline-none border-b border-white/10 focus:border-nex-green/50 pb-1 transition-colors"
          />
          <p className="font-jost text-xs text-nex-grey mt-1">
            {quote.tipo} · {quote.product} · {quote.region.charAt(0).toUpperCase() + quote.region.slice(1)}
          </p>
        </div>
        <select
          value={status}
          onChange={e => setStatus(e.target.value as QuoteStatus)}
          className="bg-nex-dark border border-white/10 rounded-lg px-3 py-2 font-jost text-sm text-nex-white focus:outline-none focus:border-nex-green/50 shrink-0"
        >
          {STATUS_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Lead link */}
      <div>
        <label className="block font-jost text-xs text-nex-grey mb-1.5">Lead vinculado</label>
        {leadId ? (
          <div className="flex items-center justify-between gap-3 bg-nex-dark border border-nex-green/30 rounded-lg px-3 py-2">
            <div className="flex items-center gap-2 min-w-0">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-nex-green shrink-0">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
              <span className="font-jost text-sm text-nex-white truncate">
                {leads.find(l => l.id === leadId)?.nombre ?? leadId}
              </span>
              <span className="font-jost text-xs text-nex-grey truncate hidden sm:block">
                · {leads.find(l => l.id === leadId)?.email}
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                if (confirm('¿Quitar el lead asignado a este presupuesto? Esta acción no se puede deshacer fácilmente.')) {
                  setLeadId('')
                  setCommissionType(null)
                }
              }}
              className="font-jost text-xs text-nex-grey hover:text-red-400 border border-white/10 hover:border-red-400/30 rounded-md px-2.5 py-1 transition-colors shrink-0"
            >
              Quitar lead
            </button>
          </div>
        ) : (
          <select
            value={leadId}
            onChange={e => setLeadId(e.target.value)}
            className="w-full bg-nex-dark border border-white/10 rounded-lg px-3 py-2 font-jost text-sm text-nex-white focus:outline-none focus:border-nex-green/50 transition-colors"
          >
            <option value="">— Sin vincular —</option>
            {leads.map(l => (
              <option key={l.id} value={l.id}>
                {l.nombre} · {l.email} ({l.estado})
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Rate */}
      <div className="flex items-center gap-3">
        <span className="font-jost text-sm text-nex-grey">Tarifa/hora:</span>
        <div className="flex items-center gap-1 bg-nex-black border border-white/10 rounded-lg px-3 py-1.5">
          <span className="font-dm-mono text-xs text-nex-grey">{currency}</span>
          <input
            type="number"
            min={1}
            value={rate}
            onChange={e => setRate(Number(e.target.value))}
            className="w-16 bg-transparent font-dm-mono text-sm text-nex-white outline-none text-right"
          />
          <span className="font-dm-mono text-xs text-nex-grey">/h</span>
        </div>
      </div>

      {/* Line items */}
      <div className="bg-nex-dark border border-white/10 rounded-xl p-5 space-y-3">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-dm-mono text-xs text-nex-green uppercase tracking-[0.15em]">Fases / funcionalidades</h3>
          <button onClick={addItem} className="font-jost text-xs text-nex-grey hover:text-nex-green transition-colors">
            + Agregar
          </button>
        </div>
        {items.map((item, idx) => (
          <div key={idx} className="flex items-center gap-3 bg-nex-black border border-white/5 rounded-lg px-4 py-3">
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
              onChange={e => updateName(idx, e.target.value)}
              className="flex-1 bg-transparent font-jost text-sm text-nex-white outline-none"
            />
            <div className="flex items-center gap-1 shrink-0">
              <input
                type="number"
                min={1}
                value={item.hours}
                onChange={e => updateHours(idx, Number(e.target.value))}
                className="w-14 bg-nex-dark border border-white/10 rounded px-2 py-1 font-dm-mono text-xs text-nex-white text-right outline-none"
              />
              <span className="font-dm-mono text-xs text-nex-grey">h</span>
            </div>
            <button onClick={() => removeItem(idx)} className="text-nex-grey hover:text-red-400 transition-colors text-lg leading-none shrink-0" aria-label="Eliminar">×</button>
          </div>
        ))}
      </div>

      {/* Overhead breakdown */}
      <div className="bg-nex-black/40 border border-white/5 rounded-xl p-4 space-y-2">
        <h3 className="font-dm-mono text-xs text-nex-green uppercase tracking-[0.15em] mb-3">Desglose</h3>
        {[
          { label: 'Subtotal funcionalidades', val: baseHours },
          { label: `Gestión de proyecto (${Math.round((ps?.overhead_pm ?? 0.12) * 100)}%)`, val: pmHours },
          { label: `Testing / QA (${Math.round((ps?.overhead_qa ?? 0.15) * 100)}%)`, val: qaHours },
          { label: `Contingencia (${Math.round((ps?.overhead_cx ?? 0.10) * 100)}%)`, val: cxHours },
        ].map(r => (
          <div key={r.label} className="flex justify-between font-jost text-sm">
            <span className="text-nex-grey">{r.label}</span>
            <span className="text-nex-white font-dm-mono">{r.val}h</span>
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
          { label: 'Precio del proyecto', value: fmt(totalPrice), big: true  },
          { label: 'Mantenimiento / mes', value: fmt(maintMonth), big: false },
          { label: 'Total horas',          value: `${totalHours}h`, big: false },
        ].map(card => (
          <div key={card.label} className={['rounded-xl border p-4', card.big ? 'border-nex-green/40 bg-nex-green/5' : 'border-white/10 bg-nex-black/40'].join(' ')}>
            <p className="font-dm-mono text-xs text-nex-grey uppercase tracking-[0.1em] mb-1">{card.label}</p>
            <p className={['font-jost font-bold', card.big ? 'text-2xl text-nex-green' : 'text-xl text-nex-white'].join(' ')}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Commission — auto-derived from lead canal, shown when accepted */}
      {status === 'accepted' && (
        <div className="bg-nex-dark border border-nex-green/20 rounded-xl p-5">
          <h3 className="font-dm-mono text-xs text-nex-green uppercase tracking-[0.15em] mb-4">Comisión del vendedor</h3>
          {!leadId ? (
            <p className="font-jost text-sm text-nex-grey">
              Vinculá un lead para calcular la comisión automáticamente.
            </p>
          ) : !commissionType ? (
            <p className="font-jost text-sm text-nex-grey animate-pulse">Calculando…</p>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <p className="font-jost text-sm text-nex-white">{COMMISSION_LABELS[commissionType]}</p>
                <p className="font-jost text-xs text-nex-grey mt-0.5">
                  Canal del lead: <span className="text-nex-white">{leads.find(l => l.id === leadId)?.canal ?? '—'}</span>
                </p>
              </div>
              <div className="text-right">
                <p className="font-dm-mono text-xs text-nex-grey mb-0.5">{Math.round(COMMISSION_RATES[commissionType] * 100)}%</p>
                <p className="font-jost font-bold text-2xl text-nex-green">{fmt(commissionAmount!)}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Notes */}
      <div>
        <label className="block font-jost text-xs text-nex-grey mb-1.5">Notas internas</label>
        <textarea
          rows={3}
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Observaciones, acuerdos, contexto del cliente…"
          className="w-full bg-nex-black border border-white/10 rounded-lg px-3.5 py-2 text-sm text-nex-white focus:outline-none focus:border-nex-green/50 transition-colors resize-none"
        />
      </div>

      {/* Actions */}
      <div className="flex justify-between pt-2">
        <Link href="/admin/cotizador" className="font-jost text-sm text-nex-grey hover:text-nex-white transition-colors">
          ← Cancelar
        </Link>
        <div className="flex items-center gap-3">

          {/* PDF export with options */}
          <div className="relative" ref={pdfRef}>
            <button
              onClick={() => setPdfOpen(v => !v)}
              className="border border-white/20 text-nex-white font-jost text-sm py-2.5 px-5 rounded-lg hover:border-nex-green/50 hover:text-nex-green transition-colors"
            >
              Exportar PDF ▾
            </button>

            {pdfOpen && (
              <div className="absolute bottom-full right-0 mb-2 w-64 bg-nex-dark border border-white/15 rounded-xl shadow-xl p-4 space-y-3 z-10">
                <p className="font-dm-mono text-[10px] text-nex-grey uppercase tracking-[0.15em]">Opciones del PDF</p>

                {[
                  { label: 'Mostrar horas por fase',  state: pdfShowHrs,  set: setPdfShowHrs  },
                  { label: 'Mostrar tarifa por hora', state: pdfShowRate, set: setPdfShowRate },
                ].map(({ label, state, set }) => (
                  <label key={label} className="flex items-center gap-3 cursor-pointer group">
                    <div
                      onClick={() => set(v => !v)}
                      className={[
                        'w-9 h-5 rounded-full transition-colors shrink-0',
                        state ? 'bg-nex-green' : 'bg-white/20',
                      ].join(' ')}
                    >
                      <div className={[
                        'w-4 h-4 bg-white rounded-full mt-0.5 transition-transform',
                        state ? 'translate-x-4' : 'translate-x-0.5',
                      ].join(' ')} />
                    </div>
                    <span className="font-jost text-xs text-nex-grey group-hover:text-nex-white transition-colors">
                      {label}
                    </span>
                  </label>
                ))}

                <a
                  href={pdfUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setPdfOpen(false)}
                  className="block w-full text-center bg-nex-green text-nex-black font-jost font-bold text-sm py-2 rounded-lg hover:bg-nex-green/90 transition-colors mt-1"
                >
                  Descargar PDF
                </a>
              </div>
            )}
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-nex-green text-nex-black font-jost font-bold text-sm py-2.5 px-6 rounded-lg disabled:opacity-40 hover:bg-nex-green/90 transition-colors"
          >
            {saving ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </div>
      </div>

    </div>
  )
}

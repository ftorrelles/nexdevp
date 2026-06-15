'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface QuoteRow {
  id:          string
  title:       string
  tipo:        string
  product:     string
  region:      string
  status:      'draft' | 'sent' | 'accepted' | 'rejected'
  total_hours: number
  total_price: number
  maint_month: number
  created_at:  string
}

const STATUS_STYLES: Record<QuoteRow['status'], string> = {
  draft:    'text-nex-grey    bg-white/5       border-white/20',
  sent:     'text-blue-400   bg-blue-400/10   border-blue-400/30',
  accepted: 'text-nex-green  bg-nex-green/10  border-nex-green/30',
  rejected: 'text-red-400    bg-red-400/10    border-red-400/30',
}

const STATUS_LABELS: Record<QuoteRow['status'], string> = {
  draft:    'Borrador',
  sent:     'Enviado',
  accepted: 'Aceptado',
  rejected: 'Rechazado',
}

const REGION_SYMBOL: Record<string, string> = {
  españa: '€',
  eeuu:   '$',
  latam:  '$',
}

function fmt(n: number, region: string) {
  const currency = region === 'españa' ? 'EUR' : 'USD'
  return n.toLocaleString('es-ES', { style: 'currency', currency, maximumFractionDigits: 0 })
}

interface Props { quotes: QuoteRow[] }

export function QuotesList({ quotes: initial }: Props) {
  const router = useRouter()
  const [quotes, setQuotes] = useState(initial)
  const [deleting, setDeleting] = useState<string | null>(null)

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este presupuesto?')) return
    setDeleting(id)
    const res = await fetch(`/api/cotizador/quotes/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setQuotes(prev => prev.filter(q => q.id !== id))
    }
    setDeleting(null)
  }

  if (quotes.length === 0) {
    return (
      <div className="bg-nex-dark border border-white/10 rounded-2xl p-12 text-center">
        <p className="font-jost text-nex-grey text-sm mb-5">
          Todavía no hay presupuestos guardados.
        </p>
        <Link
          href="/admin/cotizador/nueva"
          className="inline-block bg-nex-green text-nex-black font-jost font-bold text-sm py-2.5 px-6 rounded-lg hover:bg-nex-green/90 transition-colors"
        >
          Crear la primera cotización
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {quotes.map(q => (
        <div
          key={q.id}
          className="bg-nex-dark border border-white/10 rounded-xl px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-4 hover:border-white/20 transition-colors"
        >
          {/* Main info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={[
                'font-dm-mono text-[10px] uppercase tracking-[0.1em] rounded-full border px-2 py-0.5 shrink-0',
                STATUS_STYLES[q.status],
              ].join(' ')}>
                {STATUS_LABELS[q.status]}
              </span>
              <h2 className="font-jost font-bold text-sm text-nex-white truncate">{q.title}</h2>
            </div>
            <p className="font-jost text-xs text-nex-grey">
              {q.tipo} · {q.product} · {q.region.charAt(0).toUpperCase() + q.region.slice(1)} ·{' '}
              {new Date(q.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
            </p>
          </div>

          {/* Price summary */}
          <div className="flex items-center gap-6 shrink-0">
            <div className="text-right">
              <p className="font-dm-mono text-xs text-nex-grey">Proyecto</p>
              <p className="font-jost font-bold text-nex-green text-base">{fmt(q.total_price, q.region)}</p>
            </div>
            <div className="text-right hidden sm:block">
              <p className="font-dm-mono text-xs text-nex-grey">Mant./mes</p>
              <p className="font-jost text-sm text-nex-white">{fmt(q.maint_month, q.region)}</p>
            </div>
            <div className="text-right hidden sm:block">
              <p className="font-dm-mono text-xs text-nex-grey">Horas</p>
              <p className="font-jost text-sm text-nex-white">{q.total_hours}h</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href={`/admin/cotizador/${q.id}`}
              className="font-jost text-xs text-nex-grey hover:text-nex-white border border-white/10 hover:border-white/30 rounded-lg px-3 py-1.5 transition-colors"
            >
              Ver / editar
            </Link>
            <button
              onClick={() => handleDelete(q.id)}
              disabled={deleting === q.id}
              className="font-jost text-xs text-nex-grey hover:text-red-400 border border-white/10 hover:border-red-400/30 rounded-lg px-3 py-1.5 transition-colors disabled:opacity-40"
            >
              {deleting === q.id ? '…' : 'Eliminar'}
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

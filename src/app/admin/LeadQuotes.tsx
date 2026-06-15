'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface QuoteRow {
  id:          string
  title:       string
  status:      'draft' | 'sent' | 'accepted' | 'rejected'
  region:      string
  total_price: number
  total_hours: number
}

const STATUS_LABELS: Record<QuoteRow['status'], string> = {
  draft:    'Borrador',
  sent:     'Enviado',
  accepted: 'Aceptado',
  rejected: 'Rechazado',
}

const STATUS_STYLES: Record<QuoteRow['status'], string> = {
  draft:    'text-nex-grey  bg-white/5      border-white/20',
  sent:     'text-blue-400  bg-blue-400/10  border-blue-400/30',
  accepted: 'text-nex-green bg-nex-green/10 border-nex-green/30',
  rejected: 'text-red-400   bg-red-400/10   border-red-400/30',
}

const REGION_CURRENCY: Record<string, string> = { españa: 'EUR', eeuu: 'USD', latam: 'USD' }

function fmt(n: number, region: string) {
  return n.toLocaleString('es-ES', {
    style: 'currency',
    currency: REGION_CURRENCY[region] ?? 'EUR',
    maximumFractionDigits: 0,
  })
}

export function LeadQuotes({ leadId }: { leadId: string }) {
  const [quotes, setQuotes] = useState<QuoteRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/cotizador/quotes?lead_id=${leadId}`)
      .then(r => r.json())
      .then(d => setQuotes(d.quotes ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [leadId])

  return (
    <div className="mt-4 pt-4 border-t border-white/5">
      <div className="flex items-center justify-between mb-3">
        <p className="font-dm-mono text-[10px] tracking-[0.15em] uppercase text-nex-green">
          Presupuestos
        </p>
        <Link
          href={`/admin/cotizador/nueva?lead_id=${leadId}`}
          onClick={e => e.stopPropagation()}
          className="font-jost text-xs text-nex-grey hover:text-nex-green transition-colors"
        >
          + Nueva cotización
        </Link>
      </div>

      {loading ? (
        <p className="font-jost text-xs text-nex-grey animate-pulse">Cargando…</p>
      ) : quotes.length === 0 ? (
        <p className="font-jost text-xs text-nex-grey italic">Sin presupuestos vinculados.</p>
      ) : (
        <div className="space-y-2">
          {quotes.map(q => (
            <div key={q.id} className="flex items-center justify-between gap-4 bg-nex-black rounded-lg px-3 py-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className={[
                  'font-dm-mono text-[9px] uppercase tracking-wider rounded-full border px-2 py-0.5 shrink-0',
                  STATUS_STYLES[q.status],
                ].join(' ')}>
                  {STATUS_LABELS[q.status]}
                </span>
                <span className="font-jost text-xs text-nex-white truncate">{q.title}</span>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                <span className="font-jost text-xs font-bold text-nex-green">{fmt(q.total_price, q.region)}</span>
                <span className="font-dm-mono text-xs text-nex-grey">{q.total_hours}h</span>
                <Link
                  href={`/admin/cotizador/${q.id}`}
                  onClick={e => e.stopPropagation()}
                  className="font-jost text-xs text-nex-grey hover:text-nex-white transition-colors underline"
                >
                  Editar
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { CommissionType } from '@/lib/supabase'
import type { BudgetSplit, DeliverablePayout } from '@/lib/budget'

const COMMISSION_LABEL: Record<CommissionType, string> = {
  nexdevp_pool: 'Lead del pool',
  own_lead:     'Lead propio',
}

const STATUS_LABEL: Record<string, string> = {
  activo: 'Activo', pausado: 'Pausado', entregado: 'Entregado', cerrado: 'Cerrado',
}

function fmt(n: number, currency = 'EUR') {
  return n.toLocaleString('es-ES', { style: 'currency', currency, maximumFractionDigits: 0 })
}
const pct = (r: number) => `${Math.round(r * 1000) / 10}%`

interface Props {
  project:  { id: string; name: string; status: string; leads: { nombre: string | null; canal: string | null } | null }
  split:    BudgetSplit
  payouts:  DeliverablePayout[]
  currency: string
  frozen:   boolean
  isStaff:  boolean
  userMap:  Record<string, string>
  userId:   string
}

export function ProjectBudgetCard({ project: p, split, payouts, currency, frozen, isStaff, userMap, userId }: Props) {
  const [open, setOpen] = useState(false)

  const mine = isStaff ? payouts : payouts.filter(x => x.assigned_to === userId)

  const SEGMENTS = [
    { label: 'Comisión', rate: split.commission_rate, value: split.commission_amount, bar: 'bg-blue-400',    ring: 'ring-blue-400/40'    },
    { label: 'Empresa',  rate: split.margin_rate,     value: split.margin_amount,     bar: 'bg-yellow-400', ring: 'ring-yellow-400/40'  },
    { label: 'Desarrollo', rate: split.dev_rate,      value: split.dev_pool,          bar: 'bg-nex-green',  ring: 'ring-nex-green/40'   },
  ]

  return (
    <div className="bg-nex-dark border border-nex-ink/10 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-nex-ink/5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <Link
              href={`/admin/proyectos/${p.id}`}
              className="font-jost font-bold text-sm text-nex-white hover:text-nex-green transition-colors"
            >
              {p.name}
            </Link>
            <p className="font-jost text-xs text-nex-grey mt-0.5">
              {p.leads?.nombre ?? 'Sin lead'} · {STATUS_LABEL[p.status] ?? p.status}
              {' · '}
              {COMMISSION_LABEL[split.commission_type]}
              {!frozen && <span className="text-nex-grey/50"> · reparto estimado</span>}
            </p>
          </div>
          <p className="font-jost font-bold text-lg text-nex-white shrink-0">
            {fmt(split.contract_value, currency)}
          </p>
        </div>

        {/* Split bar — staff only */}
        {isStaff && split.contract_value > 0 && (
          <div className="mt-4">
            {/* Bar */}
            <div className="flex h-3 rounded-full overflow-hidden bg-nex-ink/10">
              {SEGMENTS.map(s => (
                <div key={s.label} style={{ width: `${s.rate * 100}%` }} className={s.bar} />
              ))}
            </div>

            {/* Legend — proportional under each segment */}
            <div className="flex mt-2.5">
              {SEGMENTS.map(s => (
                <div key={s.label} style={{ width: `${s.rate * 100}%` }} className="min-w-0 pr-2">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2.5 h-2.5 rounded-full shrink-0 ring-2 ${s.bar} ${s.ring}`} />
                    <span className="font-dm-mono text-[9px] uppercase tracking-wider text-nex-grey truncate">
                      {s.label} {pct(s.rate)}
                    </span>
                  </div>
                  <p className="font-jost text-sm text-nex-white mt-0.5 pl-4">{fmt(s.value, currency)}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Phases — expandable */}
      {mine.length > 0 && (
        <>
          <button
            onClick={() => setOpen(v => !v)}
            className="w-full flex items-center justify-between px-5 py-2.5 text-left hover:bg-white/[0.02] transition-colors"
          >
            <span className="font-dm-mono text-[10px] uppercase tracking-[0.1em] text-nex-grey">
              {mine.length} fase{mine.length !== 1 ? 's' : ''}
            </span>
            <span className="text-nex-grey text-xs">{open ? '▲' : '▼'}</span>
          </button>

          {open && (
            <div className="divide-y divide-nex-ink/5 border-t border-nex-ink/5">
              {mine.map(x => (
                <div key={x.deliverable_id} className="flex items-center gap-3 px-5 py-2.5">
                  <span className={[
                    'w-1.5 h-1.5 rounded-full shrink-0',
                    x.earned ? 'bg-nex-green' : 'bg-nex-ink/30',
                  ].join(' ')} />
                  <span className="font-jost text-xs text-nex-white flex-1 truncate">{x.name}</span>
                  {isStaff && (
                    <span className="font-jost text-[10px] text-nex-grey shrink-0 hidden sm:block max-w-[160px] truncate">
                      {x.assigned_to ? (userMap[x.assigned_to] ?? x.assigned_to) : 'Sin asignar'}
                    </span>
                  )}
                  <span className={[
                    'font-jost text-xs shrink-0 w-24 text-right',
                    x.earned ? 'font-bold text-nex-green' : 'text-nex-grey',
                  ].join(' ')}>
                    {fmt(x.payout, currency)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

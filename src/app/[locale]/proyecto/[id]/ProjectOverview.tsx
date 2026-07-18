'use client'

import { useState } from 'react'
import { computeProgressPct } from '@/lib/projects'
import type { Locale } from '@/content/types'
import { DeliverableThread } from './DeliverableThread'

type DeliverableRow = { id: string; name: string; status: string; hours: number; sort_order: number }
type CommentRow = { id: string; body: string; kind: string; author_role: string; created_at: string; deliverable_id: string }

interface Props {
  initialDeliverables: DeliverableRow[]
  projectId: string
  commentsByDeliverable: Record<string, CommentRow[]>
  locale: Locale
}

const DELIVERABLE_STATUS_LABELS: Record<Locale, Record<string, string>> = {
  es: {
    pendiente: 'Por iniciar',
    en_curso: 'En desarrollo',
    en_revision: 'En revisión',
    aprobado: 'Completado',
    cambios_solicitados: 'Ajustes en curso',
  },
  en: {
    pendiente: 'Not started',
    en_curso: 'In development',
    en_revision: 'Under review',
    aprobado: 'Completed',
    cambios_solicitados: 'Adjustments in progress',
  },
}

const DELIVERABLE_STATUS_COLORS: Record<string, string> = {
  pendiente: 'text-nex-grey bg-nex-ink/5 border-nex-ink/20',
  en_curso: 'text-blue-400 bg-blue-400/10 border-blue-400/30',
  en_revision: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30',
  aprobado: 'text-nex-green bg-nex-green/10 border-nex-green/30',
  cambios_solicitados: 'text-red-400 bg-red-400/10 border-red-400/30',
}

// Owns the deliverables list as client state so approving / requesting changes
// (handled inside each DeliverableThread) immediately reflects in the overall
// progress bar and each deliverable's status badge, without a page reload.
export function ProjectOverview({ initialDeliverables, projectId, commentsByDeliverable, locale: loc }: Props) {
  const [deliverables, setDeliverables] = useState(initialDeliverables)

  const pct = computeProgressPct(deliverables)
  const progressColor = pct === 100 ? 'bg-nex-green' : pct >= 50 ? 'bg-blue-400' : 'bg-yellow-400'

  function handleStatusChange(deliverableId: string, status: string) {
    setDeliverables((prev) => prev.map((d) => (d.id === deliverableId ? { ...d, status } : d)))
  }

  return (
    <>
      <div className="bg-nex-dark border border-nex-ink/10 rounded-xl p-6 mt-6">
        <p className="font-dm-mono text-[10px] uppercase tracking-[0.1em] text-nex-grey mb-2">
          {loc === 'es' ? 'Progreso general' : 'Overall progress'}
        </p>
        <div className="flex items-center gap-3">
          <div className="flex-1 h-2 bg-nex-ink/10 rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${progressColor} transition-all`} style={{ width: `${pct}%` }} />
          </div>
          <span className="font-jost font-bold text-lg text-nex-white">{pct}%</span>
        </div>
      </div>

      <div className="bg-nex-dark border border-nex-ink/10 rounded-xl p-6 mt-6">
        <p className="font-dm-mono text-[10px] tracking-[0.15em] uppercase text-nex-green mb-4">
          {loc === 'es' ? 'Entregables' : 'Deliverables'}
        </p>

        {deliverables.length === 0 ? (
          <p className="font-jost text-sm text-nex-grey italic py-4 text-center">
            {loc === 'es'
              ? 'Todavía no hay entregables cargados.'
              : 'No deliverables have been added yet.'}
          </p>
        ) : (
          <div className="space-y-4">
            {deliverables.map((d) => (
              <div
                key={d.id}
                className="bg-nex-black rounded-xl border border-nex-ink/10 overflow-hidden"
              >
                {/* Header row */}
                <div className="flex items-center justify-between gap-4 px-4 py-3">
                  <p className="font-jost text-sm text-nex-white">{d.name}</p>
                  <span className={[
                    'font-dm-mono text-[10px] uppercase tracking-wider rounded-full border px-2.5 py-0.5 shrink-0',
                    DELIVERABLE_STATUS_COLORS[d.status] ?? DELIVERABLE_STATUS_COLORS.pendiente,
                  ].join(' ')}>
                    {DELIVERABLE_STATUS_LABELS[loc][d.status] ?? d.status}
                  </span>
                </div>

                {/* Comment thread */}
                <DeliverableThread
                  deliverable={d}
                  projectId={projectId}
                  initialComments={commentsByDeliverable[d.id] ?? []}
                  locale={loc}
                  onStatusChange={(status) => handleStatusChange(d.id, status)}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}

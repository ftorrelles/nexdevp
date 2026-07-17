'use client'

import { useState } from 'react'
import type { Locale } from '@/content/types'

interface DeliverableData {
  id: string
  name: string
  status: string
}

interface CommentData {
  id: string
  body: string
  kind: string
  author_role: string
  created_at: string
}

interface Props {
  deliverable: DeliverableData
  projectId: string
  initialComments: CommentData[]
  locale: Locale
}

const STATUS_BANNERS: Record<Locale, Record<string, string>> = {
  es: {
    aprobado: '✅ Aprobaste este entregable',
    cambios_solicitados: '🔄 Solicitaste cambios en este entregable',
  },
  en: {
    aprobado: '✅ You approved this deliverable',
    cambios_solicitados: '🔄 You requested changes on this deliverable',
  },
}

export function DeliverableThread({ deliverable, projectId, initialComments, locale: loc }: Props) {
  const [comments, setComments] = useState<CommentData[]>(initialComments)
  const [body, setBody] = useState('')
  const [posting, setPosting] = useState(false)
  const [actionKind, setActionKind] = useState<string | null>(null)

  const isEnRevision = deliverable.status === 'en_revision'
  const isTerminal = deliverable.status === 'aprobado' || deliverable.status === 'cambios_solicitados'

  async function postComment(kind: string) {
    if (!body.trim() && kind === 'comentario') return
    setPosting(true)
    setActionKind(kind)
    try {
      const res = await fetch(`/api/proyectos/${projectId}/deliverables/${deliverable.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: kind === 'comentario' ? body : body || '—', kind }),
      })
      if (res.ok) {
        const created: CommentData = await res.json()
        setComments((prev) => [...prev, created])
        if (kind === 'comentario') setBody('')
      }
    } finally {
      setPosting(false)
      setActionKind(null)
    }
  }

  function formatDate(iso: string): string {
    try {
      return new Date(iso).toLocaleDateString(loc === 'es' ? 'es-AR' : 'en-US', {
        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
      })
    } catch {
      return iso
    }
  }

  function authorLabel(role: string): string {
    if (role === 'client') return loc === 'es' ? 'Vos' : 'You'
    return 'nexdevp'
  }

  function kindLabel(kind: string): string {
    if (kind === 'aprobacion') return loc === 'es' ? 'Aprobación' : 'Approval'
    if (kind === 'cambios') return loc === 'es' ? 'Cambios solicitados' : 'Changes requested'
    return loc === 'es' ? 'Comentario' : 'Comment'
  }

  return (
    <div className="mt-4 space-y-3">
      {/* Comment list */}
      {comments.length > 0 && (
        <div className="space-y-2">
          {comments.map((c) => (
            <div key={c.id} className="bg-nex-black/50 rounded-lg px-4 py-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-dm-mono text-[10px] uppercase tracking-wider text-nex-green">{authorLabel(c.author_role)}</span>
                <span className="font-dm-mono text-[9px] uppercase tracking-wider text-nex-grey">{kindLabel(c.kind)}</span>
                <span className="font-dm-mono text-[9px] text-nex-grey ml-auto">{formatDate(c.created_at)}</span>
              </div>
              <p className="font-jost text-sm text-nex-white whitespace-pre-wrap">{c.body}</p>
            </div>
          ))}
        </div>
      )}

      {/* Action buttons — only when en_revision */}
      {isEnRevision && (
        <div className="flex items-center gap-2">
          <button
            onClick={() => postComment('aprobacion')}
            disabled={posting}
            className="font-jost font-bold text-sm bg-nex-green text-nex-black px-4 py-2 rounded-lg disabled:opacity-40 hover:bg-nex-green/90 transition-colors"
          >
            {posting && actionKind === 'aprobacion' ? '…' : loc === 'es' ? '✅ Aprobar' : '✅ Approve'}
          </button>
          <button
            onClick={() => postComment('cambios')}
            disabled={posting}
            className="font-jost font-bold text-sm bg-yellow-400 text-nex-black px-4 py-2 rounded-lg disabled:opacity-40 hover:bg-yellow-400/90 transition-colors"
          >
            {posting && actionKind === 'cambios' ? '…' : loc === 'es' ? '🔄 Pedir cambios' : '🔄 Request changes'}
          </button>
        </div>
      )}

      {/* Read-only banner for terminal statuses */}
      {isTerminal && (
        <div className="bg-nex-black/50 rounded-lg px-4 py-3">
          <p className="font-jost text-sm text-nex-white">
            {STATUS_BANNERS[loc][deliverable.status] ?? deliverable.status}
          </p>
        </div>
      )}

      {/* Comment textarea + send — always available */}
      <div className="flex items-start gap-2">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={loc === 'es' ? 'Escribí un comentario…' : 'Write a comment…'}
          rows={2}
          className="flex-1 bg-nex-black border border-white/10 rounded-lg px-3 py-2 text-sm text-nex-white focus:outline-none focus:border-nex-green/50 transition-colors resize-none"
        />
        <button
          onClick={() => postComment('comentario')}
          disabled={posting || !body.trim()}
          className="font-jost font-bold text-sm bg-nex-green text-nex-black px-4 py-2 rounded-lg disabled:opacity-40 hover:bg-nex-green/90 transition-colors shrink-0"
        >
          {posting && actionKind === 'comentario' ? '…' : loc === 'es' ? 'Enviar' : 'Send'}
        </button>
      </div>
    </div>
  )
}

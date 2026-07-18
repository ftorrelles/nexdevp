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
    aprobado: 'Aprobaste este entregable',
    cambios_solicitados: 'Solicitaste cambios en este entregable',
  },
  en: {
    aprobado: 'You approved this deliverable',
    cambios_solicitados: 'You requested changes on this deliverable',
  },
}

export function DeliverableThread({ deliverable, projectId, initialComments, locale: loc }: Props) {
  const [comments, setComments]       = useState<CommentData[]>(initialComments)
  const [open, setOpen]               = useState(initialComments.length > 0)
  const [body, setBody]               = useState('')
  const [posting, setPosting]         = useState(false)
  const [actionKind, setActionKind]   = useState<string | null>(null)
  const [currentStatus, setCurrentStatus] = useState(deliverable.status)

  const isEnRevision = currentStatus === 'en_revision'
  const isTerminal   = currentStatus === 'aprobado' || currentStatus === 'cambios_solicitados'

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
        if (kind === 'aprobacion') setCurrentStatus('aprobado')
        if (kind === 'cambios')    setCurrentStatus('cambios_solicitados')
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
    } catch { return iso }
  }

  function authorLabel(role: string): string {
    return role === 'client' ? (loc === 'es' ? 'Vos' : 'You') : 'nexdevp'
  }

  function kindLabel(kind: string): string {
    if (kind === 'aprobacion') return loc === 'es' ? 'Aprobación' : 'Approval'
    if (kind === 'cambios')    return loc === 'es' ? 'Cambios solicitados' : 'Changes requested'
    return loc === 'es' ? 'Comentario' : 'Comment'
  }

  const commentCount = comments.length

  return (
    <div className="border-t border-nex-ink/5">
      {/* Collapse toggle */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-nex-ink/3 transition-colors group"
      >
        <span className="flex items-center gap-2 font-dm-mono text-[10px] uppercase tracking-wider text-nex-grey group-hover:text-nex-white transition-colors">
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M14 2H2a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h3l3 3 3-3h3a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1z" />
          </svg>
          {commentCount > 0
            ? (loc === 'es' ? `${commentCount} comentario${commentCount !== 1 ? 's' : ''}` : `${commentCount} comment${commentCount !== 1 ? 's' : ''}`)
            : (loc === 'es' ? 'Comentar' : 'Comment')}
          {isEnRevision && (
            <span className="ml-1 text-yellow-400 normal-case tracking-normal font-jost font-semibold text-[11px]">
              · {loc === 'es' ? 'en revisión' : 'under review'}
            </span>
          )}
        </span>
        <svg
          width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5"
          strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
          className={`text-nex-grey transition-transform ${open ? 'rotate-180' : ''}`}
        >
          <path d="M2 4l4 4 4-4" />
        </svg>
      </button>

      {/* Expanded content */}
      {open && (
        <div className="px-4 pb-4 space-y-3">
          {/* Comments */}
          {comments.length > 0 && (
            <div className="space-y-2">
              {comments.map((c) => (
                <div
                  key={c.id}
                  className={`rounded-lg px-3 py-2.5 ${c.author_role === 'client' ? 'bg-nex-green/5 border border-nex-green/15' : 'bg-nex-ink/3 border border-nex-ink/8'}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`font-dm-mono text-[10px] uppercase tracking-wider ${c.author_role === 'client' ? 'text-nex-green' : 'text-nex-grey'}`}>
                      {authorLabel(c.author_role)}
                    </span>
                    <span className="font-dm-mono text-[9px] uppercase tracking-wider text-nex-grey/60">{kindLabel(c.kind)}</span>
                    <span className="font-dm-mono text-[9px] text-nex-grey/60 ml-auto">{formatDate(c.created_at)}</span>
                  </div>
                  <p className="font-jost text-sm text-nex-white whitespace-pre-wrap">{c.body}</p>
                </div>
              ))}
            </div>
          )}

          {/* Approve / request changes — en_revision only */}
          {isEnRevision && (
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => postComment('aprobacion')}
                disabled={posting}
                className="font-jost font-bold text-xs bg-nex-green text-nex-black px-3 py-1.5 rounded-lg disabled:opacity-40 hover:bg-nex-green/90 transition-colors"
              >
                {posting && actionKind === 'aprobacion' ? '…' : (loc === 'es' ? 'Aprobar' : 'Approve')}
              </button>
              <button
                onClick={() => postComment('cambios')}
                disabled={posting}
                className="font-jost font-bold text-xs bg-yellow-400/10 text-yellow-400 border border-yellow-400/30 px-3 py-1.5 rounded-lg disabled:opacity-40 hover:bg-yellow-400/20 transition-colors"
              >
                {posting && actionKind === 'cambios' ? '…' : (loc === 'es' ? 'Pedir cambios' : 'Request changes')}
              </button>
            </div>
          )}

          {/* Terminal status banner */}
          {isTerminal && (
            <p className={`font-jost text-xs px-3 py-2 rounded-lg border ${
              currentStatus === 'aprobado'
                ? 'text-nex-green bg-nex-green/5 border-nex-green/20'
                : 'text-yellow-400 bg-yellow-400/5 border-yellow-400/20'
            }`}>
              {STATUS_BANNERS[loc][currentStatus] ?? currentStatus}
            </p>
          )}

          {/* Comment input */}
          <div className="flex items-stretch gap-2">
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={loc === 'es' ? 'Escribí un comentario…' : 'Write a comment…'}
              rows={2}
              className="flex-1 bg-nex-black border border-nex-ink/10 rounded-lg px-3 py-2 text-sm text-nex-white placeholder-nex-grey/50 focus:outline-none focus:border-nex-green/40 transition-colors resize-none"
            />
            <button
              onClick={() => postComment('comentario')}
              disabled={posting || !body.trim()}
              className="font-jost font-bold text-xs bg-nex-green text-nex-black px-4 rounded-lg disabled:opacity-30 hover:bg-nex-green/90 transition-colors shrink-0"
            >
              {posting && actionKind === 'comentario' ? '…' : (loc === 'es' ? 'Enviar' : 'Send')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

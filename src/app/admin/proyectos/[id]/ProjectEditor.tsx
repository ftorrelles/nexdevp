'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { UserRole } from '@/lib/supabase'

interface CommentData {
  id: string
  body: string
  kind: string
  author_role: string
  created_at: string
}

interface ProjectData {
  id: string
  name: string
  status: string
  vercel_url: string | null
  progress_pct: number
  deliverables: DeliverableData[]
}

interface DeliverableData {
  id: string
  name: string
  hours: number
  status: string
  assigned_to: string | null
  sort_order: number
}

interface Props {
  project: ProjectData
  role: UserRole
  vendorUsers: { id: string; email: string }[]
  clientEmail: string | null
  leadEmail: string | null
}

const STATUS_OPTIONS = ['activo', 'pausado', 'entregado', 'cerrado']
const STATUS_LABELS: Record<string, string> = {
  activo: 'Activo',
  pausado: 'Pausado',
  entregado: 'Entregado',
  cerrado: 'Cerrado',
}

const DELIVERABLE_STATUS_OPTIONS = [
  'pendiente',
  'en_curso',
  'en_revision',
  'aprobado',
  'cambios_solicitados',
]
const DELIVERABLE_STATUS_LABELS: Record<string, string> = {
  pendiente: 'Pendiente',
  en_curso: 'En curso',
  en_revision: 'En revisión',
  aprobado: 'Aprobado',
  cambios_solicitados: 'Cambios solicitados',
}

const DELIVERABLE_STATUS_COLORS: Record<string, string> = {
  pendiente: 'text-nex-grey bg-white/5 border-white/20',
  en_curso: 'text-blue-400 bg-blue-400/10 border-blue-400/30',
  en_revision: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30',
  aprobado: 'text-nex-green bg-nex-green/10 border-nex-green/30',
  cambios_solicitados: 'text-red-400 bg-red-400/10 border-red-400/30',
}

const canEdit = (role: UserRole) => role === 'owner' || role === 'supervisor'
const STATUS_COLORS: Record<string, string> = {
  activo: 'text-nex-green bg-nex-green/10 border-nex-green/30',
  pausado: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30',
  entregado: 'text-blue-400 bg-blue-400/10 border-blue-400/30',
  cerrado: 'text-nex-grey bg-white/5 border-white/20',
}

function formatCommentDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('es-AR', {
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
    })
  } catch {
    return iso
  }
}

function ProgressBar({ pct }: { pct: number }) {
  const color =
    pct === 100 ? 'bg-nex-green' : pct >= 50 ? 'bg-blue-400' : 'bg-yellow-400'
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="font-jost font-bold text-lg text-nex-white w-10 text-right">{pct}%</span>
    </div>
  )
}

export function ProjectEditor({ project: initial, role, vendorUsers, clientEmail, leadEmail }: Props) {
  const router = useRouter()
  const [project, setProject] = useState(initial)
  const [deliverables, setDeliverables] = useState(initial.deliverables)
  const [saving, setSaving] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const [newHours, setNewHours] = useState('')

  const isEditable = canEdit(role)

  async function updateProject(field: string, value: string) {
    setSaving('project')
    try {
      const res = await fetch(`/api/proyectos/${project.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      })
      if (res.ok) {
        setProject((prev) => ({ ...prev, [field]: value }))
      }
    } finally {
      setSaving(null)
    }
  }

  async function updateDeliverable(id: string, field: string, value: string | number | null) {
    setSaving(id)
    try {
      const res = await fetch(`/api/proyectos/${project.id}/deliverables/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      })
      if (res.ok) {
        setDeliverables((prev) =>
          prev.map((d) => (d.id === id ? { ...d, [field]: value } : d))
        )
      }
    } finally {
      setSaving(null)
    }
  }

  async function deleteDeliverable(id: string) {
    if (!confirm('¿Eliminar este entregable?')) return
    setSaving(id)
    try {
      const res = await fetch(`/api/proyectos/${project.id}/deliverables/${id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setDeliverables((prev) => prev.filter((d) => d.id !== id))
      }
    } finally {
      setSaving(null)
    }
  }

  async function addDeliverable() {
    if (!newName) return
    setAdding(true)
    try {
      const res = await fetch(`/api/proyectos/${project.id}/deliverables`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName,
          hours: parseInt(newHours) || 0,
          sort_order: deliverables.length,
        }),
      })
      if (res.ok) {
        const created = await res.json()
        setDeliverables((prev) => [...prev, created])
        setNewName('')
        setNewHours('')
      }
    } finally {
      setAdding(false)
    }
  }

  const [openComments, setOpenComments] = useState<Record<string, boolean>>({})
  const [commentsData, setCommentsData] = useState<Record<string, CommentData[]>>({})
  const [commentBodies, setCommentBodies] = useState<Record<string, string>>({})
  const [postingComment, setPostingComment] = useState<string | null>(null)

  async function fetchComments(deliverableId: string) {
    if (commentsData[deliverableId]) return
    try {
      const res = await fetch(`/api/proyectos/${project.id}/deliverables/${deliverableId}/comments`)
      if (res.ok) {
        const data: CommentData[] = await res.json()
        setCommentsData((prev) => ({ ...prev, [deliverableId]: data }))
      }
    } catch {
      // silent
    }
  }

  async function postComment(deliverableId: string) {
    const body = commentBodies[deliverableId]
    if (!body?.trim()) return
    setPostingComment(deliverableId)
    try {
      const res = await fetch(`/api/proyectos/${project.id}/deliverables/${deliverableId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body, kind: 'comentario' }),
      })
      if (res.ok) {
        const created = await res.json()
        setCommentsData((prev) => ({
          ...prev,
          [deliverableId]: [...(prev[deliverableId] ?? []), created],
        }))
        setCommentBodies((prev) => ({ ...prev, [deliverableId]: '' }))
      }
    } finally {
      setPostingComment(null)
    }
  }

  const toggleComments = useCallback(async (deliverableId: string) => {
    setOpenComments((prev) => {
      const next = { ...prev, [deliverableId]: !prev[deliverableId] }
      return next
    })
    if (!commentsData[deliverableId]) {
      await fetchComments(deliverableId)
    }
  }, [project.id, commentsData])

  const [inviting, setInviting] = useState(false)
  const [inviteMsg, setInviteMsg] = useState<string | null>(null)
  const [invitedEmail, setInvitedEmail] = useState<string | null>(null)

  async function inviteClient() {
    setInviting(true)
    setInviteMsg(null)
    try {
      const res = await fetch(`/api/proyectos/${project.id}/invite-client`, { method: 'POST' })
      const body = await res.json()
      if (res.ok) {
        setInvitedEmail(body.email)
        setInviteMsg('Invitación enviada correctamente.')
      } else {
        setInviteMsg(body.error ?? 'Error al enviar invitación.')
      }
    } catch {
      setInviteMsg('Error de conexión.')
    } finally {
      setInviting(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Project header */}
      <div className="bg-nex-dark border border-white/10 rounded-xl p-6 space-y-6">
        <div>
          <p className="font-dm-mono text-[10px] tracking-[0.15em] uppercase text-nex-green mb-1">Proyecto</p>
          <h1 className="font-jost font-bold text-2xl text-nex-white">{project.name}</h1>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Status */}
          <div>
            <label className="block font-dm-mono text-[10px] uppercase tracking-[0.1em] text-nex-grey mb-1.5">Estado</label>
            {isEditable ? (
              <select
                value={project.status}
                disabled={saving === 'project'}
                onChange={(e) => updateProject('status', e.target.value)}
                className={[
                  'font-dm-mono text-[10px] tracking-[0.1em] uppercase rounded px-2.5 py-1.5 border outline-none cursor-pointer disabled:opacity-50',
                  STATUS_COLORS[project.status] ?? STATUS_COLORS.activo,
                ].join(' ')}
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt} value={opt} className="bg-nex-dark text-nex-white">{STATUS_LABELS[opt]}</option>
                ))}
              </select>
            ) : (
              <span className={[
                'font-dm-mono text-[10px] uppercase tracking-wider rounded-full border px-2.5 py-1',
                STATUS_COLORS[project.status] ?? STATUS_COLORS.activo,
              ].join(' ')}>
                {STATUS_LABELS[project.status] ?? project.status}
              </span>
            )}
          </div>

          {/* Vercel URL */}
          <div className="sm:col-span-2">
            <label className="block font-dm-mono text-[10px] uppercase tracking-[0.1em] text-nex-grey mb-1.5">URL de Vercel</label>
            {isEditable ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  defaultValue={project.vercel_url ?? ''}
                  onBlur={(e) => {
                    const val = e.target.value.trim()
                    if (val !== (project.vercel_url ?? '')) {
                      updateProject('vercel_url', val || '')
                    }
                  }}
                  placeholder="https://..."
                  className="flex-1 bg-nex-black border border-white/10 rounded-lg px-3 py-2 text-sm text-nex-white focus:outline-none focus:border-nex-green/50 transition-colors"
                />
                {project.vercel_url && (
                  <a
                    href={project.vercel_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-jost text-xs text-nex-grey hover:text-nex-green transition-colors underline shrink-0"
                  >
                    Abrir
                  </a>
                )}
              </div>
            ) : project.vercel_url ? (
              <a
                href={project.vercel_url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-jost text-sm text-nex-grey hover:text-nex-green underline transition-colors"
              >
                {project.vercel_url}
              </a>
            ) : (
              <p className="font-jost text-sm text-nex-grey italic">Sin URL</p>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div>
          <p className="font-dm-mono text-[10px] uppercase tracking-[0.1em] text-nex-grey mb-2">Progreso</p>
          <ProgressBar pct={project.progress_pct} />
        </div>
      </div>

      {/* Deliverables */}
      <div className="bg-nex-dark border border-white/10 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <p className="font-dm-mono text-[10px] tracking-[0.15em] uppercase text-nex-green">Entregables</p>
          <span className="font-dm-mono text-[10px] text-nex-grey">
            {deliverables.length} ítem{deliverables.length !== 1 ? 's' : ''}
          </span>
        </div>

        {deliverables.length === 0 ? (
          <p className="font-jost text-sm text-nex-grey italic py-4 text-center">Sin entregables todavía.</p>
        ) : (
          <div className="space-y-2">
            {deliverables.map((d) => (
              <div key={d.id} className="bg-nex-black rounded-lg border border-white/5 overflow-hidden">
                {/* Header row */}
                <div className="flex items-center gap-3 px-4 py-3">
                  <button
                    onClick={() => toggleComments(d.id)}
                    className="font-dm-mono text-[9px] uppercase tracking-wider text-nex-grey hover:text-nex-green transition-colors shrink-0"
                  >
                    {openComments[d.id] ? '▼' : '▶'}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="font-jost text-sm text-nex-white truncate">{d.name}</p>
                  </div>
                  <span className="font-dm-mono text-xs text-nex-grey shrink-0 w-10 text-right">{d.hours}h</span>

                  {isEditable ? (
                    <select
                      value={d.status}
                      disabled={saving === d.id}
                      onChange={(e) => updateDeliverable(d.id, 'status', e.target.value)}
                      className={[
                        'font-dm-mono text-[10px] tracking-[0.1em] uppercase rounded px-2 py-1 border outline-none cursor-pointer disabled:opacity-50 shrink-0',
                        DELIVERABLE_STATUS_COLORS[d.status] ?? DELIVERABLE_STATUS_COLORS.pendiente,
                      ].join(' ')}
                    >
                      {DELIVERABLE_STATUS_OPTIONS.map((opt) => (
                        <option key={opt} value={opt} className="bg-nex-dark text-nex-white">
                          {DELIVERABLE_STATUS_LABELS[opt]}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className={[
                      'font-dm-mono text-[10px] uppercase tracking-wider rounded-full border px-2 py-0.5 shrink-0',
                      DELIVERABLE_STATUS_COLORS[d.status] ?? DELIVERABLE_STATUS_COLORS.pendiente,
                    ].join(' ')}>
                      {DELIVERABLE_STATUS_LABELS[d.status] ?? d.status}
                    </span>
                  )}

                  {isEditable && (
                    <select
                      value={d.assigned_to ?? ''}
                      disabled={saving === d.id}
                      onChange={(e) => updateDeliverable(d.id, 'assigned_to', e.target.value || null)}
                      className="font-dm-mono text-[10px] tracking-[0.1em] uppercase bg-transparent border border-white/10 rounded px-2 py-1 text-nex-grey outline-none cursor-pointer hover:border-white/30 transition-colors disabled:opacity-50 shrink-0 max-w-[140px]"
                    >
                      <option value="" className="bg-nex-dark text-nex-grey">Sin asignar</option>
                      {vendorUsers.map((u) => (
                        <option key={u.id} value={u.id} className="bg-nex-dark text-nex-white">{u.email}</option>
                      ))}
                    </select>
                  )}

                  {isEditable && (
                    <button
                      onClick={() => deleteDeliverable(d.id)}
                      disabled={saving === d.id}
                      className="font-jost text-xs text-nex-grey hover:text-red-400 transition-colors shrink-0 disabled:opacity-40"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Collapsible comments section */}
                {openComments[d.id] && (
                  <div className="border-t border-white/5 px-4 py-3 space-y-3">
                    {(commentsData[d.id] ?? []).length === 0 ? (
                      <p className="font-jost text-xs text-nex-grey italic">Sin comentarios.</p>
                    ) : (
                      <div className="space-y-2">
                        {(commentsData[d.id] ?? []).map((c) => (
                          <div key={c.id} className="bg-nex-dark rounded px-3 py-2">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="font-dm-mono text-[9px] uppercase tracking-wider text-nex-green">
                                {c.author_role === 'client' ? 'Cliente' : c.author_role}
                              </span>
                              <span className="font-dm-mono text-[9px] text-nex-grey ml-auto">
                                {formatCommentDate(c.created_at)}
                              </span>
                            </div>
                            <p className="font-jost text-sm text-nex-white">{c.body}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {isEditable && (
                      <div className="flex items-start gap-2">
                        <input
                          type="text"
                          value={commentBodies[d.id] ?? ''}
                          onChange={(e) => setCommentBodies((prev) => ({ ...prev, [d.id]: e.target.value }))}
                          placeholder="Escribí un comentario…"
                          className="flex-1 bg-nex-dark border border-white/10 rounded-lg px-3 py-2 text-sm text-nex-white focus:outline-none focus:border-nex-green/50 transition-colors"
                          onKeyDown={(e) => { if (e.key === 'Enter') postComment(d.id) }}
                        />
                        <button
                          onClick={() => postComment(d.id)}
                          disabled={postingComment === d.id || !(commentBodies[d.id] ?? '').trim()}
                          className="font-jost font-bold text-sm bg-nex-green text-nex-black px-4 py-2 rounded-lg disabled:opacity-40 hover:bg-nex-green/90 transition-colors shrink-0"
                        >
                          {postingComment === d.id ? '…' : 'Enviar'}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Add deliverable form — owner/supervisor only */}
        {isEditable && (
          <div className="mt-4 pt-4 border-t border-white/5">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Nombre del entregable"
                className="flex-1 bg-nex-black border border-white/10 rounded-lg px-3 py-2 text-sm text-nex-white focus:outline-none focus:border-nex-green/50 transition-colors"
                onKeyDown={(e) => { if (e.key === 'Enter') addDeliverable() }}
              />
              <input
                type="number"
                value={newHours}
                onChange={(e) => setNewHours(e.target.value)}
                placeholder="Horas"
                min={0}
                className="w-20 bg-nex-black border border-white/10 rounded-lg px-3 py-2 text-sm text-nex-white focus:outline-none focus:border-nex-green/50 transition-colors text-center"
                onKeyDown={(e) => { if (e.key === 'Enter') addDeliverable() }}
              />
              <button
                onClick={addDeliverable}
                disabled={adding || !newName}
                className="font-jost text-sm font-bold bg-nex-green text-nex-black px-4 py-2 rounded-lg disabled:opacity-40 hover:bg-nex-green/90 transition-colors shrink-0"
              >
                {adding ? '…' : '+ Agregar'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Invite client — owner/supervisor only */}
      {isEditable && (
        <div className="bg-nex-dark border border-white/10 rounded-xl p-6">
          <p className="font-dm-mono text-[10px] tracking-[0.15em] uppercase text-nex-green mb-4">
            Cliente
          </p>

          <div className="space-y-3">
            {(invitedEmail ?? clientEmail) ? (
              <p className="font-jost text-sm text-nex-white">
                Usuario invitado:{' '}
                <span className="text-nex-green">{invitedEmail ?? clientEmail}</span>
              </p>
            ) : leadEmail ? (
              <p className="font-jost text-sm text-nex-grey">
                Cliente sin acceso:{' '}
                <span className="text-nex-white">{leadEmail}</span>
              </p>
            ) : (
              <p className="font-jost text-sm text-nex-grey italic">
                El lead no tiene email registrado.
              </p>
            )}

            {leadEmail && (
              <div>
                <button
                  onClick={inviteClient}
                  disabled={inviting}
                  className="font-jost font-bold text-sm bg-nex-green text-nex-black px-4 py-2 rounded-lg disabled:opacity-40 hover:bg-nex-green/90 transition-colors"
                >
                  {inviting ? '…' : (clientEmail ? 'Re-enviar invitación' : 'Invitar cliente')}
                </button>
                {inviteMsg && (
                  <p className="font-jost text-xs text-nex-grey mt-2">{inviteMsg}</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

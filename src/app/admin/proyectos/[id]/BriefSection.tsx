'use client'

import { useState } from 'react'
import type {
  BriefTemplate,
  ProjectBrief,
  ProjectBriefQuestion,
  ProjectBriefAnswer,
} from '@/lib/supabase'

type BriefWithQuestions = ProjectBrief & {
  project_brief_questions: (ProjectBriefQuestion & {
    project_brief_answers: ProjectBriefAnswer[]
  })[]
}

interface Props {
  projectId: string
  initialBrief: BriefWithQuestions | null
  templates: BriefTemplate[]
  canEdit: boolean        // owner or supervisor
  canEditQuestions: boolean // owner, supervisor, or developer
  clientEmail: string | null
}

const STATUS_LABELS: Record<string, string> = {
  draft: 'Borrador',
  sent: 'Enviado',
  completed: 'Completado',
}

const STATUS_COLORS: Record<string, string> = {
  draft: 'text-nex-grey bg-white/5 border-white/20',
  sent: 'text-blue-400 bg-blue-400/10 border-blue-400/30',
  completed: 'text-nex-green bg-nex-green/10 border-nex-green/30',
}

const FIELD_TYPE_LABELS: Record<string, string> = {
  text: 'Texto',
  textarea: 'Área de texto',
  url: 'URL',
  image: 'Imagen',
  image_multi: 'Imagen (múltiple)',
  boolean: 'Sí / No',
}

const FIELD_TYPE_COLORS: Record<string, string> = {
  text: 'text-nex-grey bg-white/5 border-white/10',
  textarea: 'text-nex-grey bg-white/5 border-white/10',
  url: 'text-blue-400 bg-blue-400/10 border-blue-400/30',
  image: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30',
  image_multi: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30',
  boolean: 'text-purple-400 bg-purple-400/10 border-purple-400/30',
}

// image_multi answers store their paths as a JSON-encoded array in file_path.
function parseMultiPaths(filePath: string | null | undefined): string[] {
  if (!filePath) return []
  try {
    const parsed = JSON.parse(filePath)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

interface InlineQuestionForm {
  label: string
  description: string
  field_type: string
  required: boolean
}

const emptyForm = (): InlineQuestionForm => ({
  label: '',
  description: '',
  field_type: 'text',
  required: false,
})

export function BriefSection({
  projectId,
  initialBrief,
  templates,
  canEdit,
  canEditQuestions,
  clientEmail,
}: Props) {
  const [brief, setBrief] = useState<BriefWithQuestions | null>(initialBrief)
  const [selectedTemplateId, setSelectedTemplateId] = useState('')
  const [assigning, setAssigning] = useState(false)
  const [assignError, setAssignError] = useState<string | null>(null)

  const [sending, setSending] = useState(false)
  const [sendMsg, setSendMsg] = useState<string | null>(null)

  const [deleting, setDeleting] = useState(false)

  const [showAddForm, setShowAddForm] = useState(false)
  const [addForm, setAddForm] = useState<InlineQuestionForm>(emptyForm())
  const [adding, setAdding] = useState(false)

  const [editingQid, setEditingQid] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<InlineQuestionForm>(emptyForm())
  const [savingQid, setSavingQid] = useState<string | null>(null)
  const [deletingQid, setDeletingQid] = useState<string | null>(null)

  // ── Assign brief ────────────────────────────────────────────────────────────
  async function assignBrief() {
    if (!selectedTemplateId) return
    setAssigning(true)
    setAssignError(null)
    try {
      const res = await fetch(`/api/proyectos/${projectId}/brief`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ template_id: selectedTemplateId }),
      })
      if (!res.ok) {
        const data = await res.json()
        setAssignError(data.error ?? 'Error al asignar el brief.')
        return
      }
      // Reload brief via GET
      const getRes = await fetch(`/api/proyectos/${projectId}/brief`)
      if (getRes.ok) {
        const data = await getRes.json()
        setBrief(data)
      }
    } catch {
      setAssignError('Error de conexión.')
    } finally {
      setAssigning(false)
    }
  }

  // ── Send brief to client ────────────────────────────────────────────────────
  async function sendBrief() {
    setSending(true)
    setSendMsg(null)
    try {
      const res = await fetch(`/api/proyectos/${projectId}/brief`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'sent' }),
      })
      if (res.ok) {
        setBrief((prev) => prev ? { ...prev, status: 'sent', sent_at: new Date().toISOString() } : prev)
        setSendMsg('Brief enviado al cliente.')
      } else {
        const data = await res.json()
        setSendMsg(data.error ?? 'Error al enviar.')
      }
    } catch {
      setSendMsg('Error de conexión.')
    } finally {
      setSending(false)
    }
  }

  // ── Delete brief ────────────────────────────────────────────────────────────
  async function deleteBrief() {
    if (!confirm('¿Eliminar el brief? Esta acción no se puede deshacer.')) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/proyectos/${projectId}/brief`, { method: 'DELETE' })
      if (res.status === 204) {
        setBrief(null)
      }
    } catch {
      // silent
    } finally {
      setDeleting(false)
    }
  }

  // ── Add question ────────────────────────────────────────────────────────────
  async function addQuestion() {
    if (!addForm.label.trim()) return
    setAdding(true)
    try {
      const res = await fetch(`/api/proyectos/${projectId}/brief/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          label: addForm.label.trim(),
          description: addForm.description.trim() || null,
          field_type: addForm.field_type,
          required: addForm.required,
          sort_order: (brief?.project_brief_questions?.length ?? 0),
        }),
      })
      if (res.ok) {
        const newQ = await res.json()
        setBrief((prev) =>
          prev
            ? {
                ...prev,
                project_brief_questions: [
                  ...prev.project_brief_questions,
                  { ...newQ, project_brief_answers: [] },
                ],
              }
            : prev
        )
        setAddForm(emptyForm())
        setShowAddForm(false)
      }
    } catch {
      // silent
    } finally {
      setAdding(false)
    }
  }

  // ── Edit question ───────────────────────────────────────────────────────────
  function startEdit(q: ProjectBriefQuestion) {
    setEditingQid(q.id)
    setEditForm({
      label: q.label,
      description: q.description ?? '',
      field_type: q.field_type,
      required: q.required,
    })
  }

  async function saveEdit(qid: string) {
    setSavingQid(qid)
    try {
      const res = await fetch(`/api/proyectos/${projectId}/brief/questions/${qid}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          label: editForm.label.trim(),
          description: editForm.description.trim() || null,
          field_type: editForm.field_type,
          required: editForm.required,
        }),
      })
      if (res.ok) {
        setBrief((prev) =>
          prev
            ? {
                ...prev,
                project_brief_questions: prev.project_brief_questions.map((q) =>
                  q.id === qid
                    ? {
                        ...q,
                        label: editForm.label.trim(),
                        description: editForm.description.trim() || null,
                        field_type: editForm.field_type as ProjectBriefQuestion['field_type'],
                        required: editForm.required,
                      }
                    : q
                ),
              }
            : prev
        )
        setEditingQid(null)
      }
    } catch {
      // silent
    } finally {
      setSavingQid(null)
    }
  }

  // ── Delete question ─────────────────────────────────────────────────────────
  async function deleteQuestion(qid: string) {
    if (!confirm('¿Eliminar esta pregunta?')) return
    setDeletingQid(qid)
    try {
      const res = await fetch(`/api/proyectos/${projectId}/brief/questions/${qid}`, {
        method: 'DELETE',
      })
      if (res.status === 204) {
        setBrief((prev) =>
          prev
            ? {
                ...prev,
                project_brief_questions: prev.project_brief_questions.filter((q) => q.id !== qid),
              }
            : prev
        )
      }
    } catch {
      // silent
    } finally {
      setDeletingQid(null)
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="bg-nex-dark border border-white/10 rounded-xl p-6">
      <p className="font-dm-mono text-[10px] tracking-[0.15em] uppercase text-nex-green mb-4">
        Brief del proyecto
      </p>

      {/* No brief yet */}
      {!brief && (
        <div className="space-y-3">
          <p className="font-jost text-sm text-nex-grey">
            Este proyecto no tiene un brief asignado todavía.
          </p>

          {canEdit && (
            <div className="flex items-center gap-2">
              <select
                value={selectedTemplateId}
                onChange={(e) => setSelectedTemplateId(e.target.value)}
                className="flex-1 bg-nex-black border border-white/10 rounded-lg px-3 py-2 text-sm text-nex-white focus:outline-none focus:border-nex-green/50 transition-colors"
              >
                <option value="" className="bg-nex-dark text-nex-grey">
                  Seleccionar template…
                </option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id} className="bg-nex-dark text-nex-white">
                    {t.name}
                  </option>
                ))}
              </select>

              <button
                onClick={assignBrief}
                disabled={assigning || !selectedTemplateId}
                className="font-jost font-bold text-sm bg-nex-green text-nex-black px-4 py-2 rounded-lg disabled:opacity-40 hover:bg-nex-green/90 transition-colors shrink-0"
              >
                {assigning ? '…' : 'Asignar brief'}
              </button>
            </div>
          )}

          {assignError && (
            <p className="font-jost text-xs text-red-400">{assignError}</p>
          )}
        </div>
      )}

      {/* Brief exists */}
      {brief && (
        <div className="space-y-4">
          {/* Status + actions row */}
          <div className="flex items-center gap-3 flex-wrap">
            <span
              className={[
                'font-dm-mono text-[10px] uppercase tracking-wider rounded-full border px-2.5 py-1',
                STATUS_COLORS[brief.status] ?? STATUS_COLORS.draft,
              ].join(' ')}
            >
              {STATUS_LABELS[brief.status] ?? brief.status}
            </span>

            {/* Send to client */}
            {canEdit &&
              (brief.status === 'draft' || brief.status === 'sent') &&
              clientEmail && (
                <button
                  onClick={sendBrief}
                  disabled={sending}
                  className="font-jost font-bold text-sm bg-nex-green text-nex-black px-3 py-1.5 rounded-lg disabled:opacity-40 hover:bg-nex-green/90 transition-colors text-xs"
                >
                  {sending
                    ? '…'
                    : brief.status === 'sent'
                    ? 'Re-enviar al cliente'
                    : 'Enviar al cliente'}
                </button>
              )}

            {/* Delete brief */}
            {canEdit && brief.status === 'draft' && (
              <button
                onClick={deleteBrief}
                disabled={deleting}
                className="font-jost text-xs text-nex-grey hover:text-red-400 transition-colors disabled:opacity-40"
              >
                {deleting ? '…' : 'Eliminar brief'}
              </button>
            )}
          </div>

          {sendMsg && (
            <p className="font-jost text-xs text-nex-grey">{sendMsg}</p>
          )}

          {!clientEmail && canEdit && brief.status === 'draft' && (
            <p className="font-jost text-xs text-yellow-400">
              El proyecto no tiene un cliente vinculado — invitá al cliente antes de enviar el brief.
            </p>
          )}

          {/* Questions list */}
          <div className="space-y-2">
            {brief.project_brief_questions.length === 0 && (
              <p className="font-jost text-sm text-nex-grey italic">
                Sin preguntas todavía.
              </p>
            )}

            {brief.project_brief_questions.map((q) => {
              const answer = q.project_brief_answers?.[0] ?? null
              const isEditing = editingQid === q.id

              return (
                <div
                  key={q.id}
                  className="bg-nex-black rounded-lg border border-white/5 px-4 py-3 space-y-2"
                >
                  {isEditing ? (
                    /* Inline edit form */
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={editForm.label}
                        onChange={(e) => setEditForm((f) => ({ ...f, label: e.target.value }))}
                        placeholder="Pregunta"
                        className="w-full bg-nex-dark border border-white/10 rounded-lg px-3 py-2 text-sm text-nex-white focus:outline-none focus:border-nex-green/50"
                      />
                      <input
                        type="text"
                        value={editForm.description}
                        onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                        placeholder="Descripción (opcional)"
                        className="w-full bg-nex-dark border border-white/10 rounded-lg px-3 py-2 text-sm text-nex-white focus:outline-none focus:border-nex-green/50"
                      />
                      <div className="flex items-center gap-3">
                        <select
                          value={editForm.field_type}
                          onChange={(e) => setEditForm((f) => ({ ...f, field_type: e.target.value }))}
                          className="bg-nex-dark border border-white/10 rounded px-2 py-1 text-xs text-nex-white focus:outline-none"
                        >
                          {Object.keys(FIELD_TYPE_LABELS).map((ft) => (
                            <option key={ft} value={ft} className="bg-nex-dark">{FIELD_TYPE_LABELS[ft]}</option>
                          ))}
                        </select>
                        <label className="flex items-center gap-1.5 font-jost text-xs text-nex-grey cursor-pointer">
                          <input
                            type="checkbox"
                            checked={editForm.required}
                            onChange={(e) => setEditForm((f) => ({ ...f, required: e.target.checked }))}
                            className="accent-nex-green"
                          />
                          Obligatoria
                        </label>
                        <div className="ml-auto flex items-center gap-2">
                          <button
                            onClick={() => setEditingQid(null)}
                            className="font-jost text-xs text-nex-grey hover:text-nex-white transition-colors"
                          >
                            Cancelar
                          </button>
                          <button
                            onClick={() => saveEdit(q.id)}
                            disabled={savingQid === q.id || !editForm.label.trim()}
                            className="font-jost font-bold text-xs bg-nex-green text-nex-black px-3 py-1 rounded disabled:opacity-40 hover:bg-nex-green/90 transition-colors"
                          >
                            {savingQid === q.id ? '…' : 'Guardar'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Display row */
                    <div className="space-y-1.5">
                      <div className="flex items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-jost text-sm text-nex-white">{q.label}</p>
                          {q.description && (
                            <p className="font-jost text-xs text-nex-grey mt-0.5">{q.description}</p>
                          )}
                        </div>

                        {/* Badges */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span
                            className={[
                              'font-dm-mono text-[9px] uppercase tracking-wider rounded border px-1.5 py-0.5',
                              FIELD_TYPE_COLORS[q.field_type] ?? FIELD_TYPE_COLORS.text,
                            ].join(' ')}
                          >
                            {FIELD_TYPE_LABELS[q.field_type] ?? q.field_type}
                          </span>
                          {q.required && (
                            <span className="font-dm-mono text-[9px] uppercase tracking-wider rounded border px-1.5 py-0.5 text-red-400 bg-red-400/10 border-red-400/30">
                              Obligatoria
                            </span>
                          )}
                        </div>

                        {/* Edit / delete buttons */}
                        {canEditQuestions && (
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => startEdit(q)}
                              className="font-jost text-xs text-nex-grey hover:text-nex-white transition-colors"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => deleteQuestion(q.id)}
                              disabled={deletingQid === q.id}
                              className="font-jost text-xs text-nex-grey hover:text-red-400 transition-colors disabled:opacity-40"
                            >
                              {deletingQid === q.id ? '…' : '✕'}
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Answer display */}
                      {answer && (
                        <div className="pl-0 pt-1 border-t border-white/5">
                          <p className="font-dm-mono text-[9px] uppercase tracking-wider text-nex-grey mb-1">
                            Respuesta
                          </p>
                          {q.field_type === 'image' && answer.file_path ? (
                            <a
                              href={answer.file_path}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={answer.file_path}
                                alt="Respuesta"
                                className="h-16 w-auto rounded border border-white/10 object-contain hover:opacity-80 transition-opacity"
                              />
                            </a>
                          ) : q.field_type === 'image_multi' && answer.file_path ? (
                            <div className="flex flex-wrap gap-2">
                              {parseMultiPaths(answer.file_path).map((url, i) => (
                                <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="block">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={url}
                                    alt="Respuesta"
                                    className="h-16 w-16 rounded border border-white/10 object-cover hover:opacity-80 transition-opacity"
                                  />
                                </a>
                              ))}
                            </div>
                          ) : q.field_type === 'boolean' ? (
                            <p className="font-jost text-sm text-nex-white">
                              {answer.value === 'true' ? 'Sí' : 'No'}
                            </p>
                          ) : (
                            <p className="font-jost text-sm text-nex-white break-words">
                              {answer.value ?? '—'}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Add question */}
          {canEditQuestions && (
            <div className="pt-2 border-t border-white/5">
              {showAddForm ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={addForm.label}
                    onChange={(e) => setAddForm((f) => ({ ...f, label: e.target.value }))}
                    placeholder="Pregunta"
                    className="w-full bg-nex-black border border-white/10 rounded-lg px-3 py-2 text-sm text-nex-white focus:outline-none focus:border-nex-green/50"
                  />
                  <input
                    type="text"
                    value={addForm.description}
                    onChange={(e) => setAddForm((f) => ({ ...f, description: e.target.value }))}
                    placeholder="Descripción (opcional)"
                    className="w-full bg-nex-black border border-white/10 rounded-lg px-3 py-2 text-sm text-nex-white focus:outline-none focus:border-nex-green/50"
                  />
                  <div className="flex items-center gap-3">
                    <select
                      value={addForm.field_type}
                      onChange={(e) => setAddForm((f) => ({ ...f, field_type: e.target.value }))}
                      className="bg-nex-dark border border-white/10 rounded px-2 py-1 text-xs text-nex-white focus:outline-none"
                    >
                      {Object.keys(FIELD_TYPE_LABELS).map((ft) => (
                        <option key={ft} value={ft} className="bg-nex-dark">{FIELD_TYPE_LABELS[ft]}</option>
                      ))}
                    </select>
                    <label className="flex items-center gap-1.5 font-jost text-xs text-nex-grey cursor-pointer">
                      <input
                        type="checkbox"
                        checked={addForm.required}
                        onChange={(e) => setAddForm((f) => ({ ...f, required: e.target.checked }))}
                        className="accent-nex-green"
                      />
                      Obligatoria
                    </label>
                    <div className="ml-auto flex items-center gap-2">
                      <button
                        onClick={() => { setShowAddForm(false); setAddForm(emptyForm()) }}
                        className="font-jost text-xs text-nex-grey hover:text-nex-white transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={addQuestion}
                        disabled={adding || !addForm.label.trim()}
                        className="font-jost font-bold text-xs bg-nex-green text-nex-black px-3 py-1 rounded disabled:opacity-40 hover:bg-nex-green/90 transition-colors"
                      >
                        {adding ? '…' : 'Agregar'}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="font-jost text-sm text-nex-grey hover:text-nex-green transition-colors"
                >
                  + Agregar pregunta
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

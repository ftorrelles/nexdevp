'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { BriefTemplate, BriefTemplateQuestion } from '@/lib/supabase'

const FIELD_TYPE_LABELS: Record<string, string> = {
  text: 'Texto corto',
  textarea: 'Texto largo',
  url: 'Enlace',
  image: 'Imagen',
  boolean: 'Sí/No',
}

const FIELD_TYPES = ['text', 'textarea', 'url', 'image', 'boolean'] as const

interface Props {
  template: BriefTemplate & { brief_template_questions: BriefTemplateQuestion[] }
}

export function TemplateEditor({ template }: Props) {
  const router = useRouter()

  const [name, setName] = useState(template.name)
  const [description, setDescription] = useState(template.description ?? '')
  const [savingMeta, setSavingMeta] = useState(false)

  const [questions, setQuestions] = useState<BriefTemplateQuestion[]>(
    [...template.brief_template_questions].sort((a, b) => a.sort_order - b.sort_order)
  )

  const [newLabel, setNewLabel] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newFieldType, setNewFieldType] = useState<typeof FIELD_TYPES[number]>('text')
  const [newRequired, setNewRequired] = useState(false)
  const [addingQuestion, setAddingQuestion] = useState(false)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editLabel, setEditLabel] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [editFieldType, setEditFieldType] = useState<typeof FIELD_TYPES[number]>('text')
  const [editRequired, setEditRequired] = useState(false)
  const [savingEdit, setSavingEdit] = useState(false)

  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deletingTemplate, setDeletingTemplate] = useState(false)

  async function saveMeta() {
    if (!name.trim()) return
    setSavingMeta(true)
    try {
      await fetch(`/api/admin/brief-templates/${template.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), description: description.trim() || null }),
      })
    } finally {
      setSavingMeta(false)
    }
  }

  async function addQuestion() {
    if (!newLabel.trim()) return
    setAddingQuestion(true)
    try {
      const res = await fetch(`/api/admin/brief-templates/${template.id}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          label: newLabel.trim(),
          description: newDesc.trim() || undefined,
          field_type: newFieldType,
          required: newRequired,
          sort_order: questions.length,
        }),
      })
      if (res.ok) {
        const created: BriefTemplateQuestion = await res.json()
        setQuestions((prev) => [...prev, created])
        setNewLabel('')
        setNewDesc('')
        setNewFieldType('text')
        setNewRequired(false)
      }
    } finally {
      setAddingQuestion(false)
    }
  }

  function startEdit(q: BriefTemplateQuestion) {
    setEditingId(q.id)
    setEditLabel(q.label)
    setEditDesc(q.description ?? '')
    setEditFieldType(q.field_type)
    setEditRequired(q.required)
  }

  async function saveEdit(q: BriefTemplateQuestion) {
    setSavingEdit(true)
    try {
      const res = await fetch(`/api/admin/brief-templates/${template.id}/questions/${q.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          label: editLabel.trim(),
          description: editDesc.trim() || null,
          field_type: editFieldType,
          required: editRequired,
        }),
      })
      if (res.ok) {
        const updated: BriefTemplateQuestion = await res.json()
        setQuestions((prev) => prev.map((x) => (x.id === q.id ? updated : x)))
        setEditingId(null)
      }
    } finally {
      setSavingEdit(false)
    }
  }

  async function deleteQuestion(id: string) {
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/brief-templates/${template.id}/questions/${id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setQuestions((prev) => prev.filter((q) => q.id !== id))
        setDeletingId(null)
      }
    } finally {
      setDeleting(false)
    }
  }

  async function deleteTemplate() {
    setDeletingTemplate(true)
    try {
      const res = await fetch(`/api/admin/brief-templates/${template.id}`, { method: 'DELETE' })
      if (res.ok) router.push('/admin/brief-templates')
    } finally {
      setDeletingTemplate(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Meta section */}
      <div className="bg-nex-dark border border-white/10 rounded-xl p-6">
        <p className="font-dm-mono text-[10px] uppercase tracking-wider text-nex-grey mb-4">Template info</p>
        <div className="space-y-4">
          <div>
            <label className="block font-dm-mono text-[10px] uppercase tracking-wider text-nex-grey mb-1.5">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-nex-black border border-white/10 rounded-lg px-3 py-2 text-sm text-nex-white focus:outline-none focus:border-nex-green/50 transition-colors"
            />
          </div>
          <div>
            <label className="block font-dm-mono text-[10px] uppercase tracking-wider text-nex-grey mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full bg-nex-black border border-white/10 rounded-lg px-3 py-2 text-sm text-nex-white focus:outline-none focus:border-nex-green/50 transition-colors resize-none"
            />
          </div>
          <div className="flex items-center justify-between pt-1">
            <button
              onClick={saveMeta}
              disabled={savingMeta || !name.trim()}
              className="font-jost font-bold text-sm bg-nex-green text-nex-black px-4 py-2 rounded-lg disabled:opacity-40 hover:bg-nex-green/90 transition-colors"
            >
              {savingMeta ? 'Saving…' : 'Save changes'}
            </button>
            {deletingId === null && (
              <button
                onClick={deleteTemplate}
                disabled={deletingTemplate}
                className="font-jost text-sm text-red-400 hover:text-red-300 transition-colors disabled:opacity-40"
              >
                {deletingTemplate ? 'Deleting…' : 'Delete template'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Questions section */}
      <div className="bg-nex-dark border border-white/10 rounded-xl p-6">
        <p className="font-dm-mono text-[10px] uppercase tracking-wider text-nex-grey mb-4">
          Questions ({questions.length})
        </p>

        <div className="space-y-3 mb-6">
          {questions.length === 0 && (
            <p className="font-jost text-sm text-nex-grey italic text-center py-4">
              No questions yet. Add the first one below.
            </p>
          )}
          {questions.map((q) => (
            <div key={q.id} className="bg-nex-black border border-white/10 rounded-lg px-4 py-3">
              {editingId === q.id ? (
                <div className="space-y-3">
                  <input
                    value={editLabel}
                    onChange={(e) => setEditLabel(e.target.value)}
                    className="w-full bg-nex-dark border border-white/10 rounded-lg px-3 py-2 text-sm text-nex-white focus:outline-none focus:border-nex-green/50 transition-colors"
                    placeholder="Question label"
                  />
                  <textarea
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    rows={2}
                    className="w-full bg-nex-dark border border-white/10 rounded-lg px-3 py-2 text-sm text-nex-white focus:outline-none focus:border-nex-green/50 transition-colors resize-none"
                    placeholder="Helper text (optional)"
                  />
                  <div className="flex items-center gap-3">
                    <select
                      value={editFieldType}
                      onChange={(e) => setEditFieldType(e.target.value as typeof FIELD_TYPES[number])}
                      className="bg-nex-dark border border-white/10 rounded-lg px-3 py-2 text-sm text-nex-white focus:outline-none focus:border-nex-green/50"
                    >
                      {FIELD_TYPES.map((t) => (
                        <option key={t} value={t}>{FIELD_TYPE_LABELS[t]}</option>
                      ))}
                    </select>
                    <label className="flex items-center gap-2 font-jost text-sm text-nex-grey cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editRequired}
                        onChange={(e) => setEditRequired(e.target.checked)}
                        className="accent-nex-green"
                      />
                      Required
                    </label>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => saveEdit(q)}
                      disabled={savingEdit || !editLabel.trim()}
                      className="font-jost font-bold text-sm bg-nex-green text-nex-black px-3 py-1.5 rounded-lg disabled:opacity-40 hover:bg-nex-green/90 transition-colors"
                    >
                      {savingEdit ? '…' : 'Save'}
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="font-jost text-sm text-nex-grey hover:text-nex-white transition-colors px-3 py-1.5"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span className="font-jost text-sm text-nex-white">{q.label}</span>
                      {q.required && (
                        <span className="font-dm-mono text-[9px] uppercase tracking-wider text-red-400 border border-red-400/30 rounded-full px-1.5 py-0.5">
                          Required
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-dm-mono text-[10px] text-nex-green">{FIELD_TYPE_LABELS[q.field_type]}</span>
                      {q.description && (
                        <span className="font-jost text-xs text-nex-grey truncate">{q.description}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => startEdit(q)}
                      className="font-jost text-xs text-nex-grey hover:text-nex-white transition-colors"
                    >
                      Edit
                    </button>
                    {deletingId === q.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => deleteQuestion(q.id)}
                          disabled={deleting}
                          className="font-jost text-xs text-red-400 hover:text-red-300 transition-colors"
                        >
                          {deleting ? '…' : 'Confirm'}
                        </button>
                        <button
                          onClick={() => setDeletingId(null)}
                          className="font-jost text-xs text-nex-grey hover:text-nex-white transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeletingId(q.id)}
                        className="font-jost text-xs text-nex-grey hover:text-red-400 transition-colors"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Add question form */}
        <div className="border-t border-white/10 pt-5">
          <p className="font-dm-mono text-[10px] uppercase tracking-wider text-nex-grey mb-3">Add question</p>
          <div className="space-y-3">
            <input
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="Question label *"
              className="w-full bg-nex-black border border-white/10 rounded-lg px-3 py-2 text-sm text-nex-white focus:outline-none focus:border-nex-green/50 transition-colors"
            />
            <textarea
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Helper text (optional)"
              rows={2}
              className="w-full bg-nex-black border border-white/10 rounded-lg px-3 py-2 text-sm text-nex-white focus:outline-none focus:border-nex-green/50 transition-colors resize-none"
            />
            <div className="flex items-center gap-3 flex-wrap">
              <select
                value={newFieldType}
                onChange={(e) => setNewFieldType(e.target.value as typeof FIELD_TYPES[number])}
                className="bg-nex-black border border-white/10 rounded-lg px-3 py-2 text-sm text-nex-white focus:outline-none focus:border-nex-green/50"
              >
                {FIELD_TYPES.map((t) => (
                  <option key={t} value={t}>{FIELD_TYPE_LABELS[t]}</option>
                ))}
              </select>
              <label className="flex items-center gap-2 font-jost text-sm text-nex-grey cursor-pointer">
                <input
                  type="checkbox"
                  checked={newRequired}
                  onChange={(e) => setNewRequired(e.target.checked)}
                  className="accent-nex-green"
                />
                Required
              </label>
              <button
                onClick={addQuestion}
                disabled={addingQuestion || !newLabel.trim()}
                className="font-jost font-bold text-sm bg-nex-green text-nex-black px-4 py-2 rounded-lg disabled:opacity-40 hover:bg-nex-green/90 transition-colors ml-auto"
              >
                {addingQuestion ? 'Adding…' : '+ Add question'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

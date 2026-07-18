'use client'

import { useState, useRef } from 'react'

type AnswerRow = {
  id: string
  value: string | null
  file_path: string | null
  answered_at: string
}

type QuestionRow = {
  id: string
  label: string
  description: string | null
  field_type: 'text' | 'textarea' | 'url' | 'image' | 'image_multi' | 'boolean'
  required: boolean
  sort_order: number
  project_brief_answers: AnswerRow[]
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

interface Props {
  projectId: string
  brief: {
    id: string
    status: string
    project_brief_questions: QuestionRow[]
  }
  locale: 'es' | 'en'
}

function getInitialAnswer(q: QuestionRow): string {
  const a = q.project_brief_answers?.[0]
  if (!a) return ''
  return a.value ?? ''
}

// Convention: an `image`/`image_multi` question is conditional when the
// immediately preceding question (by sort_order) is a `boolean`. It only
// renders when the boolean answer is 'true'.
function buildConditionalMap(questions: QuestionRow[]): Map<string, string> {
  const sorted = [...questions].sort((a, b) => a.sort_order - b.sort_order)
  const map = new Map<string, string>() // image qid → boolean qid
  for (let i = 1; i < sorted.length; i++) {
    if (
      (sorted[i].field_type === 'image' || sorted[i].field_type === 'image_multi') &&
      sorted[i - 1].field_type === 'boolean'
    ) {
      map.set(sorted[i].id, sorted[i - 1].id)
    }
  }
  return map
}

export function BriefForm({ projectId, brief, locale }: Props) {
  const loc = locale
  const alreadySubmitted = brief.status === 'completed'

  const conditionalMap = buildConditionalMap(brief.project_brief_questions)

  const [answers, setAnswers] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {}
    for (const q of brief.project_brief_questions) {
      if (q.field_type !== 'image' && q.field_type !== 'image_multi') {
        init[q.id] = getInitialAnswer(q)
      }
    }
    return init
  })

  const [files, setFiles] = useState<Record<string, File>>({})
  const [filesMulti, setFilesMulti] = useState<Record<string, File[]>>({})

  const existingImages: Record<string, string | null> = {}
  const existingImagesMulti: Record<string, string[]> = {}
  for (const q of brief.project_brief_questions) {
    if (q.field_type === 'image') {
      existingImages[q.id] = q.project_brief_answers?.[0]?.file_path ?? null
    } else if (q.field_type === 'image_multi') {
      existingImagesMulti[q.id] = parseMultiPaths(q.project_brief_answers?.[0]?.file_path)
    }
  }

  const [saveStatus,   setSaveStatus]   = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'submitting' | 'done' | 'error'>('idle')
  const [missingRequired, setMissingRequired] = useState<string[]>([])

  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({})

  function handleTextChange(questionId: string, value: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }))
  }

  function handleFileChange(questionId: string, file: File | undefined) {
    if (!file) return
    setFiles((prev) => ({ ...prev, [questionId]: file }))
  }

  function handleMultiFileChange(questionId: string, fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return
    setFilesMulti((prev) => ({ ...prev, [questionId]: [...(prev[questionId] ?? []), ...Array.from(fileList)] }))
  }

  function handleRemoveMultiFile(questionId: string, index: number) {
    setFilesMulti((prev) => ({
      ...prev,
      [questionId]: (prev[questionId] ?? []).filter((_, i) => i !== index),
    }))
  }

  async function save(): Promise<boolean> {
    setSaveStatus('saving')
    const formData = new FormData()
    for (const q of brief.project_brief_questions) {
      if (q.field_type === 'image') {
        const file = files[q.id]
        if (file) formData.append(`answers[${q.id}][file]`, file)
      } else if (q.field_type === 'image_multi') {
        const multi = filesMulti[q.id] ?? []
        for (const file of multi) formData.append(`answers[${q.id}][files][]`, file)
      } else {
        formData.append(`answers[${q.id}][value]`, answers[q.id] ?? '')
      }
    }
    try {
      const res = await fetch(`/api/proyectos/${projectId}/brief/answers`, {
        method: 'POST',
        body: formData,
      })
      if (res.ok) {
        setSaveStatus('saved')
        setTimeout(() => setSaveStatus('idle'), 3000)
        return true
      }
      setSaveStatus('error')
      return false
    } catch {
      setSaveStatus('error')
      return false
    }
  }

  async function handleSave() {
    await save()
  }

  async function handleSubmit() {
    setMissingRequired([])
    // Auto-save before submit so the server has the latest answers
    const saved = await save()
    if (!saved) return

    setSubmitStatus('submitting')
    try {
      const res = await fetch(`/api/proyectos/${projectId}/brief/submit`, {
        method: 'POST',
      })
      if (res.ok) {
        setSubmitStatus('done')
      } else if (res.status === 422) {
        const body = await res.json()
        setMissingRequired(body.missing ?? [])
        setSubmitStatus('idle')
      } else {
        setSubmitStatus('error')
      }
    } catch {
      setSubmitStatus('error')
    }
  }

  const inputClass =
    'w-full bg-nex-black border border-white/10 rounded-lg px-4 py-2.5 font-jost text-sm text-nex-white placeholder:text-nex-grey/60 focus:outline-none focus:border-nex-green/50 transition-colors'

  return (
    <div className="bg-nex-dark border border-white/10 rounded-xl p-6 space-y-6">
      {/* Header */}
      <div>
        <p className="font-dm-mono text-[10px] uppercase tracking-[0.15em] text-nex-green mb-1">Brief</p>
        <h1 className="font-jost font-bold text-xl text-nex-white">
          {loc === 'es' ? 'Brief del proyecto' : 'Project brief'}
        </h1>
        <p className="font-jost text-sm text-nex-grey mt-2">
          {loc === 'es'
            ? 'Completá la información para que podamos avanzar con tu proyecto. Podés guardar y volver más tarde.'
            : 'Fill in the information so we can move forward with your project. You can save and come back later.'}
        </p>
      </div>

      {/* Already submitted banner */}
      {alreadySubmitted && submitStatus !== 'done' && (
        <div className="bg-nex-green/5 border border-nex-green/20 rounded-xl px-4 py-3 flex items-center gap-3">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-nex-green shrink-0" aria-hidden="true">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <p className="font-jost text-sm text-nex-grey">
            {loc === 'es'
              ? 'Ya enviaste este brief. Podés editar tus respuestas y volver a enviarlo cuando quieras.'
              : 'You already submitted this brief. You can edit your answers and resubmit at any time.'}
          </p>
        </div>
      )}

      {/* Success state (inline, not replacing the form) */}
      {submitStatus === 'done' && (
        <div className="bg-nex-green/10 border border-nex-green/30 rounded-xl px-4 py-3 flex items-center gap-3">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-nex-green shrink-0" aria-hidden="true">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <p className="font-jost text-sm text-nex-white font-semibold">
            {loc === 'es'
              ? '¡Brief enviado! El equipo de nexdevp recibirá una notificación.'
              : 'Brief submitted! The nexdevp team will receive a notification.'}
          </p>
        </div>
      )}

      {/* Questions */}
      <div className="space-y-6">
        {brief.project_brief_questions.map((q) => {
          // Conditional: image after boolean — only show when boolean is true
          const parentBooleanId = conditionalMap.get(q.id)
          if (parentBooleanId && answers[parentBooleanId] !== 'true') return null

          const isMissing = missingRequired.includes(q.id)
          return (
            <div
              key={q.id}
              className={[
                'border-t border-white/10 pt-5 first:border-t-0 first:pt-0',
                isMissing ? 'rounded-lg ring-1 ring-red-400/50 p-3 -mx-3' : '',
              ].join(' ')}
            >
              <label
                htmlFor={`q-${q.id}`}
                className="block font-jost font-semibold text-sm text-nex-white mb-1"
              >
                {q.label}
                {q.required && <span className="text-red-400 ml-1">*</span>}
              </label>
              {q.description && (
                <p className="font-jost text-xs text-nex-grey mb-3">{q.description}</p>
              )}
              {isMissing && (
                <p className="font-jost text-xs text-red-400 mb-2">
                  {loc === 'es' ? 'Este campo es obligatorio.' : 'This field is required.'}
                </p>
              )}

              {q.field_type === 'text' && (
                <input
                  id={`q-${q.id}`}
                  type="text"
                  value={answers[q.id] ?? ''}
                  onChange={(e) => handleTextChange(q.id, e.target.value)}
                  className={inputClass}
                  placeholder={q.label}
                />
              )}

              {q.field_type === 'textarea' && (
                <textarea
                  id={`q-${q.id}`}
                  rows={4}
                  value={answers[q.id] ?? ''}
                  onChange={(e) => handleTextChange(q.id, e.target.value)}
                  className={`${inputClass} resize-y`}
                  placeholder={q.label}
                />
              )}

              {q.field_type === 'url' && (
                <input
                  id={`q-${q.id}`}
                  type="url"
                  value={answers[q.id] ?? ''}
                  onChange={(e) => handleTextChange(q.id, e.target.value)}
                  className={inputClass}
                  placeholder="https://"
                />
              )}

              {q.field_type === 'boolean' && (
                <div className="flex gap-3">
                  {(['true', 'false'] as const).map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => handleTextChange(q.id, val)}
                      className={[
                        'px-5 py-2 rounded-lg font-jost text-sm font-semibold border transition-colors',
                        answers[q.id] === val
                          ? 'bg-nex-green text-nex-black border-nex-green'
                          : 'bg-nex-black text-nex-grey border-white/10 hover:border-nex-green/40',
                      ].join(' ')}
                    >
                      {val === 'true' ? (loc === 'es' ? 'Sí' : 'Yes') : 'No'}
                    </button>
                  ))}
                </div>
              )}

              {q.field_type === 'image' && (
                <div className="space-y-3">
                  {existingImages[q.id] && !files[q.id] && (
                    <div className="relative inline-block">
                      <img
                        src={existingImages[q.id]!}
                        alt={loc === 'es' ? 'Imagen actual' : 'Current image'}
                        className="h-24 w-auto rounded-lg border border-white/10 object-cover"
                      />
                      <p className="font-dm-mono text-[10px] text-nex-grey mt-1">
                        {loc === 'es' ? 'Imagen actual' : 'Current image'}
                      </p>
                    </div>
                  )}
                  {files[q.id] && (
                    <div className="relative inline-block">
                      <img
                        src={URL.createObjectURL(files[q.id])}
                        alt={loc === 'es' ? 'Nueva imagen' : 'New image'}
                        className="h-24 w-auto rounded-lg border border-nex-green/30 object-cover"
                      />
                      <p className="font-dm-mono text-[10px] text-nex-green mt-1">
                        {files[q.id].name}
                      </p>
                    </div>
                  )}
                  <input
                    id={`q-${q.id}`}
                    ref={(el) => { fileRefs.current[q.id] = el }}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(q.id, e.target.files?.[0])}
                    className="block font-jost text-sm text-nex-grey file:mr-3 file:py-1.5 file:px-4 file:rounded-lg file:border file:border-white/10 file:bg-nex-black file:text-nex-grey file:text-sm file:font-jost file:cursor-pointer hover:file:border-nex-green/40 transition-colors"
                  />
                </div>
              )}

              {q.field_type === 'image_multi' && (
                <div className="space-y-3">
                  {(existingImagesMulti[q.id]?.length ?? 0) > 0 && (
                    <div className="flex flex-wrap gap-3">
                      {existingImagesMulti[q.id].map((url, i) => (
                        <img
                          key={i}
                          src={url}
                          alt={loc === 'es' ? 'Imagen actual' : 'Current image'}
                          className="h-24 w-24 rounded-lg border border-white/10 object-cover"
                        />
                      ))}
                    </div>
                  )}
                  {(filesMulti[q.id]?.length ?? 0) > 0 && (
                    <div className="flex flex-wrap gap-3">
                      {filesMulti[q.id].map((file, i) => (
                        <div key={i} className="relative">
                          <img
                            src={URL.createObjectURL(file)}
                            alt={loc === 'es' ? 'Nueva imagen' : 'New image'}
                            className="h-24 w-24 rounded-lg border border-nex-green/30 object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveMultiFile(q.id, i)}
                            className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-nex-black border border-white/20 text-nex-grey text-xs leading-none flex items-center justify-center hover:text-nex-white hover:border-red-400/50"
                            aria-label={loc === 'es' ? 'Quitar imagen' : 'Remove image'}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <input
                    id={`q-${q.id}`}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => handleMultiFileChange(q.id, e.target.files)}
                    className="block font-jost text-sm text-nex-grey file:mr-3 file:py-1.5 file:px-4 file:rounded-lg file:border file:border-white/10 file:bg-nex-black file:text-nex-grey file:text-sm file:font-jost file:cursor-pointer hover:file:border-nex-green/40 transition-colors"
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Actions */}
      <div className="border-t border-white/10 pt-6 flex flex-col gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={saveStatus === 'saving'}
          className="w-full py-2.5 rounded-lg font-jost font-semibold text-sm border border-white/20 text-nex-white bg-white/5 hover:bg-white/10 transition-colors disabled:opacity-50"
        >
          {saveStatus === 'saving'
            ? (loc === 'es' ? 'Guardando…' : 'Saving…')
            : saveStatus === 'saved'
            ? (loc === 'es' ? '✓ Guardado' : '✓ Saved')
            : saveStatus === 'error'
            ? (loc === 'es' ? 'Error al guardar. Intentá de nuevo.' : 'Save failed. Try again.')
            : (loc === 'es' ? 'Guardar respuestas' : 'Save answers')}
        </button>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitStatus === 'submitting' || saveStatus === 'saving'}
          className="w-full py-2.5 rounded-lg font-jost font-semibold text-sm bg-nex-green text-nex-black hover:bg-nex-green/90 transition-colors disabled:opacity-50"
        >
          {submitStatus === 'submitting'
            ? (loc === 'es' ? 'Enviando…' : 'Submitting…')
            : submitStatus === 'error'
            ? (loc === 'es' ? 'Error. Intentá de nuevo.' : 'Error. Try again.')
            : alreadySubmitted
            ? (loc === 'es' ? 'Actualizar brief' : 'Update brief')
            : (loc === 'es' ? 'Enviar brief' : 'Submit brief')}
        </button>

        {missingRequired.length > 0 && (
          <p className="font-jost text-xs text-red-400 text-center">
            {loc === 'es'
              ? `Completá los ${missingRequired.length} campo${missingRequired.length > 1 ? 's' : ''} obligatorio${missingRequired.length > 1 ? 's' : ''} marcados.`
              : `Please fill in the ${missingRequired.length} required field${missingRequired.length > 1 ? 's' : ''} marked above.`}
          </p>
        )}
      </div>
    </div>
  )
}

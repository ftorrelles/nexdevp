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
  field_type: 'text' | 'textarea' | 'url' | 'image' | 'boolean'
  required: boolean
  sort_order: number
  project_brief_answers: AnswerRow[]
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

export function BriefForm({ projectId, brief, locale }: Props) {
  const loc = locale

  // Text/url/textarea answers keyed by question id
  const [answers, setAnswers] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {}
    for (const q of brief.project_brief_questions) {
      if (q.field_type !== 'image') {
        init[q.id] = getInitialAnswer(q)
      }
    }
    return init
  })

  // File inputs keyed by question id
  const [files, setFiles] = useState<Record<string, File>>({})

  // Existing image URLs (from props) keyed by question id
  const existingImages: Record<string, string | null> = {}
  for (const q of brief.project_brief_questions) {
    if (q.field_type === 'image') {
      existingImages[q.id] = q.project_brief_answers?.[0]?.file_path ?? null
    }
  }

  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'confirming' | 'submitting' | 'done' | 'error'>('idle')
  const [missingRequired, setMissingRequired] = useState<string[]>([])

  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({})

  function handleTextChange(questionId: string, value: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }))
  }

  function handleFileChange(questionId: string, file: File | undefined) {
    if (!file) return
    setFiles((prev) => ({ ...prev, [questionId]: file }))
  }

  async function handleSave() {
    setSaveStatus('saving')
    setMissingRequired([])

    const formData = new FormData()

    for (const q of brief.project_brief_questions) {
      if (q.field_type === 'image') {
        const file = files[q.id]
        if (file) {
          formData.append(`answers[${q.id}][file]`, file)
        }
      } else {
        const val = answers[q.id] ?? ''
        formData.append(`answers[${q.id}][value]`, val)
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
      } else {
        setSaveStatus('error')
      }
    } catch {
      setSaveStatus('error')
    }
  }

  async function handleSubmit() {
    if (submitStatus === 'confirming') {
      setSubmitStatus('submitting')
      setMissingRequired([])

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
    } else {
      setSubmitStatus('confirming')
    }
  }

  function cancelSubmit() {
    setSubmitStatus('idle')
  }

  // Submitted: show completion state
  if (submitStatus === 'done') {
    return (
      <div className="bg-nex-dark border border-white/10 rounded-xl p-6 space-y-4">
        <div className="bg-nex-green/10 border border-nex-green/30 rounded-xl p-4 flex items-center gap-3">
          <span className="text-nex-green text-xl" aria-hidden="true">✓</span>
          <div>
            <p className="font-jost font-semibold text-nex-green text-sm">
              {loc === 'es' ? 'Brief enviado' : 'Brief submitted'}
            </p>
            <p className="font-jost text-xs text-nex-grey mt-0.5">
              {loc === 'es'
                ? 'Gracias. El equipo ya recibió toda la información.'
                : 'Thank you. The team has received all the information.'}
            </p>
          </div>
        </div>
      </div>
    )
  }

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
            ? 'Completá la información para que podamos avanzar con tu proyecto.'
            : 'Fill in the information so we can move forward with your project.'}
        </p>
      </div>

      {/* Questions */}
      <div className="space-y-6">
        {brief.project_brief_questions.map((q) => {
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

              {/* Input by field_type */}
              {q.field_type === 'text' && (
                <input
                  id={`q-${q.id}`}
                  type="text"
                  value={answers[q.id] ?? ''}
                  onChange={(e) => handleTextChange(q.id, e.target.value)}
                  className="w-full bg-nex-black border border-white/10 rounded-lg px-4 py-2.5 font-jost text-sm text-nex-white placeholder:text-nex-grey focus:outline-none focus:border-nex-green/50 transition-colors"
                  placeholder={q.label}
                />
              )}

              {q.field_type === 'textarea' && (
                <textarea
                  id={`q-${q.id}`}
                  rows={4}
                  value={answers[q.id] ?? ''}
                  onChange={(e) => handleTextChange(q.id, e.target.value)}
                  className="w-full bg-nex-black border border-white/10 rounded-lg px-4 py-2.5 font-jost text-sm text-nex-white placeholder:text-nex-grey focus:outline-none focus:border-nex-green/50 transition-colors resize-y"
                  placeholder={q.label}
                />
              )}

              {q.field_type === 'url' && (
                <input
                  id={`q-${q.id}`}
                  type="url"
                  value={answers[q.id] ?? ''}
                  onChange={(e) => handleTextChange(q.id, e.target.value)}
                  className="w-full bg-nex-black border border-white/10 rounded-lg px-4 py-2.5 font-jost text-sm text-nex-white placeholder:text-nex-grey focus:outline-none focus:border-nex-green/50 transition-colors"
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
                      {val === 'true'
                        ? (loc === 'es' ? 'Sí' : 'Yes')
                        : (loc === 'es' ? 'No' : 'No')}
                    </button>
                  ))}
                </div>
              )}

              {q.field_type === 'image' && (
                <div className="space-y-3">
                  {/* Show existing image thumbnail if no new file selected */}
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
                  {/* Show new file preview */}
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
            </div>
          )
        })}
      </div>

      {/* Action buttons */}
      <div className="border-t border-white/10 pt-6 space-y-3">
        {/* Save button */}
        <button
          type="button"
          onClick={handleSave}
          disabled={saveStatus === 'saving'}
          className="w-full py-2.5 rounded-lg font-jost font-semibold text-sm border border-white/20 text-nex-white bg-white/5 hover:bg-white/10 transition-colors disabled:opacity-50"
        >
          {saveStatus === 'saving'
            ? (loc === 'es' ? 'Guardando...' : 'Saving...')
            : saveStatus === 'saved'
            ? (loc === 'es' ? '✓ Respuestas guardadas' : '✓ Answers saved')
            : saveStatus === 'error'
            ? (loc === 'es' ? 'Error al guardar. Intentá de nuevo.' : 'Save failed. Please try again.')
            : (loc === 'es' ? 'Guardar respuestas' : 'Save answers')}
        </button>

        {/* Submit brief */}
        {submitStatus === 'confirming' ? (
          <div className="bg-yellow-400/10 border border-yellow-400/30 rounded-xl p-4 space-y-3">
            <p className="font-jost text-sm text-nex-white font-semibold">
              {loc === 'es'
                ? '¿Confirmar envío? No podrás editar tus respuestas.'
                : "Confirm submission? You won't be able to edit your answers."}
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleSubmit}
                className="flex-1 py-2.5 rounded-lg font-jost font-semibold text-sm bg-nex-green text-nex-black hover:bg-nex-green/90 transition-colors"
              >
                {loc === 'es' ? 'Confirmar envío' : 'Confirm submission'}
              </button>
              <button
                type="button"
                onClick={cancelSubmit}
                className="px-5 py-2.5 rounded-lg font-jost text-sm text-nex-grey border border-white/10 hover:border-white/30 transition-colors"
              >
                {loc === 'es' ? 'Cancelar' : 'Cancel'}
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitStatus === 'submitting'}
            className="w-full py-2.5 rounded-lg font-jost font-semibold text-sm bg-nex-green text-nex-black hover:bg-nex-green/90 transition-colors disabled:opacity-50"
          >
            {submitStatus === 'submitting'
              ? (loc === 'es' ? 'Enviando...' : 'Submitting...')
              : submitStatus === 'error'
              ? (loc === 'es' ? 'Error al enviar. Intentá de nuevo.' : 'Submit failed. Please try again.')
              : (loc === 'es' ? 'Enviar brief' : 'Submit brief')}
          </button>
        )}

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

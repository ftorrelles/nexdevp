import { redirect, notFound } from 'next/navigation'
import { setRequestLocale } from 'next-intl/server'
import { createAuthServerClient } from '@/lib/supabase-server'
import { createServiceClient } from '@/lib/supabase'
import { withSignedBriefUrls } from '@/lib/brief-storage'
import { Link } from '@/i18n/navigation'
import type { Locale } from '@/content/types'
import { BriefForm } from '../BriefForm'

type Props = {
  params: Promise<{ locale: string; id: string }>
}

type AnswerRow = {
  id: string
  brief_question_id: string
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

type BriefRow = {
  id: string
  status: string
  project_brief_questions: QuestionRow[]
}

export default async function BriefPage({ params }: Props): Promise<React.JSX.Element> {
  const { locale, id } = await params
  const loc = locale as Locale
  setRequestLocale(loc)

  const auth = await createAuthServerClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) redirect('/admin/login')
  if (user.app_metadata?.role !== 'client') redirect('/admin')

  const db = createServiceClient()

  // Verify project ownership
  const { data: project } = await db
    .from('projects')
    .select('id, name, client_user_id')
    .eq('id', id)
    .eq('client_user_id', user.id)
    .maybeSingle()

  if (!project) notFound()

  // Fetch brief with questions and answers
  const { data: briefRaw } = await db
    .from('project_briefs')
    .select('id, status, project_brief_questions(id, label, description, field_type, required, sort_order, project_brief_answers(id, brief_question_id, value, file_path, answered_at))')
    .eq('project_id', id)
    .maybeSingle()

  // No brief or draft: show placeholder
  if (!briefRaw || briefRaw.status === 'draft') {
    return (
      <main className="px-4 sm:px-6 py-10 max-w-3xl mx-auto">
        <Link
          href={`/proyecto/${id}`}
          className="inline-flex items-center gap-2 font-dm-mono text-[10px] tracking-[0.2em] uppercase text-nex-grey hover:text-nex-white transition-colors mb-8"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M8 2L4 6l4 4" />
          </svg>
          {loc === 'es' ? '← Volver al proyecto' : '← Back to project'}
        </Link>

        <div className="bg-nex-dark border border-white/10 rounded-xl p-8 text-center">
          <p className="font-dm-mono text-[10px] uppercase tracking-[0.15em] text-nex-grey mb-3">Brief</p>
          <p className="font-jost text-nex-white text-lg font-semibold mb-2">
            {loc === 'es' ? 'El brief no está disponible todavía' : 'Brief not available yet'}
          </p>
          <p className="font-jost text-sm text-nex-grey">
            {loc === 'es'
              ? 'Cuando el equipo de nexdevp prepare el brief de tu proyecto, lo verás aquí.'
              : 'When the nexdevp team prepares your project brief, you will see it here.'}
          </p>
        </div>
      </main>
    )
  }

  // Sort questions by sort_order
  const questions = ((briefRaw.project_brief_questions ?? []) as QuestionRow[])
    .sort((a, b) => a.sort_order - b.sort_order)

  // Sign file URLs in answers
  const allAnswers = questions.flatMap((q) => q.project_brief_answers ?? [])
  const signedAnswers = await withSignedBriefUrls(allAnswers)
  const signedMap = new Map(signedAnswers.map((a) => [a.id, a]))

  const questionsWithSigned = questions.map((q) => ({
    ...q,
    project_brief_answers: (q.project_brief_answers ?? []).map(
      (a) => signedMap.get(a.id) ?? a
    ),
  }))

  const brief: BriefRow = {
    id: briefRaw.id,
    status: briefRaw.status,
    project_brief_questions: questionsWithSigned,
  }

  // Completed: show read-only banner + answers
  if (brief.status === 'completed') {
    return (
      <main className="px-4 sm:px-6 py-10 max-w-3xl mx-auto">
        <Link
          href={`/proyecto/${id}`}
          className="inline-flex items-center gap-2 font-dm-mono text-[10px] tracking-[0.2em] uppercase text-nex-grey hover:text-nex-white transition-colors mb-8"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M8 2L4 6l4 4" />
          </svg>
          {loc === 'es' ? '← Volver al proyecto' : '← Back to project'}
        </Link>

        {/* Completion banner */}
        <div className="bg-nex-green/10 border border-nex-green/30 rounded-xl p-4 mb-6 flex items-center gap-3">
          <span className="text-nex-green text-xl" aria-hidden="true">✓</span>
          <div>
            <p className="font-jost font-semibold text-nex-green text-sm">
              {loc === 'es' ? 'Brief completado' : 'Brief submitted'}
            </p>
            <p className="font-jost text-xs text-nex-grey mt-0.5">
              {loc === 'es'
                ? 'Gracias. El equipo ya tiene toda la información.'
                : 'Thank you. The team has all the information.'}
            </p>
          </div>
        </div>

        {/* Read-only answers */}
        <div className="bg-nex-dark border border-white/10 rounded-xl p-6 space-y-6">
          <h1 className="font-jost font-bold text-xl text-nex-white">
            {loc === 'es' ? 'Brief del proyecto' : 'Project brief'}
          </h1>

          <div className="space-y-6">
            {brief.project_brief_questions.map((q) => {
              const answer = q.project_brief_answers?.[0]
              return (
                <div key={q.id} className="border-t border-white/10 pt-5 first:border-t-0 first:pt-0">
                  <p className="font-jost font-semibold text-sm text-nex-white mb-1">
                    {q.label}
                    {q.required && <span className="text-red-400 ml-1">*</span>}
                  </p>
                  {q.description && (
                    <p className="font-jost text-xs text-nex-grey mb-3">{q.description}</p>
                  )}
                  <div className="bg-nex-black rounded-lg border border-white/10 px-4 py-3">
                    {q.field_type === 'image' && answer?.file_path ? (
                      <img
                        src={answer.file_path}
                        alt={q.label}
                        className="max-h-48 rounded object-cover"
                      />
                    ) : q.field_type === 'boolean' ? (
                      <p className="font-jost text-sm text-nex-white">
                        {answer?.value === 'true'
                          ? (loc === 'es' ? 'Sí' : 'Yes')
                          : answer?.value === 'false'
                          ? (loc === 'es' ? 'No' : 'No')
                          : <span className="text-nex-grey italic">{loc === 'es' ? 'Sin respuesta' : 'No answer'}</span>}
                      </p>
                    ) : (
                      <p className="font-jost text-sm text-nex-white">
                        {answer?.value || (
                          <span className="text-nex-grey italic">
                            {loc === 'es' ? 'Sin respuesta' : 'No answer'}
                          </span>
                        )}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </main>
    )
  }

  // Sent: render the interactive form
  return (
    <main className="px-4 sm:px-6 py-10 max-w-3xl mx-auto">
      <Link
        href={`/proyecto/${id}`}
        className="inline-flex items-center gap-2 font-dm-mono text-[10px] tracking-[0.2em] uppercase text-nex-grey hover:text-nex-white transition-colors mb-8"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M8 2L4 6l4 4" />
        </svg>
        {loc === 'es' ? '← Volver al proyecto' : '← Back to project'}
      </Link>

      <BriefForm projectId={id} brief={brief} locale={loc} />
    </main>
  )
}

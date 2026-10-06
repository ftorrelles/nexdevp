'use client'

import { useState, type ReactElement } from 'react'
import { useTranslations } from 'next-intl'

const tabs = ['learning', 'course', 'lesson', 'management'] as const
const focus = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-700'
const card = 'rounded-xl border border-[#e6e9f2] bg-white'

export function EducationPreview(): ReactElement {
  const t = useTranslations('useCases.preview.education')
  const [screen, setScreen] = useState<typeof tabs[number]>('learning')
  const [lesson, setLesson] = useState(0)
  const [answer, setAnswer] = useState<string | null>(null)
  const completed = lesson === 3

  function openLesson(): void {
    setAnswer(null)
    setScreen('lesson')
  }

  return (
    <div data-product="education" className="min-w-0 overflow-hidden rounded-xl border border-blue-100 bg-[#f6f7fb] text-[#1a2238] shadow-xl">
      <div className="flex items-center justify-between border-b border-[#e6e9f2] bg-white px-4 py-3"><strong className="text-sm font-bold text-[#234fe0]">{t('app')}</strong><span aria-hidden="true" className="text-lg text-slate-500">≡</span></div>
      <div role="group" aria-label={t('screens')} className="flex flex-wrap gap-2 bg-[#eef1f6] p-3">
        {tabs.map((key) => <button key={key} type="button" onClick={() => setScreen(key)} aria-pressed={screen === key} className={`min-h-11 rounded-md border px-3 text-xs ${focus} ${screen === key ? 'border-[#234fe0] bg-[#234fe0] font-semibold text-white' : 'border-[#d6deec] bg-[#e9edf6] text-[#53617e]'}`}>{t(`tabs.${key}`)}</button>)}
      </div>
      <div className="min-h-[340px] space-y-4 p-4 sm:p-5">
        {screen === 'learning' ? (
          <>
            <div><h4 className="text-2xl font-bold tracking-tight">{t('greeting')}</h4><p className="mt-1 text-sm text-[#58637e]">{t('welcomeCopy')}</p></div>
            <p className="text-sm font-semibold">{t('courseLabel')}</p>
            <div className={`${card} p-4`}>
              <div className="flex flex-wrap items-center justify-between gap-3"><h5 className="text-base font-semibold">{t('course')}</h5><button type="button" onClick={openLesson} className={`min-h-11 rounded-md bg-nex-green px-3 text-xs font-semibold text-nex-black ${focus}`}>{t(completed ? 'reviewLesson' : 'continue')} <span aria-hidden="true">→</span></button></div>
              <progress value={lesson} max="3" aria-label={t('progressLabel')} className="mt-4 h-2 w-full accent-[#234fe0]" />
              <p role="status" className="mt-2 text-xs text-[#58637e]">{t('progress', { count: lesson })}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button type="button" onClick={() => setScreen('course')} className={`${card} p-4 text-left ${focus}`}><span aria-hidden="true" className="text-xl">▤</span><strong className="mb-1 mt-3 block text-sm">{t('myCourses')}</strong><span className="text-xs text-[#58637e]">{t('browseCourses')}</span></button>
              <button type="button" onClick={() => setScreen('management')} className={`${card} p-4 text-left ${focus}`}><span aria-hidden="true" className="text-xl">▦</span><strong className="mb-1 mt-3 block text-sm">{t('myLessons')}</strong><span className="text-xs text-[#58637e]">{t('upcoming')}</span></button>
            </div>
          </>
        ) : screen === 'course' ? (
          <>
            <div className="rounded-xl bg-[#234fe0] p-4 text-white">
              <div className="flex items-start justify-between gap-3"><div><h4 className="text-xl font-bold">{t('course')}</h4><p className="mt-1 text-xs text-white/90">{t('courseMeta')}</p></div><span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#234fe0]">A1</span></div>
              <progress value={lesson} max="3" aria-label={t('progressLabel')} className="mt-4 h-2 w-full accent-white" />
              <p className="mt-2 text-xs">{t('progress', { count: lesson })}</p>
            </div>
            <h5 className="text-sm font-semibold">{t('content')}</h5>
            <div className="space-y-2">
              {[0, 1, 2].map((index) => <button key={index} type="button" onClick={openLesson} className={`${card} w-full border-l-[3px] p-3 text-left ${lesson > index ? 'border-l-[#234fe0]' : 'border-l-slate-300'} ${focus}`}><span className="flex justify-between gap-2"><span className="text-sm font-semibold">{index + 1} · {t(`modules.${index}`)}</span><span className="text-xs text-[#58637e]">{t(lesson > index ? 'done' : 'activity')}</span></span><span className="mt-2 block text-xs text-[#58637e]">{t(lesson > index ? 'completedModule' : 'continueModule')}</span></button>)}
            </div>
          </>
        ) : screen === 'lesson' ? (
          <>
            <div className="flex flex-wrap justify-between gap-3"><h4 className="text-lg font-bold">{t('lessonTitle')}</h4><span className="text-xs text-[#58637e]">{t('lessonLabel', { number: Math.min(lesson + 1, 3) })}</span></div>
            <p className="rounded-lg border border-blue-100 bg-[#eaf0ff] p-3 text-sm leading-relaxed text-[#3a4868]">{t('lessonCopy')}</p>
            <div className="space-y-2">
              <div><p className="mb-1 text-xs font-semibold text-[#234fe0]">{t('teacher')}</p><p className="rounded-lg bg-[#eaf0ff] p-3 text-sm">{t('question')}</p></div>
              <fieldset><legend className="mb-2 mt-2 text-xs font-semibold text-[#234fe0]">{t('chooseAnswer')}</legend><div className="grid gap-2">{['goal', 'unclear'].map((key) => <button key={key} type="button" aria-pressed={answer === key} onClick={() => setAnswer(key)} className={`min-h-11 rounded-lg border p-3 text-left text-sm ${focus} ${answer === key ? 'border-[#234fe0] bg-blue-100' : 'border-[#e6e9f2] bg-white'}`}>{t(`answers.${key}`)}</button>)}</div></fieldset>
            </div>
            <p role="status" className="text-sm text-[#58637e]">{answer ? t(answer === 'goal' ? 'answerCorrect' : 'answerRetry') : t('answerHint')}</p>
            <button type="button" disabled={answer !== 'goal' || completed} onClick={() => { setLesson((value) => Math.min(3, value + 1)); setAnswer(null); setScreen('learning') }} className={`min-h-11 rounded-lg bg-[#234fe0] px-4 text-sm font-semibold text-white disabled:opacity-50 ${focus}`}>{t(completed ? 'finished' : 'complete')}</button>
          </>
        ) : (
          <>
            <h4 className="text-xl font-bold">{t('myLessons')}</h4>
            <div className={`${card} p-4`}><p className="text-xs font-semibold text-[#234fe0]">{t('agenda')}</p><h5 className="mt-3 font-semibold">{t('class')}</h5><p className="mt-2 text-sm text-[#58637e]">{t('time')}</p><span className="mt-3 inline-block rounded-full bg-blue-50 px-3 py-1 text-xs text-blue-800">{t('scheduled')}</span></div>
            <p className="text-sm leading-relaxed text-[#58637e]">{t('managementCopy')}</p>
          </>
        )}
      </div>
    </div>
  )
}

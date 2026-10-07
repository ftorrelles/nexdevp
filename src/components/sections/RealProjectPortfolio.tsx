'use client'

import Image from 'next/image'
import { useEffect, useReducer, useRef, useState, type ReactElement } from 'react'
import { useTranslations } from 'next-intl'
import { getRealProjects, REAL_PROJECT_CATEGORIES, CATEGORY_GLOW, type RealProjectCategory } from '@/content/realProjects'
import { createRealProjectSelection, realProjectSelectionReducer } from './realProjectSelection'
import { canPlayPortfolio, schedulePortfolioAdvance } from './portfolioPlayback'

interface RealProjectPortfolioProps {
  initialCategory?: RealProjectCategory
}

const FOCUS = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-nex-green'

export function RealProjectPortfolio({ initialCategory = 'projects' }: RealProjectPortfolioProps): ReactElement {
  const t = useTranslations('realPortfolio')
  const [selection, dispatch] = useReducer(realProjectSelectionReducer, initialCategory, createRealProjectSelection)
  const imageViewer = useRef<HTMLDialogElement>(null)
  const [ready, setReady] = useState(false)
  const [userPaused, setUserPaused] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)
  const [hidden, setHidden] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const [viewerOpen, setViewerOpen] = useState(false)
  const playing = canPlayPortfolio({ ready, userPaused, reducedMotion, hidden, hovered, focused, viewerOpen })
  const projects = getRealProjects(selection.category)
  const index = selection.indices[selection.category]
  const project = projects[index]
  const portrait = project.image ? project.image.height >= project.image.width * 1.6 : false

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    function updateEnvironment(): void {
      setHidden(document.hidden)
      setReducedMotion(media.matches)
      if (media.matches) setUserPaused(true)
      setReady(true)
    }
    media.addEventListener('change', updateEnvironment)
    document.addEventListener('visibilitychange', updateEnvironment)
    updateEnvironment()
    return () => {
      media.removeEventListener('change', updateEnvironment)
      document.removeEventListener('visibilitychange', updateEnvironment)
    }
  }, [])

  useEffect(() => schedulePortfolioAdvance(playing, () => dispatch({ type: 'advance' })), [playing, selection])

  return (
    <section id="proyectos" aria-labelledby="real-projects-heading" onPointerEnter={() => setHovered(true)} onPointerLeave={() => setHovered(false)} onFocusCapture={() => setFocused(true)} onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false) }} className="scroll-mt-20 bg-nex-black px-4 py-16 text-nex-white sm:px-6 lg:px-12 lg:py-8">
      <div id="portfolio" className="mx-auto max-w-6xl scroll-mt-20">
        <div className="mb-5 max-w-3xl">
          <p className="mb-2 font-dm-mono text-xs uppercase tracking-[0.2em] text-nex-green">{t('eyebrow')}</p>
          <h2 id="real-projects-heading" className="font-jost text-3xl font-semibold leading-tight sm:text-4xl">{t('headline')}</h2>
          <p className="mt-3 text-sm leading-relaxed text-nex-white/70 sm:text-base">{t('intro')}</p>
        </div>
        <div role="group" aria-label={t('filterLabel')} className="mb-3 flex gap-2 sm:gap-3">
          {REAL_PROJECT_CATEGORIES.map((category) => (
            <button key={category} type="button" aria-pressed={selection.category === category} aria-controls="real-project-panel" onClick={() => dispatch({ type: 'category', category })} className={`min-h-11 min-w-0 flex-1 rounded-full border px-3 py-2 text-sm sm:flex-none sm:px-6 ${FOCUS} ${selection.category === category ? 'border-nex-green bg-nex-green font-semibold text-nex-black' : 'border-nex-white/25 text-nex-white hover:border-nex-green'}`}>
              {t(`categories.${category}`)}
            </button>
          ))}
        </div>
        <div className="mb-3 flex flex-wrap items-center gap-3 border-t border-nex-white/15 pt-3">
          <div role="group" aria-label={t('projectSelector')} className={`portfolio-progress flex min-w-0 flex-1 items-end gap-1.5 sm:gap-2 ${playing ? '' : 'portfolio-progress-paused'}`}>
            {projects.map((item, itemIndex) => (
              <button key={item.id} type="button" aria-pressed={index === itemIndex} aria-controls="real-project-panel" aria-label={t('segmentLabel', { name: t(`items.${item.id}.name`), position: itemIndex + 1, total: projects.length })} onClick={() => { if (index === itemIndex) setUserPaused((paused) => !paused); else dispatch({ type: 'project', index: itemIndex }) }} className={`group relative min-h-11 min-w-0 flex-1 overflow-hidden rounded-md px-1 pb-1.5 pt-1 ${FOCUS}`}>
                <span aria-hidden="true" className="sr-only">{t(`items.${item.id}.name`)}</span>
                <span aria-hidden="true" className="absolute inset-x-1.5 bottom-1.5 h-1 overflow-hidden rounded-full bg-nex-white/15 transition-colors group-hover:bg-nex-white/30">
                  {index === itemIndex && (
                    <span aria-hidden="true" className={`absolute inset-0 origin-left rounded-full bg-nex-green animate-[portfolio-progress-fill_6s_linear_forwards] ${playing ? '' : '[animation-play-state:paused]'}`} />
                  )}
                </span>
              </button>
            ))}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button type="button" aria-controls="real-project-panel" aria-label={t(userPaused || reducedMotion ? 'play' : 'pause')} title={t(reducedMotion ? 'reducedMotionPause' : 'playbackHint')} disabled={reducedMotion} onClick={() => setUserPaused((paused) => !paused)} className={`flex min-h-11 min-w-11 items-center justify-center rounded-full border border-nex-white/25 text-nex-white hover:border-nex-green disabled:opacity-60 ${FOCUS}`}>
              <span aria-hidden="true" className="flex h-4 w-4 items-center justify-center">{userPaused || reducedMotion ? <svg viewBox="0 0 24 24" fill="currentColor" className="h-full w-full"><path d="M8 5.5v13l11-6.5-11-6.5z" /></svg> : <svg viewBox="0 0 24 24" fill="currentColor" className="h-full w-full"><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" /></svg>}</span>
            </button>
            <p className="sr-only" role="status" aria-live={playing ? 'off' : 'polite'} aria-atomic="true">{t(`items.${project.id}.name`)} · {t('position', { current: index + 1, total: projects.length })}</p>
            <button type="button" aria-label={t('previous')} aria-controls="real-project-panel" disabled={index === 0} onClick={() => dispatch({ type: 'step', direction: -1 })} className={`flex min-h-11 min-w-11 items-center justify-center rounded-full border border-nex-white/25 text-nex-white hover:border-nex-green disabled:cursor-not-allowed disabled:opacity-30 ${FOCUS}`}>
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M15 5l-7 7 7 7" /></svg>
            </button>
            <button type="button" aria-label={t('next')} aria-controls="real-project-panel" disabled={index === projects.length - 1} onClick={() => dispatch({ type: 'step', direction: 1 })} className={`flex min-h-11 min-w-11 items-center justify-center rounded-full border border-nex-white/25 text-nex-white hover:border-nex-green disabled:cursor-not-allowed disabled:opacity-30 ${FOCUS}`}>
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
        </div>
        <div id="real-project-panel" role="region" aria-label={t('regionLabel')} data-layout="showcase">
          <article key={project.id} data-project={project.id} aria-labelledby={`real-project-${project.id}`} className={`relative grid min-w-0 overflow-hidden rounded-2xl border border-nex-white/5 bg-gradient-to-br from-nex-dark via-nex-black to-nex-black shadow-2xl lg:grid-cols-2 ${reducedMotion ? '' : 'portfolio-enter'} [@media(prefers-reduced-motion:reduce)]:!animate-none`}>
            <div aria-hidden="true" className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-nex-green/60 to-transparent" />
            <figure className="flex min-w-0 flex-col rounded-t-2xl border-b border-nex-white/15 bg-gradient-to-br from-nex-green/20 via-nex-black to-nex-black p-3 sm:p-4 lg:rounded-l-2xl lg:rounded-tr-none lg:border-b-0 lg:border-r">
              <div className={`relative flex min-w-0 flex-1 items-center justify-center ${portrait ? 'h-[260px] sm:h-[320px] lg:h-[360px]' : 'h-[200px] sm:h-[280px] lg:h-[280px]'}`}>
                <div aria-hidden="true" className={`absolute left-1/2 top-1/2 h-2/3 w-2/3 -translate-x-1/2 -translate-y-1/2 rounded-full blur-2xl ${CATEGORY_GLOW[selection.category]}`} />
                {project.image ? (
                  <button type="button" aria-haspopup="dialog" aria-controls="real-project-viewer" aria-label={t('enlargeImage', { name: t(`items.${project.id}.name`) })} onClick={() => { setViewerOpen(true); imageViewer.current?.showModal() }} className={`group flex h-full max-w-full cursor-zoom-in flex-col ${FOCUS} ${portrait ? 'aspect-[9/20] rounded-[1.5rem] border-[5px] border-nex-white/30 bg-nex-black p-1.5 shadow-2xl ring-1 ring-nex-green/40' : 'w-full rounded-lg border border-nex-white/10'}`}>
                    {!portrait && (
                      <span aria-hidden="true" className="mb-1.5 flex shrink-0 items-center gap-1.5 rounded-t-[inherit] border border-nex-white/10 bg-nex-black/70 px-2 py-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-nex-white/25" />
                        <span className="h-1.5 w-1.5 rounded-full bg-nex-white/25" />
                        <span className="h-1.5 w-1.5 rounded-full bg-nex-white/25" />
                        <span className="ml-2 h-1 flex-1 rounded-full bg-nex-white/10" />
                      </span>
                    )}
                    <span className="relative block min-h-0 flex-1 overflow-hidden rounded-md">
                      <Image src={project.image.src} alt={t(`items.${project.id}.alt`)} fill sizes={portrait ? '(min-width: 1024px) 162px, (min-width: 640px) 144px, 117px' : '(min-width: 1280px) 530px, (min-width: 1024px) 44vw, (min-width: 640px) calc(100vw - 88px), calc(100vw - 64px)'} className="object-contain drop-shadow-xl transition-transform duration-300 motion-safe:group-hover:scale-[1.03]" />
                    </span>
                  </button>
                ) : (
                  <div className="w-full rounded-xl border border-nex-black/15 bg-nex-black p-6 text-center sm:p-8">
                    <p className="mb-4 font-dm-mono text-[10px] uppercase tracking-[0.18em] text-nex-green">{t('privateProject')}</p>
                    <p className="break-words font-jost text-xl font-semibold text-nex-white sm:text-2xl">{t(`items.${project.id}.name`)}</p>
                    <p className="mx-auto mt-4 max-w-xs text-xs leading-relaxed text-nex-white/70">{t('privateCover')}</p>
                  </div>
                )}
              </div>
              <figcaption className="mt-3 text-center text-[11px] leading-relaxed text-nex-white/70">{t(`captions.${project.image?.kind ?? 'pending'}`)}{project.image && <span className="ml-2 text-nex-white/85">· {t('imageHint')}</span>}</figcaption>
            </figure>
            <div className="flex min-w-0 flex-col items-start p-5 sm:p-6 lg:p-6">
              <p className="rounded border border-nex-green/60 px-2 py-1 font-dm-mono text-[10px] uppercase tracking-[0.15em] text-nex-green">{t(`relationships.${project.relationship}`)}</p>
              <h3 id={`real-project-${project.id}`} className="mt-3 break-words font-jost text-3xl font-semibold leading-tight sm:text-4xl">{t(`items.${project.id}.name`)}</h3>
              <dl className="mt-4 space-y-3 text-sm leading-relaxed">
                <div><dt className="mb-1 text-xs font-semibold uppercase tracking-wider text-nex-white/50">{t('challenge')}</dt><dd className="text-nex-white/80">{t(`items.${project.id}.challenge`)}</dd></div>
                <div><dt className="mb-1 text-xs font-semibold uppercase tracking-wider text-nex-white/50">{t('solution')}</dt><dd className="text-nex-white/80">{t(`items.${project.id}.solution`)}</dd></div>
              </dl>
              <ul className="mb-4 mt-4 flex w-full flex-wrap items-baseline gap-x-3 gap-y-1 border-t border-nex-white/15 pt-3">
                {(['one', 'two', 'three'] as const).map((tag, tagIndex) => (
                  <li key={tag} className="flex items-baseline gap-3">
                    {tagIndex > 0 && <span aria-hidden="true" className="text-nex-white/30">·</span>}
                    <span className="font-jost text-lg font-bold text-nex-green">{t(`items.${project.id}.tags.${tag}`)}</span>
                  </li>
                ))}
              </ul>
              {project.access === 'public' ? (
                <a href={project.url} target="_blank" rel="noopener noreferrer" className={`mt-auto inline-flex min-h-11 items-center gap-3 rounded-md bg-nex-green px-4 py-2 text-sm font-semibold text-nex-black ${FOCUS}`}>{t(project.linkKind === 'video' ? 'viewVideo' : 'visitWebsite')}<span aria-hidden="true">↗</span><span className="sr-only">{t('newTab')}</span></a>
              ) : <p className="mt-auto flex min-h-11 items-center gap-2 text-xs text-nex-white/65"><span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-nex-grey" />{t('privateAccess')}</p>}
            </div>
          </article>
        </div>
        {project.image && (
          <dialog ref={imageViewer} id="real-project-viewer" aria-labelledby="real-project-viewer-heading" onClose={() => setViewerOpen(false)} onClick={(event) => { if (event.target === event.currentTarget) imageViewer.current?.close() }} className="m-auto w-[min(94vw,1200px)] max-w-none rounded-2xl border border-nex-white/25 bg-nex-black p-4 text-nex-white shadow-2xl backdrop:bg-black/85 sm:p-5">
            <div className="mb-3 flex items-center justify-between gap-4">
              <h4 id="real-project-viewer-heading" className="text-sm font-semibold">{t(`items.${project.id}.name`)}</h4>
              <button type="button" onClick={() => imageViewer.current?.close()} className={`flex min-h-11 min-w-11 items-center justify-center rounded-full border border-nex-white/25 px-3 text-sm ${FOCUS}`}>{t('closeImage')}<span aria-hidden="true" className="ml-2">×</span></button>
            </div>
            <div className="flex justify-center">
              <Image src={project.image.src} alt={t(`items.${project.id}.alt`)} width={project.image.width} height={project.image.height} sizes="(min-width: 1280px) 1160px, 94vw" className="max-h-[72svh] w-auto max-w-full object-contain" />
            </div>
            <p className="mt-3 text-center text-xs text-nex-white/70">{t(`captions.${project.image.kind}`)}</p>
          </dialog>
        )}
      </div>
    </section>
  )
}

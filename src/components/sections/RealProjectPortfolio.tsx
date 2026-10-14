'use client'

import Image from 'next/image'
import { Fragment, useEffect, useReducer, useRef, useState, type ReactElement } from 'react'
import { useTranslations } from 'next-intl'
import { REAL_PROJECTS, REAL_PROJECT_CATEGORIES, CATEGORY_GLOW, type RealProjectCategory } from '@/content/realProjects'
import { firstIndexForCategory, realProjectSelectionReducer, type RealProjectSelection } from './realProjectSelection'
import { canPlayPortfolio, schedulePortfolioAdvance } from './portfolioPlayback'

interface RealProjectPortfolioProps {
  initialCategory?: RealProjectCategory
}

const FOCUS = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-nex-green'

export function RealProjectPortfolio({ initialCategory = 'projects' }: RealProjectPortfolioProps): ReactElement {
  const t = useTranslations('realPortfolio')
  const [selection, dispatch] = useReducer(
    realProjectSelectionReducer,
    initialCategory,
    (category: RealProjectCategory): RealProjectSelection => ({ index: firstIndexForCategory(category) })
  )
  const sectionRef = useRef<HTMLElement>(null)
  const [inView, setInView] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)
  const [hidden, setHidden] = useState(false)
  const [focused, setFocused] = useState(false)
  // Carousel auto-advance disabled permanently per user direction
  const playing = false && canPlayPortfolio({ inView, reducedMotion, hidden, focused })
  const project = REAL_PROJECTS[selection.index]
  const category = project.category
  const portrait = project.image ? project.image.height >= project.image.width * 1.6 : false

  /** Filtered list of projects for the active category */
  const categoryProjects = REAL_PROJECTS.filter((p) => p.category === category)
  /** 0-based index within the category list */
  const activeLocalIndex = categoryProjects.findIndex((p) => p.id === project.id)

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const section = sectionRef.current
    function updateEnvironment(): void {
      setHidden(document.hidden)
      setReducedMotion(media.matches)
    }
    media.addEventListener('change', updateEnvironment)
    document.addEventListener('visibilitychange', updateEnvironment)
    updateEnvironment()

    if (section && 'IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        for (const entry of entries) setInView(entry.isIntersecting)
      }, { threshold: 0.15 })
      observer.observe(section)
      return () => {
        media.removeEventListener('change', updateEnvironment)
        document.removeEventListener('visibilitychange', updateEnvironment)
        observer.disconnect()
      }
    }
    setInView(true)
    return () => {
      media.removeEventListener('change', updateEnvironment)
      document.removeEventListener('visibilitychange', updateEnvironment)
    }
  }, [])

  useEffect(() => schedulePortfolioAdvance(playing, () => dispatch({ type: 'advance' })), [playing, selection])

  return (
    <section
      ref={sectionRef}
      id="proyectos"
      aria-labelledby="real-projects-heading"
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false)
      }}
      className="scroll-mt-20 overflow-hidden bg-nex-black px-5 py-20 text-nex-white sm:px-8 lg:px-12 lg:py-28"
    >
      <div id="portfolio" className="mx-auto max-w-7xl scroll-mt-20">

        {/* ── Top Header: Brand/Eyebrow + Headline & Intro + Counter on Right ── */}
        <div className="mb-8 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="mb-2 font-dm-mono text-xs uppercase tracking-[0.2em] text-nex-green">{t('eyebrow')}</p>
            <h2 id="real-projects-heading" className="font-jost text-3xl font-semibold leading-tight sm:text-4xl lg:text-5xl">
              {t('headline')}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-zinc-400 sm:text-base">{t('intro')}</p>
          </div>

          {/* Editorial Counter on the right */}
          <div className="flex items-center gap-3">
            <span className="font-dm-mono text-sm tracking-widest text-zinc-400">
              {String(activeLocalIndex + 1).padStart(2, '0')} / {String(categoryProjects.length).padStart(2, '0')}
            </span>
          </div>
        </div>

        {/* ── Editorial Divider Line ── */}
        <div aria-hidden="true" className="mb-8 h-px w-full bg-zinc-800/60 lg:mb-10" />

        {/* ── Category Filters: Positioned below the line, directly above 01 / SCE INTERNATIONAL ── */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div role="group" aria-label={t('filterLabel')} className="flex flex-wrap gap-2">
            {REAL_PROJECT_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                aria-pressed={category === cat}
                aria-controls="real-project-panel"
                onClick={() => dispatch({ type: 'category', category: cat })}
                className={`min-h-11 rounded-full px-5 py-2 text-xs font-semibold uppercase tracking-wider transition-all sm:text-sm ${FOCUS} ${
                  category === cat
                    ? 'bg-nex-green font-bold text-nex-black shadow-[0_0_25px_rgba(0,220,130,0.35)]'
                    : 'border border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-white'
                }`}
              >
                {t(`categories.${cat}`)}
              </button>
            ))}
          </div>

          {/* Accessible screen reader & keyboard navigation controls */}
          <div className="sr-only">
            <p role="status" aria-live={playing ? 'off' : 'polite'} aria-atomic="true">
              {t(`items.${project.id}.name`)} · {t('position', { current: selection.index + 1, total: REAL_PROJECTS.length })}
            </p>
            <button
              type="button"
              aria-label={t('previous')}
              aria-controls="real-project-panel"
              onClick={() => dispatch({ type: 'step', direction: -1 })}
              className="min-h-11"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                <path d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div role="group" aria-label={t('projectSelector')}>
              {categoryProjects.map((item) => {
                const index = REAL_PROJECTS.findIndex((candidate) => candidate.id === item.id)
                const current = item.id === project.id
                return (
                  <button
                    key={item.id}
                    type="button"
                    aria-pressed={current}
                    aria-controls="real-project-panel"
                    onClick={() => dispatch({ type: 'project', index })}
                    className="min-h-11"
                  >
                    {t(`items.${item.id}.name`)}
                  </button>
                )
              })}
            </div>
            <button
              type="button"
              aria-label={t('next')}
              aria-controls="real-project-panel"
              onClick={() => dispatch({ type: 'step', direction: 1 })}
              className="min-h-11"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                <path d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* ── Panel / Stage ── */}
        <div id="real-project-panel" role="region" aria-label={t('regionLabel')} data-layout="showcase">
          <article
            key={project.id}
            data-project={project.id}
            aria-labelledby={`real-project-${project.id}`}
          >
            {/* ── DESKTOP SPLIT STAGE: 40% Description / 60% Visual (hidden on mobile) ── */}
            <div className="hidden lg:grid lg:grid-cols-2 lg:grid-cols-[2fr_3fr] lg:items-center lg:gap-12 xl:gap-16">
              {/* Left Column (40%): Editorial Project List */}
              <div className="flex flex-col space-y-6 xl:space-y-8">
                {categoryProjects.map((item, localIndex) => {
                  const globalIndex = REAL_PROJECTS.findIndex((p) => p.id === item.id)
                  const isActive = item.id === project.id
                  const num = String(localIndex + 1).padStart(2, '0')

                  return (
                    <div
                      key={item.id}
                      role="button"
                      tabIndex={0}
                      onMouseEnter={() => dispatch({ type: 'project', index: globalIndex })}
                      onClick={() => dispatch({ type: 'project', index: globalIndex })}
                      onFocus={() => dispatch({ type: 'project', index: globalIndex })}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          dispatch({ type: 'project', index: globalIndex })
                        }
                      }}
                      className={`group cursor-pointer border-l-[3px] pl-5 transition-all duration-300 xl:pl-6 ${FOCUS} ${
                        isActive
                          ? 'border-emerald-400'
                          : 'border-transparent hover:border-zinc-700'
                      }`}
                    >
                      <h3
                        id={isActive ? `real-project-${project.id}` : undefined}
                        className={`font-jost text-xl font-bold tracking-tight transition-colors duration-300 xl:text-2xl ${
                          isActive
                            ? 'text-white'
                            : 'text-zinc-600 group-hover:text-zinc-400'
                        }`}
                      >
                        {num} / {t(`items.${item.id}.name`)}
                      </h3>
                      <p
                        className={`mt-1 font-jost text-xs italic font-normal transition-colors duration-300 xl:text-sm ${
                          isActive
                            ? 'text-emerald-400'
                            : 'text-zinc-700 group-hover:text-zinc-500'
                        }`}
                      >
                        {t(`items.${item.id}.challenge`)}
                      </p>
                    </div>
                  )
                })}
              </div>

              {/* Right Column (60%): Large Visual with Floating Corner Card (Shifted more to the right) */}
              <div className="relative pb-24 xl:pb-28">
                {/* Main Visual Frame */}
                <figure className="relative w-full overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950/80 shadow-2xl">
                  <div
                    className={`relative flex w-full items-center justify-center ${
                      portrait
                        ? 'h-[260px] sm:h-[400px] lg:h-[500px]'
                        : 'h-[200px] sm:h-[350px] lg:h-[390px] xl:h-[430px]'
                    }`}
                  >
                    {/* Subtle category aura */}
                    <div
                      aria-hidden="true"
                      className={`absolute left-1/2 top-1/2 h-3/4 w-3/4 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl from-nex-green/20 ${CATEGORY_GLOW[category]}`}
                    />

                    {project.image ? (
                      <div
                        className={`relative flex h-full w-full items-center justify-center p-3 sm:p-5 ${
                          portrait ? 'aspect-[9/20] py-4' : ''
                        }`}
                      >
                        <div className="relative h-full w-full overflow-hidden rounded-xl">
                          <Image
                            src={project.image.src}
                            alt={t(`items.${project.id}.alt`)}
                            fill
                            sizes="(min-width: 1280px) 700px, 60vw"
                            className="object-contain drop-shadow-2xl"
                            priority
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="p-8 text-center">
                        <p className="mb-2 font-dm-mono text-xs uppercase tracking-widest text-nex-green">
                          {t('privateProject')}
                        </p>
                        <p className="font-jost text-xl font-semibold text-white">{t(`items.${project.id}.name`)}</p>
                        <p className="mt-2 text-xs text-zinc-500">{t('privateCover')}</p>
                      </div>
                    )}
                  </div>
                  <figcaption className="sr-only">
                    {t(`captions.${project.image?.kind ?? 'pending'}`)}
                  </figcaption>
                </figure>

                {/* Floating Glassmorphic Card (Positioned 50% in, 50% out on bottom, and shifted further right) */}
                <div className="absolute bottom-24 lg:bottom-28 translate-y-1/2 -right-3 sm:-right-5 lg:-right-6 xl:-right-8 z-20 max-w-[360px] xl:max-w-[400px] rounded-2xl border border-emerald-500/40 bg-[#0c100e]/95 p-5 xl:p-6 shadow-[0_20px_50px_rgba(0,0,0,0.9)] ring-1 ring-emerald-500/20 backdrop-blur-xl">
                  {/* Solution text */}
                  <p className="font-jost text-xs leading-relaxed text-zinc-300 xl:text-sm">
                    {t(`items.${project.id}.solution`)}
                  </p>

                  {/* Tags with Emerald Bullets */}
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] font-medium text-zinc-400 xl:text-xs">
                    {(['one', 'two', 'three'] as const).map((tag, tagIndex) => (
                      <Fragment key={tag}>
                        {tagIndex > 0 && (
                          <span aria-hidden="true" className="font-bold text-emerald-400">
                            •
                          </span>
                        )}
                        <span>{t(`items.${project.id}.tags.${tag}`)}</span>
                      </Fragment>
                    ))}
                  </div>

                  {/* CTA Action */}
                  <div className="mt-4 pt-1">
                    {project.access === 'public' ? (
                      <a
                        href={project.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`group inline-flex items-center gap-2 text-xs font-bold tracking-wider uppercase text-emerald-400 transition-colors hover:text-emerald-300 ${FOCUS}`}
                      >
                        <span className="border-b border-emerald-500/50 pb-0.5 transition-colors group-hover:border-emerald-300">
                          {t(project.linkKind === 'video' ? 'viewVideo' : 'visitWebsite')}
                        </span>
                        <svg
                          aria-hidden="true"
                          className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                        <span className="sr-only">{t('newTab')}</span>
                      </a>
                    ) : (
                      <div className="inline-flex items-center gap-2 border-b border-zinc-800 pb-0.5 text-xs font-semibold tracking-wider uppercase text-zinc-500">
                        <span className="h-1.5 w-1.5 rounded-full bg-zinc-600 animate-pulse" />
                        <span>{t('privateAccess')}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* ── MOBILE ACCORDION (lg:hidden): Tap to reveal image and card in-place ── */}
            <div className="flex flex-col divide-y divide-zinc-800/60 lg:hidden">
              {categoryProjects.map((item, localIndex) => {
                const globalIndex = REAL_PROJECTS.findIndex((p) => p.id === item.id)
                const isActive = item.id === project.id
                const num = String(localIndex + 1).padStart(2, '0')

                return (
                  <div key={item.id} className="py-4">
                    {/* Project Header (Tap to toggle) */}
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => dispatch({ type: 'project', index: globalIndex })}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          dispatch({ type: 'project', index: globalIndex })
                        }
                      }}
                      className={`group flex cursor-pointer flex-col border-l-[3px] pl-4 transition-all duration-300 ${FOCUS} ${
                        isActive ? 'border-emerald-400' : 'border-transparent hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <h4
                          className={`font-jost text-lg font-bold tracking-tight transition-colors duration-300 sm:text-xl ${
                            isActive ? 'text-white' : 'text-zinc-500'
                          }`}
                        >
                          {num} / {t(`items.${item.id}.name`)}
                        </h4>
                        <span
                          className={`text-xs transition-transform duration-300 ${
                            isActive ? 'rotate-90 text-emerald-400' : 'text-zinc-600'
                          }`}
                        >
                          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-4 w-4">
                            <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </span>
                      </div>
                      <p
                        className={`mt-1 font-jost text-xs italic font-normal transition-colors duration-300 sm:text-sm ${
                          isActive ? 'text-emerald-400' : 'text-zinc-600'
                        }`}
                      >
                        {t(`items.${item.id}.challenge`)}
                      </p>
                    </div>

                    {/* In-place Visual + Details when active on mobile */}
                    {isActive && (
                      <div className="mt-4 space-y-3 pl-4 sm:pl-5">
                        {/* Mobile Image */}
                        {project.image ? (
                          <div className="relative h-[200px] sm:h-[260px] w-full overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950/90 shadow-lg">
                            <Image
                              src={project.image.src}
                              alt={t(`items.${project.id}.alt`)}
                              fill
                              sizes="100vw"
                              className="object-contain p-2"
                              priority
                            />
                          </div>
                        ) : (
                          <div className="rounded-xl border border-zinc-800 bg-zinc-950/80 p-6 text-center">
                            <p className="mb-2 font-dm-mono text-xs uppercase tracking-widest text-nex-green">
                              {t('privateProject')}
                            </p>
                            <p className="font-jost text-lg font-semibold text-white">{t(`items.${project.id}.name`)}</p>
                            <p className="mt-1 text-xs text-zinc-500">{t('privateCover')}</p>
                          </div>
                        )}

                        {/* Mobile Details Card */}
                        <div className="rounded-xl border border-emerald-500/30 bg-[#0f1412]/95 p-5 shadow-lg ring-1 ring-emerald-500/20">
                          <p className="font-jost text-xs leading-relaxed text-zinc-300 sm:text-sm">
                            {t(`items.${project.id}.solution`)}
                          </p>
                          <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] font-medium text-zinc-400">
                            {(['one', 'two', 'three'] as const).map((tag, tagIndex) => (
                              <Fragment key={tag}>
                                {tagIndex > 0 && (
                                  <span aria-hidden="true" className="font-bold text-emerald-400">
                                    •
                                  </span>
                                )}
                                <span>{t(`items.${project.id}.tags.${tag}`)}</span>
                              </Fragment>
                            ))}
                          </div>
                          <div className="mt-4 pt-1">
                            {project.access === 'public' ? (
                              <a
                                href={project.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`group inline-flex items-center gap-2 text-xs font-bold tracking-wider uppercase text-emerald-400 transition-colors hover:text-emerald-300 ${FOCUS}`}
                              >
                                <span className="border-b border-emerald-500/50 pb-0.5">
                                  {t(project.linkKind === 'video' ? 'viewVideo' : 'visitWebsite')}
                                </span>
                                <svg
                                  aria-hidden="true"
                                  className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2.5"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                </svg>
                                <span className="sr-only">{t('newTab')}</span>
                              </a>
                            ) : (
                              <div className="inline-flex items-center gap-2 border-b border-zinc-800 pb-0.5 text-xs font-semibold tracking-wider uppercase text-zinc-500">
                                <span className="h-1.5 w-1.5 rounded-full bg-zinc-600 animate-pulse" />
                                <span>{t('privateAccess')}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </article>
        </div>
      </div>
    </section>
  )
}

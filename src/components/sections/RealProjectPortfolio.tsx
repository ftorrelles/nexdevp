'use client'

import Image from 'next/image'
import { useEffect, useRef, useState, type ReactElement } from 'react'
import { useTranslations } from 'next-intl'
import { getProjectIndex, getRealProjects, REAL_PROJECT_CATEGORIES, type RealProjectCategory } from '@/content/realProjects'

interface RealProjectPortfolioProps {
  initialCategory?: RealProjectCategory
}

const STAGE_HEIGHT = 680
const LAYERS = ['z-10', 'z-20', 'z-30'] as const
const FOCUS = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-nex-green'

export function RealProjectPortfolio({ initialCategory = 'projects' }: RealProjectPortfolioProps): ReactElement {
  const t = useTranslations('realPortfolio')
  const [category, setCategory] = useState(initialCategory)
  const [active, setActive] = useState(0)
  const [stacked, setStacked] = useState(false)
  const viewport = useRef<HTMLDivElement>(null)
  const projects = getRealProjects(category)

  useEffect(() => {
    const element = viewport.current
    if (!element) return
    const media = window.matchMedia('(min-width: 1024px) and (min-height: 820px) and (prefers-reduced-motion: no-preference)')
    const contents = Array.from(element.querySelectorAll<HTMLElement>('[data-project-content]'))
    const measure = (): void => {
      const fits = contents.every((content) => content.getBoundingClientRect().height <= STAGE_HEIGHT - 64)
      setStacked(media.matches && fits)
    }
    const observer = new ResizeObserver(measure)
    contents.forEach((content) => observer.observe(content))
    media.addEventListener('change', measure)
    measure()
    return () => {
      observer.disconnect()
      media.removeEventListener('change', measure)
    }
  }, [category])

  function selectCategory(next: RealProjectCategory): void {
    setCategory(next)
    setActive(0)
    viewport.current?.scrollTo({ top: 0, behavior: 'instant' })
  }

  function revealProject(index: number, smooth = true): void {
    if (!stacked) return
    viewport.current?.scrollTo({ top: index * STAGE_HEIGHT, behavior: smooth ? 'smooth' : 'instant' })
  }

  return (
    <section id="proyectos" aria-labelledby="real-projects-heading" className="scroll-mt-20 bg-nex-black px-4 py-16 text-nex-white sm:px-6 lg:px-12 lg:py-24">
      <div id="portfolio" className="mx-auto max-w-6xl scroll-mt-20">
        <p className="mb-4 font-dm-mono text-xs uppercase tracking-[0.2em] text-nex-green">{t('eyebrow')}</p>
        <h2 id="real-projects-heading" className="max-w-4xl font-jost text-4xl font-semibold leading-[1.08] sm:text-5xl lg:text-6xl">{t('headline')}</h2>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-nex-grey">{t('intro')}</p>
        <div role="group" aria-label={t('filterLabel')} className="my-8 flex flex-wrap gap-2">
          {REAL_PROJECT_CATEGORIES.map((item) => (
            <button key={item} type="button" aria-pressed={category === item} aria-controls="real-project-list" onClick={() => selectCategory(item)} className={`min-h-11 rounded-full border px-5 py-2 text-sm ${FOCUS} ${category === item ? 'border-nex-green bg-nex-green font-semibold text-nex-black' : 'border-nex-grey/40 text-nex-white hover:border-nex-green'}`}>
              {t(`categories.${item}`)}
            </button>
          ))}
        </div>
        <p className="mb-3 text-sm text-nex-grey">{stacked ? t('scrollHint') : t('listHint')}</p>
        <div
          id="real-project-list"
          ref={viewport}
          role="region"
          aria-label={t('regionLabel')}
          tabIndex={stacked ? 0 : undefined}
          data-layout={stacked ? 'stacked' : 'list'}
          onScroll={(event) => { if (stacked) setActive(getProjectIndex(event.currentTarget.scrollTop, STAGE_HEIGHT, projects.length)) }}
          className={`relative isolate rounded-2xl ${FOCUS} ${stacked ? 'h-[680px] overflow-y-auto motion-reduce:h-auto motion-reduce:overflow-visible' : 'space-y-6'}`}
        >
          {projects.map((project, index) => (
            <article key={project.id} data-project={project.id} aria-labelledby={`real-project-${project.id}`} onFocusCapture={() => revealProject(index, false)} className={`border border-nex-grey/25 bg-nex-dark p-5 sm:p-8 ${stacked ? `sticky top-0 flex min-h-[680px] items-center motion-reduce:static motion-reduce:min-h-0 ${LAYERS[index]}` : 'rounded-2xl'}`}>
              <div data-project-content className="grid w-full min-w-0 gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:items-center">
                <figure className="min-w-0">
                  <div className="flex min-h-56 items-center justify-center overflow-hidden rounded-lg bg-nex-black sm:min-h-72 lg:h-[460px]">
                    {project.image ? (
                      <Image src={project.image.src} alt={t(`items.${project.id}.alt`)} width={project.image.width} height={project.image.height} sizes="(min-width: 1280px) 610px, (min-width: 1024px) 55vw, 90vw" className="h-auto max-h-[460px] w-full object-contain" />
                    ) : (
                      <div className="w-full px-7 py-16">
                        <p className="mb-8 font-dm-mono text-xs uppercase tracking-widest text-nex-green">{t('privateProject')}</p>
                        <p className="max-w-sm break-words font-jost text-4xl font-semibold sm:text-5xl">{t(`items.${project.id}.name`)}</p>
                        <p className="mt-6 max-w-sm text-base leading-relaxed text-nex-grey">{t('privateCover')}</p>
                      </div>
                    )}
                  </div>
                  <figcaption className="mt-3 text-xs leading-relaxed text-nex-grey">{t(`captions.${project.image?.kind ?? 'pending'}`)}</figcaption>
                </figure>
                <div className="min-w-0">
                  <p className="mb-5 font-dm-mono text-xs uppercase tracking-[0.15em] text-nex-green">{t(`relationships.${project.relationship}`)} <span aria-hidden="true"> / {String(index + 1).padStart(2, '0')}</span></p>
                  <h3 id={`real-project-${project.id}`} className="break-words font-jost text-3xl font-semibold leading-tight sm:text-4xl">{t(`items.${project.id}.name`)}</h3>
                  <dl className="mt-7 space-y-5 text-sm leading-relaxed">
                    <div><dt className="mb-1 font-semibold text-nex-white">{t('challenge')}</dt><dd className="text-nex-grey">{t(`items.${project.id}.challenge`)}</dd></div>
                    <div><dt className="mb-1 font-semibold text-nex-white">{t('solution')}</dt><dd className="text-nex-grey">{t(`items.${project.id}.solution`)}</dd></div>
                  </dl>
                  <ul className="my-6 flex flex-wrap gap-x-4 gap-y-2 border-t border-nex-grey/20 pt-5 text-xs text-nex-white">
                    {(['one', 'two', 'three'] as const).map((tag) => <li key={tag}>{t(`items.${project.id}.tags.${tag}`)}</li>)}
                  </ul>
                  {project.access === 'public' ? (
                    <a href={project.url} target="_blank" rel="noopener noreferrer" className={`inline-flex min-h-11 items-center gap-3 border-b border-nex-green text-sm font-semibold text-nex-green ${FOCUS}`}>
                      {t(project.linkKind === 'video' ? 'viewVideo' : 'visitWebsite')} <span aria-hidden="true">↗</span><span className="sr-only">{t('newTab')}</span>
                    </a>
                  ) : <p className="text-sm text-nex-grey">{t('privateAccess')}</p>}
                </div>
              </div>
            </article>
          ))}
        </div>
        {stacked && (
          <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
            <p aria-live="polite" aria-atomic="true" className="text-sm text-nex-grey">{t('position', { current: active + 1, total: projects.length })} · {t(`items.${projects[active].id}.name`)}</p>
            <div className="flex gap-2">
              <button type="button" disabled={active === 0} onClick={() => revealProject(active - 1)} className={`min-h-11 rounded-full border border-nex-grey/40 px-5 text-sm disabled:opacity-40 ${FOCUS}`}>{t('previous')}</button>
              <button type="button" disabled={active === projects.length - 1} onClick={() => revealProject(active + 1)} className={`min-h-11 rounded-full border border-nex-grey/40 px-5 text-sm disabled:opacity-40 ${FOCUS}`}>{t('next')}</button>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

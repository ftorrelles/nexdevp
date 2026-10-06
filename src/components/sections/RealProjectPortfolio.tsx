'use client'

import Image from 'next/image'
import { useState, type ReactElement } from 'react'
import { useTranslations } from 'next-intl'
import { getRealProjects, REAL_PROJECT_CATEGORIES, type RealProjectCategory } from '@/content/realProjects'

interface RealProjectPortfolioProps {
  initialCategory?: RealProjectCategory
}

const FOCUS = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-nex-green'

export function RealProjectPortfolio({ initialCategory = 'projects' }: RealProjectPortfolioProps): ReactElement {
  const t = useTranslations('realPortfolio')
  const [category, setCategory] = useState(initialCategory)
  const projects = getRealProjects(category)

  return (
    <section id="proyectos" aria-labelledby="real-projects-heading" className="scroll-mt-20 bg-nex-black px-4 py-16 text-nex-white sm:px-6 lg:px-12 lg:py-24">
      <div id="portfolio" className="mx-auto max-w-6xl scroll-mt-20">
        <p className="mb-4 font-dm-mono text-xs uppercase tracking-[0.2em] text-nex-green">{t('eyebrow')}</p>
        <h2 id="real-projects-heading" className="max-w-4xl font-jost text-4xl font-semibold leading-[1.08] sm:text-5xl lg:text-6xl">{t('headline')}</h2>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-nex-grey">{t('intro')}</p>
        <div role="group" aria-label={t('filterLabel')} className="mb-8 mt-8 flex gap-2 sm:mt-10 sm:gap-3">
          {REAL_PROJECT_CATEGORIES.map((item) => (
            <button key={item} type="button" aria-pressed={category === item} aria-controls="real-project-list" onClick={() => setCategory(item)} className={`min-h-11 min-w-0 flex-1 rounded-full border px-2 py-2 text-xs sm:flex-none sm:px-5 sm:text-sm ${FOCUS} ${category === item ? 'border-nex-green bg-nex-green font-semibold text-nex-black' : 'border-nex-grey/40 text-nex-white hover:border-nex-green'}`}>
              {t(`categories.${item}`)}
            </button>
          ))}
        </div>
        <div
          id="real-project-list"
          role="region"
          aria-label={t('regionLabel')}
          data-layout="list"
          className="space-y-12 sm:space-y-16"
        >
          {projects.map((project, index) => (
            <article key={project.id} data-project={project.id} aria-labelledby={`real-project-${project.id}`} className="min-w-0">
              <figure className="min-w-0">
                <div className={`relative flex items-center justify-center rounded-2xl border border-nex-grey/20 bg-nex-dark ${project.image ? 'aspect-square sm:aspect-[16/10]' : 'min-h-80 sm:min-h-96'}`}>
                  {project.image ? (
                    <Image src={project.image.src} alt={t(`items.${project.id}.alt`)} fill sizes="(min-width: 1280px) 1152px, (min-width: 1024px) calc(100vw - 96px), (min-width: 640px) calc(100vw - 48px), calc(100vw - 32px)" className="object-contain p-4 sm:p-6 lg:p-8" />
                  ) : (
                    <div className="w-full px-6 py-8 text-center sm:px-12 sm:py-16">
                      <p className="mb-6 font-dm-mono text-xs uppercase tracking-widest text-nex-green">{t('privateProject')}</p>
                      <p className="mx-auto max-w-2xl break-words font-jost text-3xl font-semibold sm:text-5xl lg:text-6xl">{t(`items.${project.id}.name`)}</p>
                      <p className="mx-auto mt-6 max-w-lg text-sm leading-relaxed text-nex-grey sm:text-base">{t('privateCover')}</p>
                    </div>
                  )}
                </div>
                <figcaption className="mt-3 text-xs leading-relaxed text-nex-grey">{t(`captions.${project.image?.kind ?? 'pending'}`)}</figcaption>
              </figure>
              <div className="mt-6 min-w-0 sm:mt-8">
                <p className="mb-3 font-dm-mono text-xs uppercase tracking-[0.15em] text-nex-green">{t(`relationships.${project.relationship}`)} <span aria-hidden="true"> / {String(index + 1).padStart(2, '0')}</span></p>
                <h3 id={`real-project-${project.id}`} className="break-words font-jost text-3xl font-semibold leading-tight sm:text-4xl">{t(`items.${project.id}.name`)}</h3>
                <dl className="mt-5 grid max-w-4xl gap-5 text-sm leading-relaxed sm:grid-cols-2 sm:gap-8">
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
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

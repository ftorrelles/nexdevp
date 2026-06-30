'use client'

import { useState, useRef, useEffect } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { PROJECTS, type ProjectCategory } from '@/content/projects'

type Filter = 'all' | ProjectCategory

const FILTERS: { label: { es: string; en: string }; value: Filter }[] = [
  { label: { es: 'Todos', en: 'All' }, value: 'all' },
  { label: { es: 'IA & Agentes', en: 'AI & Agents' }, value: 'ai' },
  { label: { es: 'Sistemas', en: 'Systems' }, value: 'systems' },
  { label: { es: 'Web', en: 'Web' }, value: 'web' },
]

const CATEGORY_LABEL: Record<ProjectCategory, string> = {
  ai: 'AI',
  systems: 'System',
  web: 'Web',
}

function ExternalIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2.5 9.5l7-7M9.5 2.5H5.5M9.5 2.5v4" />
    </svg>
  )
}

function ProjectCard({ project, index }: { project: typeof PROJECTS[0]; index: number }) {
  const locale = useLocale() as 'es' | 'en'
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect() } },
      { threshold: 0.08 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  const isBig = project.colSpan === 2 && project.rowSpan === 2
  const isTall = project.colSpan === 1 && project.rowSpan === 2

  // Spans only apply from sm/lg up — mobile is a single column
  const spanClasses = [
    project.colSpan >= 2 ? 'sm:col-span-2' : '',
    project.rowSpan === 2 ? 'lg:row-span-2' : '',
  ].join(' ')

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${(index % 5) * 50}ms` }}
      className={[
        'group relative rounded-2xl border border-white/[0.08] overflow-hidden cursor-default',
        'transition-all duration-500 ease-out',
        'hover:border-white/20 hover:-translate-y-0.5 hover:shadow-2xl',
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8',
        spanClasses,
        isBig || isTall ? 'min-h-[240px] lg:min-h-[320px]' : 'min-h-[160px]',
      ].join(' ')}
    >
      {/* Base */}
      <div className="absolute inset-0 bg-nex-dark" />

      {/* Gradient overlay */}
      <div className={`absolute inset-0 bg-gradient-to-br ${project.gradient} opacity-60`} />

      {/* Top glow — always visible on featured card */}
      <div
        className={`absolute -top-12 -right-12 w-40 h-40 rounded-full blur-3xl transition-opacity duration-700 ${isBig ? 'opacity-15 group-hover:opacity-30' : 'opacity-10 group-hover:opacity-25'}`}
        style={{ background: project.accent }}
      />

      {/* Shimmer sweep on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none overflow-hidden rounded-2xl">
        <div
          className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out"
          style={{ background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.045) 50%, transparent 60%)' }}
        />
      </div>

      {/* Bottom line accent */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: `linear-gradient(to right, transparent, ${project.accent}, transparent)` }}
      />

      {/* Content */}
      <div className="relative h-full flex flex-col justify-between p-5 md:p-6">
        {/* Top */}
        <div>
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <span
                className="font-dm-mono text-[9px] tracking-[0.2em] uppercase px-2 py-0.5 rounded"
                style={{ color: project.accent, background: `${project.accent}15` }}
              >
                {CATEGORY_LABEL[project.category]}
              </span>
              {project.year && (
                <span className="font-dm-mono text-[9px] tracking-[0.1em] text-nex-grey/60">
                  {project.year}
                </span>
              )}
            </div>
            {project.liveUrl && (
              <a
                href={project.liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1 font-dm-mono text-[9px] tracking-wider uppercase transition-all duration-200 opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0"
                style={{ color: project.accent }}
              >
                Ver <ExternalIcon />
              </a>
            )}
          </div>

          <h3
            className={[
              'font-jost font-bold text-nex-white leading-tight',
              isBig ? 'text-2xl md:text-[2rem] mb-3' : isTall ? 'text-xl mb-3' : 'text-base mb-2',
            ].join(' ')}
          >
            {project.name}
          </h3>

          <p
            className={[
              'text-nex-grey leading-relaxed',
              isBig ? 'text-sm md:text-[0.95rem] max-w-sm' : isTall ? 'text-sm max-w-[220px]' : 'text-xs line-clamp-2',
            ].join(' ')}
          >
            {project.description[locale]}
          </p>
        </div>

        {/* Stack */}
        <div className="flex flex-wrap gap-1.5 mt-5">
          {project.stack.slice(0, isBig ? 7 : isTall ? 4 : 3).map((tech) => (
            <span
              key={tech}
              className="font-dm-mono text-[9px] tracking-[0.08em] uppercase px-2 py-[3px] rounded bg-white/[0.04] border border-white/[0.07] text-nex-grey/80"
            >
              {tech}
            </span>
          ))}
          {project.stack.length > (isBig ? 7 : isTall ? 4 : 3) && (
            <span className="font-dm-mono text-[9px] tracking-[0.08em] uppercase px-2 py-[3px] rounded bg-white/[0.04] border border-white/[0.07] text-nex-grey/50">
              +{project.stack.length - (isBig ? 7 : isTall ? 4 : 3)}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

export function Portfolio() {
  const t = useTranslations('portfolio')
  const locale = useLocale() as 'es' | 'en'
  const [filter, setFilter] = useState<Filter>('all')

  const filtered = filter === 'all'
    ? PROJECTS
    : PROJECTS.filter((p) => p.category === filter)

  // When filtered, reset big cards to col-span-1 so grid doesn't break
  const normalized = filtered.map((p) =>
    filter !== 'all' ? { ...p, colSpan: 1 as const, rowSpan: 1 as const } : p
  )

  return (
    <section id="portfolio" className="py-24 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <p className="font-dm-mono text-[11px] tracking-[0.25em] uppercase text-nex-green mb-4">
            {t('eyebrow')}
          </p>
          <h2 className="font-jost font-bold text-4xl md:text-5xl text-nex-white leading-tight mb-4">
            {t('headline')}
          </h2>
          <p className="text-nex-grey text-lg max-w-xl">{t('sub')}</p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-10">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={[
                'font-jost text-sm px-4 py-2 rounded-lg border transition-all duration-200',
                filter === f.value
                  ? 'bg-nex-green text-nex-black border-nex-green font-bold'
                  : 'bg-nex-dark text-nex-grey border-white/10 hover:border-white/30',
              ].join(' ')}
            >
              {f.label[locale]}
            </button>
          ))}
        </div>

        {/* Bento grid — 1 col mobile, 2 cols tablet, 3 cols desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 [grid-auto-flow:dense]">
          {normalized.map((project, i) => (
            <ProjectCard key={project.id} project={project} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}

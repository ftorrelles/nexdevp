'use client'

import { useState, type ReactElement } from 'react'
import { useTranslations } from 'next-intl'
import { MarketResearchPreview } from './MarketResearchPreview'
import { UseCasePreview } from './UseCasePreview'
import { USE_CASE_IDS, type UseCaseId } from './useCaseSimulation'

export function Portfolio(): ReactElement {
  const t = useTranslations('useCases')
  const [selected, setSelected] = useState<UseCaseId>('construction')

  return (
    <section id="casos" aria-labelledby="use-cases-heading" className="scroll-mt-20 bg-nex-black px-6 py-16 text-nex-white lg:px-12 lg:py-24">
      <div className="mx-auto max-w-6xl scroll-mt-20">
        <p className="mb-4 font-dm-mono text-xs uppercase tracking-[0.2em] text-nex-green">{t('eyebrow')}</p>
        <h2 id="use-cases-heading" className="mb-4 font-jost text-3xl font-semibold leading-tight sm:text-4xl lg:text-5xl">{t('headline')}</h2>
        <p className="mb-7 max-w-3xl text-base leading-relaxed text-nex-grey">{t('scope')}</p>
        <div role="group" aria-label={t('selection')} className="mb-8 flex flex-wrap gap-2">
          {USE_CASE_IDS.map((id) => (
            <button
              key={id}
              type="button"
              aria-pressed={selected === id}
              aria-controls="use-case-story"
              onClick={() => setSelected(id)}
              className={`min-h-11 rounded-lg border px-4 py-2 text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-nex-green ${selected === id ? 'border-nex-green bg-nex-green font-semibold text-nex-black' : 'tab-breathe border-white/20 bg-nex-dark text-nex-grey hover:border-nex-green/60 hover:text-nex-white'}`}
            >
              {t(`cases.${id}.label`)}
            </button>
          ))}
        </div>
        <div id="use-case-story" className="grid min-w-0 gap-7 lg:grid-cols-[3fr_2fr] lg:items-start">
          <div key={selected} className="min-w-0">
            <p className="mb-2 font-dm-mono text-xs uppercase tracking-wider text-nex-green">{t(`cases.${selected}.label`)}</p>
            <h3 className="mb-3 font-jost text-2xl font-semibold sm:text-3xl">{t(`cases.${selected}.title`)}</h3>
            <p className="mb-5 text-sm leading-relaxed text-nex-grey">{t(`cases.${selected}.interaction`)}</p>
            {selected === 'research' ? <MarketResearchPreview /> : <UseCasePreview caseId={selected} />}
            <p className="mt-3 text-xs text-nex-grey">{t('preview.demo')}</p>
          </div>
          <div className="space-y-6 lg:pt-12">
            <div><h4 className="mb-2 font-dm-mono text-xs uppercase tracking-wider text-nex-green">{t('challenge')}</h4><p className="text-sm leading-relaxed text-nex-grey">{t(`cases.${selected}.problem`)}</p></div>
            <div><h4 className="mb-2 font-dm-mono text-xs uppercase tracking-wider text-nex-green">{t('solution')}</h4><p className="text-sm leading-relaxed text-nex-grey">{t(`cases.${selected}.solution`)}</p></div>
            <ul className="space-y-3">{[0, 1, 2].map((index) => <li key={index} className="rounded-lg border border-white/15 bg-nex-dark p-4 text-sm"><span className="mr-3 font-dm-mono text-xs text-nex-green">0{index + 1}</span>{t(`cases.${selected}.benefits.${index}`)}</li>)}</ul>
            <a href="#contacto" className="inline-flex min-h-11 items-center gap-4 rounded-md bg-nex-green px-5 text-sm font-semibold text-nex-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-nex-green">{t('contact')}<span aria-hidden="true">↗</span></a>
          </div>
        </div>
        <p className="mt-7 border-t border-white/10 pt-5 text-xs leading-relaxed text-nex-grey">{t('disclaimer')}</p>
      </div>
    </section>
  )
}

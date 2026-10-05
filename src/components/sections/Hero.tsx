import type { ReactElement } from 'react'
import { getTranslations } from 'next-intl/server'
import { HeroGoalRail } from './HeroGoalRail'
import { HeroMesh } from './HeroMesh'

export async function Hero(): Promise<ReactElement> {
  const t = await getTranslations('hero.solutionFirst')

  return (
    <section id="hero" aria-labelledby="hero-heading" className="relative isolate overflow-hidden bg-nex-black px-6 pb-12 pt-12 text-nex-white sm:pb-16 sm:pt-16 lg:px-16 lg:pt-20">
      <HeroMesh />
      <div className="relative z-10 mx-auto w-full max-w-7xl">
        <p className="mb-6 flex items-center gap-3 font-dm-mono text-[11px] uppercase tracking-[0.18em] text-nex-white/70">
          <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-nex-green" />
          {t('eyebrow')}
        </p>

        <h1 id="hero-heading" className="font-jost text-[clamp(2.5rem,6.2vw,5.5rem)] font-semibold leading-[1.08] tracking-[-0.045em]">
          {t('headline')}
          <span className="block text-nex-green">{t('headlineAccent')}</span>
        </h1>

        <div className="mt-7 flex flex-col gap-7 lg:mt-10 lg:flex-row lg:items-center lg:justify-between lg:gap-12">
          <p className="max-w-md font-jost text-base leading-relaxed text-nex-white/70 sm:text-lg">
            {t('support')}
          </p>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <a
              href="#contacto"
              className="inline-flex min-h-12 items-center justify-center gap-6 rounded-md bg-nex-green px-6 py-3 font-jost text-sm font-semibold text-black hover:bg-nex-green/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-nex-green"
            >
              {t('primaryCta')}
              <span aria-hidden="true">↗</span>
            </a>
            <a
              href="#casos"
              className="inline-flex min-h-12 items-center gap-3 rounded-sm py-3 font-jost text-sm text-nex-white underline decoration-nex-white/30 underline-offset-4 hover:decoration-nex-green focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-nex-green"
            >
              {t('secondaryCta')}
              <span aria-hidden="true">↓</span>
            </a>
          </div>
        </div>

        <HeroGoalRail />
      </div>
    </section>
  )
}

import { getTranslations } from 'next-intl/server'

const STEP_ICONS = [
  <svg key="search" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>,
  <svg key="code" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>,
  <svg key="rocket" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
]

export async function Methodology() {
  const t = await getTranslations('methodology')

  const steps = [
    { number: t('step1.number'), title: t('step1.title'), description: t('step1.description'), icon: STEP_ICONS[0] },
    { number: t('step2.number'), title: t('step2.title'), description: t('step2.description'), icon: STEP_ICONS[1] },
    { number: t('step3.number'), title: t('step3.title'), description: t('step3.description'), icon: STEP_ICONS[2] },
  ]

  return (
    <section className="bg-nex-black py-24 px-6 lg:px-12">
      <div className="max-w-6xl mx-auto">
        <p className="font-dm-mono text-xs text-nex-green uppercase tracking-[0.2em] mb-4">
          {t('eyebrow')}
        </p>
        <h2 className="font-jost font-bold text-4xl lg:text-5xl text-nex-white mb-16">
          {t('heading')} <span className="text-nex-green">{t('heading_accent')}</span>
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 relative">
          {steps.map((step, index) => (
            <div key={step.number} className="relative flex flex-col lg:flex-row">
              <div className="flex-1 pb-12 lg:pb-0 lg:pr-8">
                {/* Icon circle */}
                <div className="w-14 h-14 rounded-full bg-nex-green/10 border border-nex-green/30 flex items-center justify-center text-nex-green mb-6">
                  {step.icon}
                </div>
                <p className="font-dm-mono text-xs text-nex-green/50 mb-2">{step.number}</p>
                <h3 className="font-jost font-bold text-xl text-nex-white mb-3">{step.title}</h3>
                <p className="font-jost text-sm text-nex-grey leading-relaxed">{step.description}</p>
              </div>

              {/* Dashed connector — visible between steps on desktop */}
              {index < steps.length - 1 && (
                <div className="hidden lg:flex items-start pt-7 pl-4 pr-4 text-nex-green/20">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} strokeDasharray="4 2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

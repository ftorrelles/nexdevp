import { getTranslations } from 'next-intl/server'
import { SectionShell } from '@/components/editorial/SectionShell'
import { Reveal } from '@/components/editorial/Reveal'

export async function Methodology() {
  const t = await getTranslations('methodology')

  const steps = [
    { number: t('step1.number'), title: t('step1.title'), description: t('step1.description') },
    { number: t('step2.number'), title: t('step2.title'), description: t('step2.description') },
    { number: t('step3.number'), title: t('step3.title'), description: t('step3.description') },
  ]

  return (
    <div className="bg-surface">
      <SectionShell eyebrow={t('eyebrow')} heading={t('heading')}>
        <div className="flex flex-col xl:flex-row xl:items-start gap-0 xl:gap-0">
          {steps.map((step, index) => (
            <div key={step.number} className="flex xl:flex-row flex-col xl:flex-1">
              <Reveal className="flex-1">
                <div className="p-6 xl:p-8">
                  <span className="font-dm-mono text-4xl text-accent/30 block mb-4">
                    {step.number}
                  </span>
                  <h3 className="font-cormorant text-2xl text-cream mb-3">{step.title}</h3>
                  <p className="font-jost text-sm text-muted leading-relaxed">{step.description}</p>
                </div>
              </Reveal>
              {index < steps.length - 1 && (
                <div className="hidden xl:flex items-center px-4 text-accent/40 text-3xl font-dm-mono self-center">
                  {t('connector')}
                </div>
              )}
            </div>
          ))}
        </div>
      </SectionShell>
    </div>
  )
}

import { getTranslations } from 'next-intl/server'
import { SectionShell } from '@/components/editorial/SectionShell'
import { Card } from '@/components/editorial/Card'
import { Reveal } from '@/components/editorial/Reveal'
import { BookingDialog } from '@/components/cta/BookingDialog'
import { pick } from '@/content/types'
import type { Service, Locale } from '@/content/types'

interface ServicesProps {
  services: Service[]
  locale: Locale
}

export async function Services({ services, locale }: ServicesProps) {
  const t = await getTranslations('services')

  return (
    <section id="services" className="bg-black">
      <SectionShell eyebrow={t('eyebrow')} heading={t('heading')}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {services.map((service) => (
            <Reveal key={service.id}>
              <Card className="flex flex-col h-full">
                <p className="font-dm-mono text-xs text-accent uppercase tracking-widest mb-3">
                  Pain
                </p>
                <h3 className="font-cormorant text-xl text-cream mb-4 leading-snug">
                  {pick(service.painHeadline, locale)}
                </h3>
                <p className="font-dm-mono text-xs text-accent uppercase tracking-widest mb-2">
                  Solution
                </p>
                <p className="font-jost text-sm text-muted leading-relaxed mb-4">
                  {pick(service.whatWeBuilt, locale)}
                </p>
                <p className="font-dm-mono text-xs text-accent uppercase tracking-widest mb-2">
                  Outcome
                </p>
                <p className="font-jost text-sm text-muted leading-relaxed mb-6 flex-1">
                  {pick(service.outcome, locale)}
                </p>
                <BookingDialog
                  triggerLabel={pick(service.ctaLabel, locale)}
                />
              </Card>
            </Reveal>
          ))}
        </div>
      </SectionShell>
    </section>
  )
}

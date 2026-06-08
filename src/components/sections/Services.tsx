import { getTranslations } from 'next-intl/server'
import { BookingDialog } from '@/components/cta/BookingDialog'
import { pick } from '@/content/types'
import type { Service, Locale } from '@/content/types'

interface ServicesProps {
  services: Service[]
  locale: Locale
}

const SERVICE_ICONS = [
  <svg key="globe" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9" /></svg>,
  <svg key="robot" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" /></svg>,
  <svg key="cart" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
  <svg key="chart" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>,
]

export async function Services({ services, locale }: ServicesProps) {
  const t = await getTranslations('services')

  return (
    <section id="services" className="bg-nex-dark py-24 px-6 lg:px-12">
      <div className="max-w-6xl mx-auto">
        <p className="font-dm-mono text-xs text-nex-green uppercase tracking-[0.2em] mb-4">
          {t('eyebrow')}
        </p>
        <h2 className="font-jost font-bold text-4xl lg:text-5xl text-nex-white mb-12">
          {t('heading')}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {services.map((service, index) => {
            const isHighlighted = index === 1
            return (
              <div
                key={service.id}
                className={`bg-nex-black rounded-xl border p-6 flex flex-col ${
                  isHighlighted ? 'border-nex-green/30' : 'border-white/5'
                }`}
              >
                <div className="bg-nex-green/10 rounded-lg p-2 inline-flex text-nex-green mb-4 w-fit">
                  {SERVICE_ICONS[index % SERVICE_ICONS.length]}
                </div>
                <h3 className="font-jost font-bold text-xl text-nex-white mb-3 leading-snug">
                  {pick(service.painHeadline, locale)}
                </h3>
                <p className="font-jost text-sm text-nex-grey leading-relaxed mb-6 flex-1">
                  {pick(service.whatWeBuilt, locale)}
                </p>
                <BookingDialog
                  triggerLabel={pick(service.ctaLabel, locale)}
                  variant="primary"
                />
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

import { getTranslations } from 'next-intl/server'
import { BookingDialog } from '@/components/cta/BookingDialog'

export async function LeadCapture() {
  const t = await getTranslations('leadCapture')

  return (
    <section className="bg-nex-green py-20 px-6 lg:px-12">
      <div className="max-w-6xl mx-auto text-center">
        <p className="font-dm-mono text-xs text-nex-black/60 uppercase tracking-[0.2em] mb-4">
          {t('eyebrow')}
        </p>
        <h2 className="font-jost font-bold text-4xl lg:text-5xl text-nex-white mb-4">
          {t('heading')}
        </h2>
        <p className="font-jost text-nex-white/80 max-w-xl mx-auto mb-10">
          {t('subheading')}
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <BookingDialog
            triggerLabel="Agendar llamada gratuita →"
            variant="ghost"
          />
        </div>
      </div>
    </section>
  )
}

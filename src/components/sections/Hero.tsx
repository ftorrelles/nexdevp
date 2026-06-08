import { getTranslations } from 'next-intl/server'
import { BookingDialog } from '@/components/cta/BookingDialog'

export async function Hero() {
  const t = await getTranslations('hero')

  return (
    <section className="min-h-screen flex flex-col items-center justify-center px-6 lg:px-12 bg-nex-black">
      <div className="max-w-4xl mx-auto w-full">
        {/* Eyebrow */}
        <p className="font-dm-mono text-xs text-nex-green uppercase tracking-[0.2em] mb-6">
          INGENIERÍA DE VENTAS CON IA
        </p>

        {/* H1 */}
        <h1 className="font-jost font-bold text-5xl sm:text-6xl lg:text-7xl text-nex-white leading-tight mb-6">
          {t('headline_line1')}{' '}
          <br className="hidden sm:block" />
          {t('headline_line2')}{' '}
          <br className="hidden sm:block" />
          <span className="text-nex-green">{t('headline_accent')}</span>
        </h1>

        {/* Subheadline */}
        <p className="font-jost text-lg text-nex-grey max-w-2xl leading-relaxed mb-10">
          {t('subheadline')}
        </p>

        {/* CTAs */}
        <div className="flex flex-wrap gap-4">
          <BookingDialog triggerLabel="Cotizar mi Proyecto →" variant="primary" />
          <BookingDialog triggerLabel="Ver Demo" variant="ghost" />
        </div>
      </div>
    </section>
  )
}

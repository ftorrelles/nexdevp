import { getTranslations } from 'next-intl/server'
import { WhatsAppLink } from '@/components/cta/WhatsAppLink'

export async function Retainer() {
  const t = await getTranslations('retainer')

  return (
    <section className="bg-nex-dark py-24 px-6 lg:px-12" id="retainer">
      <div className="max-w-6xl mx-auto">
        <p className="font-dm-mono text-xs text-nex-green uppercase tracking-[0.2em] mb-4">
          {t('eyebrow')}
        </p>
        <h2 className="font-jost font-bold text-4xl lg:text-5xl text-nex-white mb-8">
          Crecimiento Continuo
        </h2>
        <div className="max-w-2xl">
          <p className="font-jost text-nex-grey leading-relaxed mb-4">{t('body')}</p>
          <p className="font-jost text-nex-grey leading-relaxed mb-8">{t('body2')}</p>
          <WhatsAppLink prefillText={t('cta')} />
        </div>
      </div>
    </section>
  )
}

import { getTranslations } from 'next-intl/server'
import { SectionShell } from '@/components/editorial/SectionShell'
import { WhatsAppLink } from '@/components/cta/WhatsAppLink'

export async function Retainer() {
  const t = await getTranslations('retainer')

  return (
    <div className="bg-black">
      <SectionShell eyebrow={t('eyebrow')} heading={t('heading')}>
        <div className="max-w-2xl">
          <p className="font-jost text-base text-muted leading-relaxed mb-4">{t('body')}</p>
          <p className="font-jost text-base text-muted leading-relaxed mb-8">{t('body2')}</p>
          <WhatsAppLink prefillText={t('cta')} />
        </div>
      </SectionShell>
    </div>
  )
}

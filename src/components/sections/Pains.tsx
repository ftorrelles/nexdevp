import { getTranslations } from 'next-intl/server'
import { SectionShell } from '@/components/editorial/SectionShell'
import { Card } from '@/components/editorial/Card'
import { Reveal } from '@/components/editorial/Reveal'

export async function Pains() {
  const t = await getTranslations('pains')

  const pains = [
    { key: 'pain1', title: t('pain1.title'), body: t('pain1.body'), cta: t('pain1.cta') },
    { key: 'pain2', title: t('pain2.title'), body: t('pain2.body'), cta: t('pain2.cta') },
    { key: 'pain3', title: t('pain3.title'), body: t('pain3.body'), cta: t('pain3.cta') },
  ]

  return (
    <div className="bg-surface">
      <SectionShell eyebrow={t('eyebrow')} heading={t('heading')}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {pains.map((pain) => (
            <Reveal key={pain.key}>
              <Card>
                <h3 className="font-cormorant text-2xl text-cream mb-3">{pain.title}</h3>
                <p className="font-jost text-sm text-muted leading-relaxed">{pain.body}</p>
                <a
                  href="#services"
                  className="inline-block mt-4 font-dm-mono text-xs text-accent uppercase tracking-widest hover:underline"
                >
                  {pain.cta}
                </a>
              </Card>
            </Reveal>
          ))}
        </div>
      </SectionShell>
    </div>
  )
}

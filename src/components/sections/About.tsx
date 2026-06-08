import { getTranslations } from 'next-intl/server'
import Image from 'next/image'
import { SectionShell } from '@/components/editorial/SectionShell'
import { Reveal } from '@/components/editorial/Reveal'

export async function About() {
  const t = await getTranslations('about')

  const founders = [
    {
      key: 'founder1',
      name: t('founder1.name'),
      role: t('founder1.role'),
      bio: t('founder1.bio'),
      imageAlt: t('founder1.imageAlt'),
    },
    {
      key: 'founder2',
      name: t('founder2.name'),
      role: t('founder2.role'),
      bio: t('founder2.bio'),
      imageAlt: t('founder2.imageAlt'),
    },
  ]

  return (
    <div className="bg-surface">
      <SectionShell eyebrow={t('eyebrow')} heading={t('heading')}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {founders.map((founder) => (
            <Reveal key={founder.key}>
              <div className="flex flex-col items-start gap-5">
                <div className="relative w-20 h-20 rounded-full overflow-hidden bg-surface border border-cream/10">
                  <Image
                    src="/brand/logo-light.png"
                    alt={founder.imageAlt}
                    width={80}
                    height={80}
                    className="object-cover w-full h-full"
                  />
                </div>
                <div>
                  <h3 className="font-cormorant text-2xl text-cream">{founder.name}</h3>
                  <p className="font-dm-mono text-xs text-accent uppercase tracking-widest mt-1 mb-3">
                    {founder.role}
                  </p>
                  <p className="font-jost text-sm text-muted leading-relaxed">{founder.bio}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </SectionShell>
    </div>
  )
}

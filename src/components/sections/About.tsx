import { getTranslations } from 'next-intl/server'
import Image from 'next/image'

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
    <section className="bg-nex-black py-24 px-6 lg:px-12" id="about">
      <div className="max-w-6xl mx-auto">
        <p className="font-dm-mono text-xs text-nex-green uppercase tracking-[0.2em] mb-4">
          {t('eyebrow')}
        </p>
        <h2 className="font-jost font-bold text-4xl lg:text-5xl text-nex-white mb-12">
          {t('heading')}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {founders.map((founder) => (
            <div key={founder.key} className="bg-nex-dark rounded-xl border border-white/5 p-6 flex flex-col gap-5">
              <div className="relative w-16 h-16 rounded-full overflow-hidden bg-nex-dark border border-white/10">
                <Image
                  src="/brand/logo-light.png"
                  alt={founder.imageAlt}
                  width={64}
                  height={64}
                  className="object-cover w-full h-full"
                />
              </div>
              <div>
                <h3 className="font-jost font-bold text-xl text-nex-white">{founder.name}</h3>
                <p className="font-dm-mono text-xs text-nex-green uppercase tracking-widest mt-1 mb-3">
                  {founder.role}
                </p>
                <p className="font-jost text-sm text-nex-grey leading-relaxed">{founder.bio}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

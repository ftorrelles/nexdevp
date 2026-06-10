import { getTranslations } from 'next-intl/server'

export async function Stats() {
  const t = await getTranslations('stats')
  const stats = [
    { number: t('stat1_number'), label: t('stat1_label'), description: t('stat1_desc') },
    { number: t('stat2_number'), label: t('stat2_label'), description: t('stat2_desc') },
    { number: t('stat3_number'), label: t('stat3_label'), description: t('stat3_desc') },
  ]

  return (
    <section className="bg-nex-black py-16 border-y border-white/5">
      <div className="max-w-6xl mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-0 md:divide-x md:divide-white/5">
          {stats.map((stat) => (
            <div key={stat.label} className="md:px-12 first:pl-0 last:pr-0 text-center md:text-left">
              <p className="font-jost font-bold text-5xl lg:text-6xl text-nex-green mb-2">
                {stat.number}
              </p>
              <p className="font-dm-mono text-xs text-nex-grey uppercase tracking-[0.15em] mb-2">
                {stat.label}
              </p>
              <p className="font-jost text-sm text-nex-grey leading-relaxed">
                {stat.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

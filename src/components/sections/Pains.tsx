import { getTranslations } from 'next-intl/server'

const ICONS = [
  // Filter icon
  <svg key="filter" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" /></svg>,
  // Repeat/automation icon
  <svg key="repeat" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>,
  // User-x icon
  <svg key="userx" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6h12a6 6 0 00-6-6zM21 12h-6" /></svg>,
]

export async function Pains() {
  const t = await getTranslations('pains')

  const pains = [
    { key: 'pain1', title: t('pain1.title'), body: t('pain1.body'), icon: ICONS[0] },
    { key: 'pain2', title: t('pain2.title'), body: t('pain2.body'), icon: ICONS[1] },
    { key: 'pain3', title: t('pain3.title'), body: t('pain3.body'), icon: ICONS[2] },
  ]

  return (
    <section className="bg-nex-black py-24 px-6 lg:px-12">
      <div className="max-w-6xl mx-auto">
        {/* Eyebrow */}
        <p className="font-dm-mono text-xs text-nex-green uppercase tracking-[0.2em] mb-4">
          {t('eyebrow')}
        </p>

        {/* Heading */}
        <h2 className="font-jost font-bold text-4xl lg:text-5xl text-nex-white mb-4">
          {t('heading')} <span className="text-nex-green">{t('heading_accent')}</span>
        </h2>

        {/* Subtitle */}
        <p className="font-jost text-nex-grey max-w-2xl mb-12">
          {t('subtitle')}
        </p>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {pains.map((pain) => (
            <div
              key={pain.key}
              className="bg-nex-dark rounded-xl border border-white/5 p-6"
            >
              {/* Icon square */}
              <div className="bg-nex-green/10 rounded-lg p-2 inline-flex text-nex-green mb-4">
                {pain.icon}
              </div>
              <h3 className="font-jost font-bold text-lg text-nex-white mb-3">
                {pain.title}
              </h3>
              <p className="font-jost text-sm text-nex-grey leading-relaxed">
                {pain.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

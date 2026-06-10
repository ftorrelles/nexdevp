import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'

export async function Pillars() {
  const t = await getTranslations('pillars')
  return (
    <section id="servicios" className="bg-nex-dark py-24 px-6 lg:px-12">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="font-dm-mono text-xs text-nex-green uppercase tracking-[0.2em] mb-4">
            {t('eyebrow')}
          </p>
          <h2 className="font-jost font-bold text-3xl sm:text-4xl text-nex-white mb-4">
            {t('heading')}{' '}
            <span className="text-nex-green">{t('heading_accent')}</span>
          </h2>
          <p className="font-jost text-nex-grey max-w-xl mx-auto">
            {t('sub')}
          </p>
        </div>

        {/* Cards */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Card 1 — Software de Control */}
          <div className="bg-nex-black border border-white/10 rounded-2xl p-8 flex flex-col">
            {/* Badge */}
            <span className="font-dm-mono text-xs text-nex-green bg-nex-green/10 px-3 py-1 rounded-full w-fit mb-6">
              {t('card1_badge')}
            </span>

            {/* Icon */}
            <div className="w-12 h-12 bg-nex-green/10 rounded-lg flex items-center justify-center mb-6">
              <svg
                className="w-6 h-6 text-nex-green"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 011.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.893.149c-.425.07-.765.383-.93.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 01-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.397.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 01-.12-1.45l.527-.737c.25-.35.273-.806.108-1.204-.165-.397-.505-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.108-1.204l-.526-.738a1.125 1.125 0 01.12-1.45l.773-.773a1.125 1.125 0 011.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894z"
                />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>

            <h3 className="font-jost font-bold text-2xl text-nex-white mb-3">
              {t('card1_title')}
            </h3>
            <p className="font-jost text-nex-grey mb-6 leading-relaxed">
              {t('card1_sub')}
            </p>

            <hr className="border-white/10 mb-6" />

            {/* What we build */}
            <ul className="space-y-3 mb-6 flex-1">
              {[t('card1_item1'), t('card1_item2'), t('card1_item3')].map((item) => (
                <li key={item} className="flex items-start gap-3 font-jost text-sm text-nex-grey">
                  <svg
                    className="w-5 h-5 text-nex-green flex-shrink-0 mt-0.5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>

            {/* Case preview */}
            <div className="bg-nex-dark rounded-xl p-4 mt-4">
              <p className="font-dm-mono text-xs text-nex-grey/60 uppercase tracking-widest mb-2">
                {t('card1_case_label')}
              </p>
              <p className="font-jost text-sm text-nex-grey leading-relaxed mb-3">
                {t('card1_case_text')}
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="font-dm-mono text-xs text-nex-green bg-nex-green/10 px-2 py-1 rounded">
                  30% menos desperdicio
                </span>
                <span className="font-dm-mono text-xs text-nex-green bg-nex-green/10 px-2 py-1 rounded">
                  30min → 2min
                </span>
              </div>
            </div>
          </div>

          {/* Card 2 — Ingeniería de Ventas con IA */}
          <div className="bg-nex-black border border-nex-green/30 rounded-2xl p-8 flex flex-col">
            {/* Badge */}
            <span className="font-dm-mono text-xs text-nex-green bg-nex-green/10 px-3 py-1 rounded-full w-fit mb-6">
              {t('card2_badge')}
            </span>

            {/* Icon */}
            <div className="w-12 h-12 bg-nex-green/10 rounded-lg flex items-center justify-center mb-6">
              <svg
                className="w-6 h-6 text-nex-green"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 002.25-2.25V6.75a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 6.75v10.5a2.25 2.25 0 002.25 2.25zm.75-12h9v9h-9v-9z"
                />
              </svg>
            </div>

            <h3 className="font-jost font-bold text-2xl text-nex-white mb-3">
              {t('card2_title')}
            </h3>
            <p className="font-jost text-nex-grey mb-6 leading-relaxed">
              {t('card2_sub')}
            </p>

            <hr className="border-nex-green/20 mb-6" />

            {/* What we build */}
            <ul className="space-y-3 mb-6 flex-1">
              {[t('card2_item1'), t('card2_item2'), t('card2_item3')].map((item) => (
                <li key={item} className="flex items-start gap-3 font-jost text-sm text-nex-grey">
                  <svg
                    className="w-5 h-5 text-nex-green flex-shrink-0 mt-0.5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>

            {/* Demo teaser */}
            <div className="bg-nex-dark rounded-xl p-4 mt-4">
              <p className="font-dm-mono text-xs text-nex-grey/60 uppercase tracking-widest mb-2">
                {t('card2_demo_label')}
              </p>
              <p className="font-jost text-sm text-nex-grey leading-relaxed mb-3">
                {t('card2_demo_text')}
              </p>
              <Link
                href="/#demo"
                className="inline-flex items-center gap-1 font-jost text-sm font-semibold text-nex-green
                  hover:text-nex-green/80 transition-colors"
              >
                {t('card2_demo_cta')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

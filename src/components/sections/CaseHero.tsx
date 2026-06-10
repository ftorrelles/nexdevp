import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'

export async function CaseHero() {
  const t = await getTranslations('caseHero')
  return (
    <section id="casos" className="bg-nex-black py-24 px-6 lg:px-12">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="font-dm-mono text-xs text-nex-green uppercase tracking-[0.2em] mb-4">
            {t('eyebrow')}
          </p>
          <h2 className="font-jost font-bold text-3xl sm:text-4xl text-nex-white">
            {t('heading')}{' '}
            <span className="text-nex-green">{t('heading_accent')}</span>
          </h2>
        </div>

        {/* Feature card */}
        <div className="bg-nex-dark rounded-2xl border border-white/10 overflow-hidden">
          <div className="grid lg:grid-cols-[1fr_320px]">
            {/* Left: story */}
            <div className="p-8 lg:p-12">
              <p className="font-dm-mono text-xs text-nex-grey/60 uppercase tracking-widest mb-4">
                {t('location')}
              </p>
              <h3 className="font-jost font-bold text-2xl lg:text-3xl text-nex-white mb-6 leading-tight">
                {t('title')}
              </h3>
              <p className="font-jost text-nex-grey leading-[1.8] text-[15px] mb-6">
                {t('body1')}
              </p>
              <p className="font-jost text-nex-green font-semibold mb-2">{t('solution_label')}</p>
              <p className="font-jost text-nex-grey leading-[1.8] text-[15px] mb-8">
                {t('body2')}
              </p>

              {/* Tech pills */}
              <div className="flex flex-wrap gap-2 mb-8">
                {['Next.js', 'PWA', 'TypeScript', 'Supabase'].map((tech) => (
                  <span
                    key={tech}
                    className="font-dm-mono text-xs text-nex-grey/60 bg-nex-black px-3 py-1 rounded-md"
                  >
                    {tech}
                  </span>
                ))}
              </div>

              {/* TODO: unhide when case study video is ready */}
              {false && (
                <Link
                  href="/casos"
                  className="inline-flex items-center gap-2 font-jost text-sm font-semibold text-nex-white
                    border border-nex-white/20 px-5 py-2.5 rounded-md hover:border-nex-white/40 transition-colors"
                >
                  {t('cta')}
                </Link>
              )}
            </div>

            {/* Right: metrics */}
            <div className="bg-nex-dark border-t lg:border-t-0 lg:border-l border-white/5 p-8 flex flex-col justify-center gap-6">
              <p className="font-dm-mono text-xs text-nex-green uppercase tracking-widest">
                {t('metrics_label')}
              </p>

              <div>
                <p className="font-jost font-extrabold text-5xl text-nex-green">{t('metric1_value')}</p>
                <p className="font-jost text-sm text-nex-white mt-1">{t('metric1_label')}</p>
              </div>

              <hr className="border-white/5" />

              <div>
                <p className="font-jost font-extrabold text-4xl text-nex-green">
                  30min <span className="text-nex-grey text-2xl">→</span> 2min
                </p>
                <p className="font-jost text-sm text-nex-white mt-1">{t('metric2_label')}</p>
              </div>

              <hr className="border-white/5" />

              <div>
                <p className="font-jost font-extrabold text-5xl text-nex-green">{t('metric3_value')}</p>
                <p className="font-jost text-sm text-nex-white mt-1">
                  {t('metric3_label')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

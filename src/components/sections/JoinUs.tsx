import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import type { Locale } from '@/content/types'

interface JoinUsProps {
  locale: Locale
}

export async function JoinUs({ locale }: JoinUsProps) {
  const t = await getTranslations('joinUs')

  const benefits = [
    { icon: '%', titleKey: 'benefit1_title', bodyKey: 'benefit1_body' },
    { icon: '⌖', titleKey: 'benefit2_title', bodyKey: 'benefit2_body' },
    { icon: '↗', titleKey: 'benefit3_title', bodyKey: 'benefit3_body' },
  ] as const

  return (
    <section id="trabaja" className="bg-nex-black py-24 px-6 lg:px-12">
      <div className="max-w-6xl mx-auto">
        <div className="rounded-2xl border border-white/10 bg-nex-dark p-10 lg:p-16 relative overflow-hidden">
          {/* Subtle green glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-px bg-gradient-to-r from-transparent via-nex-green/60 to-transparent" />

          <div className="max-w-3xl mx-auto text-center">
            <p className="font-mono text-nex-green text-xs tracking-[0.25em] uppercase mb-4">
              {t('eyebrow')}
            </p>
            <h2 className="font-jost font-extrabold text-4xl sm:text-5xl text-nex-white mb-4 leading-tight">
              {t('heading')}{' '}
              <span className="text-nex-green">{t('heading_accent')}</span>
            </h2>
            <p className="font-jost text-nex-grey text-lg mb-12 max-w-2xl mx-auto">
              {t('sub')}
            </p>
          </div>

          {/* Benefits */}
          <div className="grid sm:grid-cols-3 gap-6 mb-12">
            {benefits.map((b) => (
              <div
                key={b.titleKey}
                className="rounded-xl border border-white/10 bg-nex-black p-6"
              >
                <span className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-nex-green/10 text-nex-green text-lg font-bold mb-4">
                  {b.icon}
                </span>
                <h3 className="font-jost font-bold text-lg text-nex-white mb-2">
                  {t(b.titleKey)}
                </h3>
                <p className="font-jost text-sm text-nex-grey leading-relaxed">
                  {t(b.bodyKey)}
                </p>
              </div>
            ))}
          </div>

          <div className="text-center">
            <Link
              href="/careers"
              className="inline-flex items-center gap-2 bg-nex-green text-nex-black font-jost font-bold py-3 px-7 rounded-lg hover:bg-nex-green/90 transition-colors"
            >
              {t('cta')}
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

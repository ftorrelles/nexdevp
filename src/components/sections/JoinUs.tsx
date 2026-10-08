import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { JoinUsNetwork } from './JoinUsNetwork'
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
    <section id="trabaja" className="relative overflow-hidden bg-nex-black px-6 py-24 text-nex-white lg:px-12">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <JoinUsNetwork />
        <div className="absolute left-1/2 top-0 h-[380px] w-[46rem] max-w-none -translate-x-1/2 rounded-full bg-nex-green/15 blur-3xl" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-nex-black to-transparent" />
      </div>
      <div className="relative z-10 mx-auto max-w-5xl text-center">
        <p className="mb-4 font-mono text-xs uppercase tracking-[0.25em] text-nex-green">{t('eyebrow')}</p>
        <h2 className="font-jost font-extrabold text-4xl leading-[1.05] sm:text-5xl lg:text-6xl">
          {t('heading')} <span className="text-nex-green">{t('heading_accent')}</span>
        </h2>
        <p className="mx-auto mt-6 max-w-2xl font-jost text-lg leading-relaxed text-nex-white/70">{t('sub')}</p>

        <div className="mt-14 grid gap-4 sm:grid-cols-3">
          {benefits.map((b) => (
            <div key={b.titleKey} className="rounded-xl border border-nex-white/10 bg-nex-white/5 p-6 text-left">
              <span className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-nex-green/15 text-lg font-bold text-nex-green">{b.icon}</span>
              <h3 className="mb-2 font-jost text-lg font-bold text-nex-white">{t(b.titleKey)}</h3>
              <p className="font-jost text-sm leading-relaxed text-nex-white/70">{t(b.bodyKey)}</p>
            </div>
          ))}
        </div>

        <div className="mt-14">
          <Link href="/careers" className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-nex-green px-7 py-3 font-jost font-bold text-nex-black transition-colors hover:bg-nex-green/90">
            {t('cta')}
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </section>
  )
}

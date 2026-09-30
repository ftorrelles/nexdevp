import { Link } from '@/i18n/navigation'
import { PortableBlocks } from '@/content/portable'
import { DualCTA } from '@/components/cta/DualCTA'
import { MetricStat } from '@/components/case/MetricStat'
import type { CaseStudy, Locale } from '@/content/types'

interface CaseDetailProps {
  caseStudy: CaseStudy
  locale: Locale
}

export function CaseDetail({ caseStudy, locale }: CaseDetailProps) {
  const pain = caseStudy.pain[locale]
  const solution = caseStudy.solution[locale]

  return (
    <article className="max-w-3xl mx-auto px-4 py-16 sm:px-6">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-10">
        <Link
          href="/#casos"
          className="font-dm-mono text-xs text-nex-grey hover:text-nex-white uppercase tracking-widest transition-colors focus-visible:ring-2 focus-visible:ring-nex-green rounded"
        >
          ← {locale === 'es' ? 'Casos' : 'Cases'}
        </Link>
      </nav>

      {/* Header */}
      <header className="mb-12">
        <p className="font-dm-mono text-xs text-nex-green uppercase tracking-widest mb-3">
          {caseStudy.industry[locale]}
        </p>
        <h1 className="font-cormorant text-4xl sm:text-5xl text-nex-white leading-tight">
          {caseStudy.client}
        </h1>
      </header>

      {/* Pain narrative */}
      <section className="mb-12">
        <h2 className="font-cormorant text-2xl text-nex-white mb-6">
          {locale === 'es' ? 'El problema' : 'The problem'}
        </h2>
        <div className="font-jost text-nex-grey leading-relaxed">
          <PortableBlocks blocks={pain} />
        </div>
      </section>

      {/* Solution narrative + technologies */}
      <section className="mb-12">
        <h2 className="font-cormorant text-2xl text-nex-white mb-6">
          {locale === 'es' ? 'La solución' : 'The solution'}
        </h2>
        <div className="font-jost text-nex-grey leading-relaxed">
          <PortableBlocks blocks={solution} />
        </div>

        {caseStudy.technologies.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-2">
            {caseStudy.technologies.map((tech) => (
              <span
                key={tech}
                className="font-dm-mono text-xs text-nex-grey border border-nex-ink/20 rounded px-3 py-1"
              >
                {tech}
              </span>
            ))}
          </div>
        )}
      </section>

      {/* Metrics row */}
      {caseStudy.metrics.length > 0 && (
        <section className="mb-12 border-y border-nex-ink/10 py-8">
          <p className="font-dm-mono text-xs text-nex-grey uppercase tracking-widest text-center mb-6">
            {locale === 'es' ? 'Resultados' : 'Results'}
          </p>
          <div className="flex flex-wrap justify-center gap-4 divide-x divide-nex-ink/10">
            {caseStudy.metrics.map((metric, i) => (
              <MetricStat key={i} metric={metric} locale={locale} />
            ))}
          </div>
        </section>
      )}

      {/* Closing DualCTA */}
      <section className="text-center">
        <h2 className="font-cormorant text-2xl text-nex-white mb-3">
          {locale === 'es'
            ? '¿Tu negocio tiene este problema?'
            : 'Does your business have this problem?'}
        </h2>
        <p className="font-jost text-sm text-nex-grey mb-8 max-w-md mx-auto">
          {locale === 'es'
            ? 'Conversemos 30 minutos y lo descubrimos juntos.'
            : "Let's talk for 30 minutes and find out together."}
        </p>
        <DualCTA variant="page" />
      </section>
    </article>
  )
}

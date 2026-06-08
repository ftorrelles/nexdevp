import { getTranslations } from 'next-intl/server'
import { KineticHeading } from '@/components/editorial/KineticHeading'
import { DualCTA } from '@/components/cta/DualCTA'

export async function Hero() {
  const t = await getTranslations('hero')

  return (
    <section className="min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 bg-black text-center">
      <div className="max-w-4xl mx-auto">
        <KineticHeading
          as="h1"
          className="font-cormorant text-5xl sm:text-6xl lg:text-8xl text-cream leading-tight"
        >
          {t('headline')}
        </KineticHeading>
        <p className="mt-6 font-jost text-lg sm:text-xl text-muted max-w-2xl mx-auto">
          {t('subheadline')}
        </p>
        <div className="mt-10 flex justify-center">
          <DualCTA variant="hero" />
        </div>
      </div>
    </section>
  )
}

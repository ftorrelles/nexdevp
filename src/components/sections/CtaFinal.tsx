import { getTranslations } from 'next-intl/server'
import { WhatsAppLink } from '@/components/cta/WhatsAppLink'
import { ContactForm } from '@/components/sections/ContactForm'

export async function CtaFinal() {
  const t = await getTranslations('ctaFinal')
  return (
    <section id="contacto" className="bg-nex-dark py-24 px-6 lg:px-12">
      <div className="max-w-6xl mx-auto">
        <div className="rounded-2xl border border-nex-green/30 bg-nex-black p-6 lg:p-16 relative overflow-hidden">
          {/* Subtle green glow top */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-px bg-gradient-to-r from-transparent via-nex-green/60 to-transparent" />

          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left column: copy + WhatsApp CTA */}
            <div>
              <p className="font-mono text-nex-green text-xs tracking-[0.25em] uppercase mb-4">
                {t('eyebrow')}
              </p>
              <h2 className="font-jost font-extrabold text-4xl sm:text-5xl text-nex-white mb-4 leading-tight">
                {t('heading')}<br />
                <span className="text-nex-green">{t('heading_accent')}</span>
              </h2>
              <p className="font-jost text-nex-grey text-lg mb-10 max-w-xl">
                {t('sub')}
              </p>
              <WhatsAppLink />
            </div>

            {/* Right column: contact form */}
            <div>
              <ContactForm />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

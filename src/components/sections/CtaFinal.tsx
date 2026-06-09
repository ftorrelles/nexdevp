import { BookingDialog } from '@/components/cta/BookingDialog'
import { WhatsAppLink } from '@/components/cta/WhatsAppLink'

export function CtaFinal() {
  return (
    <section className="bg-nex-dark py-24 px-6 lg:px-12">
      <div className="max-w-4xl mx-auto">
        <div className="rounded-2xl border border-nex-green/30 bg-nex-black p-10 lg:p-16 text-center relative overflow-hidden">
          {/* Subtle green glow top */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-px bg-gradient-to-r from-transparent via-nex-green/60 to-transparent" />

          <p className="font-mono text-nex-green text-xs tracking-[0.25em] uppercase mb-4">
            Primera consulta · Sin costo · Sin compromiso
          </p>
          <h2 className="font-jost font-extrabold text-4xl sm:text-5xl text-nex-white mb-4 leading-tight">
            ¿Listo para parar<br />
            <span className="text-nex-green">las fugas?</span>
          </h2>
          <p className="font-jost text-nex-grey text-lg mb-10 max-w-xl mx-auto">
            Te decimos exactamente qué necesita tu negocio — y cómo lo resolvemos.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <BookingDialog
              triggerLabel="Agendar consulta gratis →"
              variant="primary"
            />
            <WhatsAppLink />
          </div>
        </div>
      </div>
    </section>
  )
}

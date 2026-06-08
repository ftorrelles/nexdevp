import { BookingDialog } from '@/components/cta/BookingDialog'
import { WhatsAppLink } from '@/components/cta/WhatsAppLink'

export function CtaFinal() {
  return (
    <section className="bg-nex-green py-20 px-6 lg:px-12">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="font-jost font-extrabold text-4xl sm:text-5xl text-nex-white mb-4 leading-tight">
          ¿Listo para parar las fugas?
        </h2>
        <p className="font-jost text-nex-white/80 text-lg mb-10">
          Primera consulta gratis. Sin compromiso. Te decimos exactamente qué necesita tu negocio.
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <BookingDialog triggerLabel="Agendar consulta gratis →" variant="primary" />
          <WhatsAppLink
            className="!border-nex-white/40 !text-nex-white hover:!border-nex-white"
          />
        </div>
      </div>
    </section>
  )
}

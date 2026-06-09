import { BookingDialog } from '@/components/cta/BookingDialog'
import { Link } from '@/i18n/navigation'

export function Hero() {
  return (
    <section className="min-h-screen flex items-center bg-nex-black px-6 lg:px-12 py-24">
      <div className="max-w-4xl mx-auto w-full">
        {/* Left: content */}
        <div className="text-center lg:text-left">
          {/* Eyebrow */}
          <p className="font-dm-mono text-xs text-nex-green uppercase tracking-[0.2em] mb-6">
            CONSULTORÍA · SOFTWARE · AUTOMATIZACIÓN IA
          </p>

          {/* H1 */}
          <h1 className="font-jost font-extrabold text-4xl sm:text-5xl lg:text-6xl text-nex-white leading-tight mb-6">
            De procesos caóticos
            <br />
            a operaciones que
            <br />
            <span className="text-nex-green">se manejan solas.</span>
          </h1>

          {/* Sub */}
          <p className="font-jost font-light text-lg text-nex-grey max-w-xl mx-auto lg:mx-0 leading-relaxed mb-10">
            Construimos software a medida y sistemas de ventas con IA — para que operes mejor,
            respondas más rápido y no pierdas ni un peso.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap gap-4 justify-center lg:justify-start mb-10">
            <BookingDialog triggerLabel="Cotizar mi Proyecto →" variant="primary" />
            <Link
              href="/#demo"
              className="inline-flex items-center justify-center gap-2 min-h-[44px] px-6 py-3 rounded-md
                font-jost text-sm font-semibold text-nex-white border border-nex-white/30
                hover:border-nex-white/60 transition-colors"
            >
              Ver Demo ↓
            </Link>
          </div>

          {/* Inline stats */}
          <div className="flex flex-wrap items-center gap-4 justify-center lg:justify-start">
            <span className="font-dm-mono text-xs text-nex-grey">30% menos desperdicio</span>
            <span className="text-nex-grey/30">|</span>
            <span className="font-dm-mono text-xs text-nex-grey">30min→2min</span>
            <span className="text-nex-grey/30">|</span>
            <span className="font-dm-mono text-xs text-nex-grey">100+ proyectos</span>
          </div>
        </div>

      </div>
    </section>
  )
}

import { Link } from '@/i18n/navigation'

export function CaseHero() {
  return (
    <section className="bg-nex-black py-24 px-6 lg:px-12">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="font-dm-mono text-xs text-nex-green uppercase tracking-[0.2em] mb-4">
            CASO DE ÉXITO
          </p>
          <h2 className="font-jost font-bold text-3xl sm:text-4xl text-nex-white">
            Así se ve el resultado{' '}
            <span className="text-nex-green">en números reales.</span>
          </h2>
        </div>

        {/* Feature card */}
        <div className="bg-nex-dark rounded-2xl border border-white/10 overflow-hidden">
          <div className="grid lg:grid-cols-[1fr_320px]">
            {/* Left: story */}
            <div className="p-8 lg:p-12">
              <p className="font-dm-mono text-xs text-nex-grey/60 uppercase tracking-widest mb-4">
                COCINERHOSP · TENERIFE, ESPAÑA
              </p>
              <h3 className="font-jost font-bold text-2xl lg:text-3xl text-nex-white mb-6 leading-tight">
                De la pérdida de alimentos al control total en 6 hospitales
              </h3>
              <p className="font-jost text-nex-grey leading-[1.8] text-[15px] mb-6">
                Una empresa de catering hospitalario gestionaba la producción diaria de 6 centros de
                forma manual. Sin datos en tiempo real, sobreproducían constantemente — pagando por
                comida que se tiraba y tiempo de cocineros que se desperdiciaba.
              </p>
              <p className="font-jost text-nex-green font-semibold mb-2">La solución:</p>
              <p className="font-jost text-nex-grey leading-[1.8] text-[15px] mb-8">
                Desarrollamos una PWA mobile-first que digitaliza el proceso completo de planificación
                de producción. Los cocineros operan desde el celular; los gerentes ven datos en tiempo
                real.
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

              <Link
                href="/casos"
                className="inline-flex items-center gap-2 font-jost text-sm font-semibold text-nex-white
                  border border-nex-white/20 px-5 py-2.5 rounded-md hover:border-nex-white/40 transition-colors"
              >
                Ver caso completo →
              </Link>
            </div>

            {/* Right: metrics */}
            <div className="bg-nex-dark border-t lg:border-t-0 lg:border-l border-white/5 p-8 flex flex-col justify-center gap-6">
              <p className="font-dm-mono text-xs text-nex-green uppercase tracking-widest">
                RESULTADOS
              </p>

              <div>
                <p className="font-jost font-extrabold text-5xl text-nex-green">30%</p>
                <p className="font-jost text-sm text-nex-white mt-1">menos comida desperdiciada</p>
              </div>

              <hr className="border-white/5" />

              <div>
                <p className="font-jost font-extrabold text-4xl text-nex-green">
                  30min <span className="text-nex-grey text-2xl">→</span> 2min
                </p>
                <p className="font-jost text-sm text-nex-white mt-1">cálculo diario de producción</p>
              </div>

              <hr className="border-white/5" />

              <div>
                <p className="font-jost font-extrabold text-5xl text-nex-green">6</p>
                <p className="font-jost text-sm text-nex-white mt-1">
                  hospitales operando en simultáneo
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

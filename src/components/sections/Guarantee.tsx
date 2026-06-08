export function Guarantee() {
  return (
    <section className="bg-nex-dark py-16 px-6 lg:px-12">
      <div className="max-w-3xl mx-auto">
        <div className="bg-nex-black rounded-xl border border-nex-green/20 p-8 flex flex-col sm:flex-row gap-6 items-start">
          {/* Shield icon */}
          <div className="flex-shrink-0 w-14 h-14 rounded-full bg-nex-green/10 border border-nex-green/30 flex items-center justify-center text-nex-green">
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>

          {/* Content */}
          <div>
            <h3 className="font-jost font-bold text-2xl text-nex-white mb-3">
              Garantía de Funcionamiento 30 Días
            </h3>
            <p className="font-jost text-nex-grey leading-relaxed">
              Si el sistema implementado no funciona como fue acordado durante los primeros 30 días,
              lo corregimos sin costo adicional. Tu inversión está protegida.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

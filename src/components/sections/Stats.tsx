export function Stats() {
  const stats = [
    {
      number: '03+',
      label: 'AÑOS DE COMPROMISO',
      description: 'Construyendo sistemas que generan resultados reales',
    },
    {
      number: '100+',
      label: 'PROYECTOS ENTREGADOS',
      description: 'Desde startups hasta empresas consolidadas',
    },
    {
      number: '100%',
      label: 'DEDICACIÓN',
      description: 'Cada cliente recibe atención de los fundadores directamente',
    },
  ]

  return (
    <section className="bg-nex-black py-16 border-y border-white/5">
      <div className="max-w-6xl mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-0 md:divide-x md:divide-white/5">
          {stats.map((stat) => (
            <div key={stat.label} className="md:px-12 first:pl-0 last:pr-0 text-center md:text-left">
              <p className="font-jost font-bold text-5xl lg:text-6xl text-nex-green mb-2">
                {stat.number}
              </p>
              <p className="font-dm-mono text-xs text-nex-grey uppercase tracking-[0.15em] mb-2">
                {stat.label}
              </p>
              <p className="font-jost text-sm text-nex-grey leading-relaxed">
                {stat.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

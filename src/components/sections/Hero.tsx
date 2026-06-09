'use client'

import { useEffect, useState } from 'react'
import { BookingDialog } from '@/components/cta/BookingDialog'
import { Link } from '@/i18n/navigation'

const problems = [
  'Procesos manuales que consumen horas',
  'Leads que llegan y nadie responde',
  'Decisiones sin datos en tiempo real',
  'Operaciones que dependen de una persona',
]

const solutions = [
  'Sistemas que operan sin intervención',
  'Agente IA que responde en 60 segundos',
  'Dashboards con datos al instante',
  'Operaciones que escalan solas',
]

export function Hero() {
  const [visible, setVisible] = useState<number[]>([])

  useEffect(() => {
    const total = problems.length + solutions.length
    for (let i = 0; i < total; i++) {
      setTimeout(() => {
        setVisible((prev) => [...prev, i])
      }, 300 + i * 380)
    }
  }, [])

  return (
    <section className="min-h-screen flex flex-col bg-nex-black">

      {/* Split panels */}
      <div className="flex-1 grid lg:grid-cols-2 border-b border-white/5">

        {/* LEFT — Before */}
        <div className="relative flex flex-col justify-center px-10 lg:px-16 py-16 border-b lg:border-b-0 lg:border-r border-white/5">
          <div className="absolute inset-0 bg-red-500/[0.03] pointer-events-none" />
          <p className="font-dm-mono text-[10px] tracking-[0.28em] uppercase text-red-400/70 mb-8">
            Sin nexdevp
          </p>
          <ul className="space-y-5">
            {problems.map((p, i) => (
              <li
                key={i}
                className="flex items-start gap-3 transition-all duration-500"
                style={{
                  opacity: visible.includes(i) ? 1 : 0,
                  transform: visible.includes(i) ? 'translateX(0)' : 'translateX(-16px)',
                }}
              >
                <span className="mt-0.5 text-red-400 font-bold text-sm flex-shrink-0">✗</span>
                <span className="font-jost text-base text-nex-grey leading-snug">{p}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* RIGHT — After */}
        <div className="relative flex flex-col justify-center px-10 lg:px-16 py-16">
          <div className="absolute inset-0 bg-nex-green/[0.03] pointer-events-none" />
          <p className="font-dm-mono text-[10px] tracking-[0.28em] uppercase text-nex-green/70 mb-8">
            Con nexdevp
          </p>
          <ul className="space-y-5">
            {solutions.map((s, i) => (
              <li
                key={i}
                className="flex items-start gap-3 transition-all duration-500"
                style={{
                  opacity: visible.includes(problems.length + i) ? 1 : 0,
                  transform: visible.includes(problems.length + i)
                    ? 'translateX(0)'
                    : 'translateX(16px)',
                }}
              >
                <span className="mt-0.5 text-nex-green font-bold text-sm flex-shrink-0">✓</span>
                <span className="font-jost text-base text-nex-white leading-snug">{s}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Bottom: headline + CTAs */}
      <div className="px-6 lg:px-12 py-16 text-center">
        <p className="font-dm-mono text-[10px] tracking-[0.28em] uppercase text-nex-green mb-5">
          CONSULTORÍA · SOFTWARE · AUTOMATIZACIÓN IA
        </p>
        <h1 className="font-jost font-extrabold text-4xl sm:text-5xl lg:text-6xl text-nex-white leading-tight mb-6 max-w-3xl mx-auto">
          De procesos caóticos<br />
          a operaciones que{' '}
          <span className="text-nex-green">se manejan solas.</span>
        </h1>
        <p className="font-jost font-light text-lg text-nex-grey max-w-xl mx-auto leading-relaxed mb-10">
          Construimos software a medida y sistemas de ventas con IA —
          para que operes mejor y no dejes escapar ninguna oportunidad.
        </p>
        <div className="flex flex-wrap gap-4 justify-center mb-10">
          <BookingDialog triggerLabel="Cotizar mi Proyecto →" variant="primary" />
          <Link
            href="#demo"
            className="inline-flex items-center justify-center gap-2 min-h-[44px] px-6 py-3 rounded-md
              font-jost text-sm font-semibold text-nex-white border border-nex-white/30
              hover:border-nex-white/60 transition-colors"
          >
            Ver Demo ↓
          </Link>
        </div>
        <div className="flex flex-wrap items-center gap-4 justify-center">
          <span className="font-dm-mono text-xs text-nex-grey">30% menos desperdicio</span>
          <span className="text-nex-grey/30">|</span>
          <span className="font-dm-mono text-xs text-nex-grey">30min → 2min</span>
          <span className="text-nex-grey/30">|</span>
          <span className="font-dm-mono text-xs text-nex-grey">100+ proyectos</span>
        </div>
      </div>

    </section>
  )
}

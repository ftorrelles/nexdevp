'use client'

import { useEffect, useState } from 'react'
import { BookingDialog } from '@/components/cta/BookingDialog'
import { Link } from '@/i18n/navigation'

const metrics = [
  { value: '30%', label: 'menos desperdicio', sub: 'CocinerHosp', delay: 600, from: 'top-left' },
  { value: '60s', label: 'primera respuesta', sub: 'Agente IA', delay: 900, from: 'top-right' },
  { value: '30min→2min', label: 'cálculo diario', sub: 'Automatización', delay: 1200, from: 'bottom-left' },
  { value: '100+', label: 'proyectos entregados', sub: 'Global', delay: 1500, from: 'bottom-right' },
]

const fromStyles: Record<string, string> = {
  'top-left':     'translate(-24px, -24px)',
  'top-right':    'translate(24px, -24px)',
  'bottom-left':  'translate(-24px, 24px)',
  'bottom-right': 'translate(24px, 24px)',
}

export function Hero() {
  const [headlineVisible, setHeadlineVisible] = useState(false)
  const [visibleCards, setVisibleCards] = useState<number[]>([])

  useEffect(() => {
    setTimeout(() => setHeadlineVisible(true), 200)
    metrics.forEach((m, i) => {
      setTimeout(() => setVisibleCards((prev) => [...prev, i]), m.delay)
    })
  }, [])

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center bg-nex-black px-6 lg:px-12 py-24 overflow-hidden">

      {/* Dot grid background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />
      {/* Green glow center */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-nex-green/5 blur-3xl pointer-events-none" />

      {/* Floating metric cards */}
      {metrics.map((m, i) => {
        const isVisible = visibleCards.includes(i)
        const isLeft = m.from.includes('left')
        const isTop = m.from.includes('top')
        return (
          <div
            key={i}
            className="absolute hidden lg:block"
            style={{
              ...(isTop ? { top: '18%' } : { bottom: '18%' }),
              ...(isLeft ? { left: '6%' } : { right: '6%' }),
              transition: 'opacity 0.6s ease, transform 0.6s ease',
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? 'translate(0,0)' : fromStyles[m.from],
            }}
          >
            <div className="bg-nex-dark border border-white/8 rounded-xl px-5 py-4 min-w-[160px]">
              <p className="font-jost font-extrabold text-2xl text-nex-green leading-none mb-1">
                {m.value}
              </p>
              <p className="font-jost text-xs text-nex-white">{m.label}</p>
              <p className="font-dm-mono text-[9px] text-nex-grey uppercase tracking-widest mt-1">
                {m.sub}
              </p>
            </div>
          </div>
        )
      })}

      {/* Center content */}
      <div
        className="relative z-10 text-center max-w-3xl mx-auto"
        style={{
          transition: 'opacity 0.8s ease, transform 0.8s ease',
          opacity: headlineVisible ? 1 : 0,
          transform: headlineVisible ? 'translateY(0)' : 'translateY(20px)',
        }}
      >
        <p className="font-dm-mono text-[10px] tracking-[0.28em] uppercase text-nex-green mb-6">
          CONSULTORÍA · SOFTWARE · AUTOMATIZACIÓN IA
        </p>
        <h1 className="font-jost font-extrabold text-5xl sm:text-6xl lg:text-7xl text-nex-white leading-[1.05] mb-6">
          De procesos caóticos<br />
          a operaciones que{' '}
          <span className="text-nex-green">se manejan solas.</span>
        </h1>
        <p className="font-jost font-light text-lg text-nex-grey max-w-xl mx-auto leading-relaxed mb-10">
          Construimos software a medida y sistemas de ventas con IA —
          para que operes mejor y no dejes escapar ninguna oportunidad.
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
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
      </div>

    </section>
  )
}

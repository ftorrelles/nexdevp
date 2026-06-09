'use client'

import { useEffect, useState } from 'react'
import { BookingDialog } from '@/components/cta/BookingDialog'
import { Link } from '@/i18n/navigation'

const metrics = [
  { value: '30%',        label: 'menos desperdicio',    sub: 'CocinerHosp',    delay: 700,  pos: { top: '22%',    left: '4%'  }, floatDir: 'float' },
  { value: '60s',        label: 'primera respuesta',    sub: 'Agente IA',      delay: 1000, pos: { top: '18%',    right: '4%' }, floatDir: 'float-reverse' },
  { value: '30→2 min',   label: 'cálculo diario',       sub: 'Automatización', delay: 1300, pos: { bottom: '22%', left: '4%'  }, floatDir: 'float-reverse' },
  { value: '100+',       label: 'proyectos entregados', sub: 'Global',         delay: 1600, pos: { bottom: '18%', right: '4%' }, floatDir: 'float' },
]

export function Hero() {
  const [ready, setReady] = useState(false)
  const [visibleCards, setVisibleCards] = useState<number[]>([])

  useEffect(() => {
    setTimeout(() => setReady(true), 150)
    metrics.forEach((m, i) => {
      setTimeout(() => setVisibleCards((prev) => [...prev, i]), m.delay)
    })
  }, [])

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center bg-nex-black overflow-hidden px-6 lg:px-12 py-28">

      {/* ── Dot grid ── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)',
          backgroundSize: '30px 30px',
        }}
      />

      {/* ── Light orbs ── */}
      <div
        className="absolute w-[520px] h-[520px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(34,181,97,0.13) 0%, transparent 70%)',
          top: '10%', left: '15%',
          animation: 'drift 14s ease-in-out infinite',
          filter: 'blur(8px)',
        }}
      />
      <div
        className="absolute w-[380px] h-[380px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(34,181,97,0.09) 0%, transparent 70%)',
          bottom: '10%', right: '10%',
          animation: 'drift-reverse 18s ease-in-out infinite',
          filter: 'blur(12px)',
        }}
      />
      <div
        className="absolute w-[200px] h-[200px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(34,181,97,0.18) 0%, transparent 70%)',
          top: '40%', left: '48%',
          animation: 'pulse-glow 4s ease-in-out infinite',
          filter: 'blur(20px)',
        }}
      />

      {/* ── Floating metric cards (desktop only) ── */}
      {metrics.map((m, i) => (
        <div
          key={i}
          className="absolute hidden lg:block"
          style={{
            ...m.pos,
            transition: 'opacity 0.7s ease, transform 0.7s ease',
            opacity: visibleCards.includes(i) ? 1 : 0,
            transform: visibleCards.includes(i) ? 'scale(1)' : 'scale(0.85)',
            animation: visibleCards.includes(i)
              ? `${m.floatDir} ${3.5 + i * 0.4}s ease-in-out infinite`
              : 'none',
          }}
        >
          <div
            className="rounded-xl px-5 py-4 min-w-[155px]"
            style={{
              background: 'rgba(27,28,28,0.85)',
              border: '1px solid rgba(34,181,97,0.2)',
              backdropFilter: 'blur(12px)',
              boxShadow: '0 0 24px rgba(34,181,97,0.08)',
            }}
          >
            <p className="font-jost font-extrabold text-2xl text-nex-green leading-none mb-1">
              {m.value}
            </p>
            <p className="font-jost text-xs text-nex-white">{m.label}</p>
            <p className="font-dm-mono text-[9px] text-nex-grey uppercase tracking-widest mt-1">
              {m.sub}
            </p>
          </div>
        </div>
      ))}

      {/* ── Center content ── */}
      <div
        className="relative z-10 text-center max-w-3xl mx-auto"
        style={{
          transition: 'opacity 1s ease, transform 1s ease',
          opacity: ready ? 1 : 0,
          transform: ready ? 'translateY(0)' : 'translateY(24px)',
        }}
      >
        {/* Brand name */}
        <div className="flex items-center justify-center mb-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/logo-dark.svg"
            alt="nexdevp"
            style={{
              height: '48px',
              width: 'auto',
              filter: 'drop-shadow(0 0 16px rgba(34,181,97,0.4))',
              animation: 'pulse-glow 4s ease-in-out infinite',
            }}
          />
        </div>

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

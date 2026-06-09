'use client'

import { useEffect, useState, useRef } from 'react'
import { BookingDialog } from '@/components/cta/BookingDialog'
import { Link } from '@/i18n/navigation'

// Starts at a believable number and climbs every few seconds
const BASE_COUNT = 2847
const INCREMENT_EVERY_MS = 3200

export function Hero() {
  const [ready, setReady] = useState(false)
  const [count, setCount] = useState(BASE_COUNT)
  const [flash, setFlash] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    setTimeout(() => setReady(true), 150)

    intervalRef.current = setInterval(() => {
      setCount((c) => c + Math.floor(Math.random() * 3) + 1)
      setFlash(true)
      setTimeout(() => setFlash(false), 400)
    }, INCREMENT_EVERY_MS)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center bg-nex-black overflow-hidden px-6 lg:px-12 py-28">

      {/* Dot grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)',
          backgroundSize: '30px 30px',
        }}
      />

      {/* Light orbs */}
      <div className="absolute w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(34,181,97,0.11) 0%, transparent 70%)',
          top: '5%', left: '10%',
          animation: 'drift 16s ease-in-out infinite',
          filter: 'blur(10px)',
        }}
      />
      <div className="absolute w-[400px] h-[400px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(34,181,97,0.08) 0%, transparent 70%)',
          bottom: '5%', right: '8%',
          animation: 'drift-reverse 20s ease-in-out infinite',
          filter: 'blur(14px)',
        }}
      />

      {/* Content */}
      <div
        className="relative z-10 text-center max-w-4xl mx-auto"
        style={{
          transition: 'opacity 1s ease, transform 1s ease',
          opacity: ready ? 1 : 0,
          transform: ready ? 'translateY(0)' : 'translateY(24px)',
        }}
      >
        {/* Logo */}
        <div className="flex items-center justify-center mb-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/logo-dark.svg"
            alt="nexdevp"
            style={{
              height: '52px',
              width: 'auto',
              filter: 'drop-shadow(0 0 20px rgba(34,181,97,0.45))',
              animation: 'pulse-glow 4s ease-in-out infinite',
            }}
          />
        </div>

        {/* Live counter */}
        <div
          className="inline-flex flex-col items-center rounded-2xl border border-white/8 px-8 py-5 mb-10"
          style={{
            background: 'rgba(27,28,28,0.7)',
            backdropFilter: 'blur(12px)',
          }}
        >
          <p className="font-dm-mono text-[9px] tracking-[0.28em] uppercase text-nex-grey mb-2">
            Oportunidades perdidas esta semana por no automatizar
          </p>
          <p
            className="font-jost font-extrabold text-5xl sm:text-6xl leading-none transition-colors duration-300"
            style={{ color: flash ? '#ffffff' : '#22b561' }}
          >
            {count.toLocaleString('es')}
          </p>
          <p className="font-dm-mono text-[9px] tracking-[0.2em] uppercase text-nex-grey mt-2 flex items-center gap-2">
            <span
              className="inline-block w-1.5 h-1.5 rounded-full bg-nex-green"
              style={{ animation: 'pulse-glow 1.5s ease-in-out infinite' }}
            />
            En tiempo real · Contador global estimado
          </p>
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

        <div className="flex flex-wrap gap-4 justify-center mb-12">
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

        {/* Stats */}
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

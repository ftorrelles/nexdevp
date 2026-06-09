'use client'

import { useEffect, useState } from 'react'
import { BookingDialog } from '@/components/cta/BookingDialog'
import { Link } from '@/i18n/navigation'

const rotating = [
  'se manejan solas.',
  'escalan sin esfuerzo.',
  'generan más ventas.',
  'responden en 60 segundos.',
  'dejan de perder dinero.',
]

export function Hero() {
  const [ready, setReady] = useState(false)
  const [wordIndex, setWordIndex] = useState(0)
  const [displayed, setDisplayed] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [cursorVisible, setCursorVisible] = useState(true)

  // Fade in on mount
  useEffect(() => {
    setTimeout(() => setReady(true), 150)
  }, [])

  // Cursor blink
  useEffect(() => {
    const id = setInterval(() => setCursorVisible((v) => !v), 530)
    return () => clearInterval(id)
  }, [])

  // Typewriter loop
  useEffect(() => {
    const current = rotating[wordIndex]
    let timeout: ReturnType<typeof setTimeout>

    if (!isDeleting && displayed.length < current.length) {
      timeout = setTimeout(() => setDisplayed(current.slice(0, displayed.length + 1)), 55)
    } else if (!isDeleting && displayed.length === current.length) {
      timeout = setTimeout(() => setIsDeleting(true), 2200)
    } else if (isDeleting && displayed.length > 0) {
      timeout = setTimeout(() => setDisplayed(current.slice(0, displayed.length - 1)), 30)
    } else if (isDeleting && displayed.length === 0) {
      setIsDeleting(false)
      setWordIndex((i) => (i + 1) % rotating.length)
    }

    return () => clearTimeout(timeout)
  }, [displayed, isDeleting, wordIndex])

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

        <p className="font-dm-mono text-[10px] tracking-[0.28em] uppercase text-nex-green mb-8">
          CONSULTORÍA · SOFTWARE · AUTOMATIZACIÓN IA
        </p>

        {/* Headline — fixed two lines + typewriter third */}
        <h1 className="font-jost font-extrabold text-5xl sm:text-6xl lg:text-7xl text-nex-white leading-[1.1] mb-8">
          De procesos caóticos<br />
          a operaciones que<br />
          <span className="text-nex-green">
            {displayed}
            <span
              className="inline-block w-[3px] h-[0.85em] bg-nex-green ml-1 align-middle rounded-sm"
              style={{ opacity: cursorVisible ? 1 : 0, transition: 'opacity 0.1s' }}
            />
          </span>
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

        {/* Inline stats */}
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

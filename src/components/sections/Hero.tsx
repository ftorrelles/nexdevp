'use client'

import { useEffect, useState, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { BookingDialog } from '@/components/cta/BookingDialog'
import { Link } from '@/i18n/navigation'
import { HeroCard } from './HeroCard'

const BASE_COUNT = 2847
const INCREMENT_EVERY_MS = 3200

export function Hero() {
  const t = useTranslations('hero')
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
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [])

  return (
    <section id="hero" className="relative min-h-screen flex items-center bg-nex-black overflow-hidden px-6 lg:px-16 pt-10 pb-16">

      {/* Dot grid */}
      <div className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)',
          backgroundSize: '30px 30px',
        }}
      />

      {/* Light orbs */}
      <div className="absolute w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(34,181,97,0.1) 0%, transparent 70%)',
          top: '-10%', right: '5%',
          animation: 'drift 16s ease-in-out infinite',
          filter: 'blur(12px)',
        }}
      />
      <div className="absolute w-[350px] h-[350px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(34,181,97,0.07) 0%, transparent 70%)',
          bottom: '0%', left: '5%',
          animation: 'drift-reverse 20s ease-in-out infinite',
          filter: 'blur(16px)',
        }}
      />

      <div
        className="relative z-10 w-full max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center"
        style={{
          transition: 'opacity 1s ease, transform 1s ease',
          opacity: ready ? 1 : 0,
          transform: ready ? 'translateY(0)' : 'translateY(24px)',
        }}
      >
        {/* ── LEFT: copy ── */}
        <div className="flex flex-col items-start">

          <p className="font-dm-mono text-[10px] tracking-[0.28em] uppercase text-nex-green mb-5">
            {t('eyebrow')}
          </p>

          <h1 className="font-jost font-extrabold text-5xl sm:text-6xl xl:text-7xl text-nex-white leading-[1.05] mb-6">
            {t('headline1')}<br />
            {t('headline2')}<br />
            {t('headline3')}{' '}
            <span className="text-nex-green">{t('headline_accent')}</span>
          </h1>

          <p className="font-jost font-light text-lg text-nex-grey max-w-md leading-relaxed mb-10">
            {t('sub')}
          </p>

          <div className="flex flex-wrap gap-4 mb-10">
            <BookingDialog triggerLabel={t('cta_primary')} variant="primary" />
            <Link
              href="#demo"
              className="inline-flex items-center justify-center gap-2 min-h-[44px] px-6 py-3 rounded-md
                font-jost text-sm font-semibold text-nex-white border border-nex-white/30
                hover:border-nex-white/60 transition-colors"
            >
              {t('cta_secondary')}
            </Link>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <span className="font-dm-mono text-xs text-nex-grey">{t('stat1')}</span>
            <span className="text-nex-grey/30">|</span>
            <span className="font-dm-mono text-xs text-nex-grey">{t('stat2')}</span>
            <span className="text-nex-grey/30">|</span>
            <span className="font-dm-mono text-xs text-nex-grey">{t('stat3')}</span>
          </div>
        </div>

        {/* ── RIGHT: counter card ── */}
        <div className="flex items-center justify-center lg:justify-end">
          <HeroCard count={count} flash={flash} />
        </div>

      </div>
    </section>
  )
}

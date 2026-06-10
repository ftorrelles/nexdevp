'use client'

import { useTranslations } from 'next-intl'

interface HeroCardProps {
  count: number
  flash: boolean
}

const FAKE_LOGS = [
  '> lead.capture()        ✓',
  '> qualify.intent()      ✓',
  '> response.send()       ✓',
  '> crm.update()          ✓',
  '> notify.owner()        ✓',
]

export function HeroCard({ count, flash }: HeroCardProps) {
  const t = useTranslations('hero')

  return (
    <div
      className="w-full max-w-sm rounded-xl overflow-hidden"
      style={{
        background: '#0d0f0e',
        border: '1px solid rgba(34,181,97,0.25)',
        boxShadow: '0 0 0 1px rgba(34,181,97,0.05), 0 0 60px rgba(34,181,97,0.1), 0 24px 48px rgba(0,0,0,0.5)',
      }}
    >
      {/* Terminal header bar */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: 'rgba(34,181,97,0.15)', background: 'rgba(34,181,97,0.04)' }}
      >
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
          <span className="w-2.5 h-2.5 rounded-full bg-nex-green/70" />
        </div>
        <span className="font-dm-mono text-[9px] tracking-[0.2em] uppercase text-nex-green/60">
          nexdevp.monitor
        </span>
        <span
          className="font-dm-mono text-[9px] text-nex-green/40 flex items-center gap-1"
        >
          <span
            className="inline-block w-1.5 h-1.5 rounded-full bg-nex-green"
            style={{ animation: 'pulse-glow 1.5s ease-in-out infinite' }}
          />
          live
        </span>
      </div>

      {/* Body */}
      <div className="px-6 pt-5 pb-6">

        {/* Label */}
        <p className="font-dm-mono text-[8px] tracking-[0.22em] uppercase text-nex-grey/70 leading-relaxed mb-5">
          {t('counter_label').split('\n').map((line, i, arr) => (
            <span key={i}>{line}{i < arr.length - 1 && <br />}</span>
          ))}
        </p>

        {/* Counter */}
        <div className="relative mb-1">
          <p
            className="font-jost font-extrabold leading-none tabular-nums transition-colors duration-200"
            style={{
              fontSize: 'clamp(60px, 9vw, 88px)',
              color: flash ? '#ffffff' : '#22b561',
              textShadow: flash
                ? '0 0 40px rgba(255,255,255,0.4)'
                : '0 0 40px rgba(34,181,97,0.35)',
            }}
          >
            {count.toLocaleString('es')}
          </p>
          {/* Scanline overlay */}
          <div
            className="absolute inset-0 pointer-events-none rounded"
            style={{
              background: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.08) 3px, rgba(0,0,0,0.08) 4px)',
            }}
          />
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-px" style={{ background: 'rgba(34,181,97,0.15)' }} />
          <span className="font-dm-mono text-[8px] text-nex-green/40 tracking-widest">SYS</span>
          <div className="flex-1 h-px" style={{ background: 'rgba(34,181,97,0.15)' }} />
        </div>

        {/* Fake log lines */}
        <div className="flex flex-col gap-1 mb-5">
          {FAKE_LOGS.map((log, i) => (
            <p
              key={i}
              className="font-dm-mono text-[9px] text-nex-green/40"
              style={{ animationDelay: `${i * 0.3}s` }}
            >
              {log}
            </p>
          ))}
        </div>

        {/* Footer note */}
        <p
          className="font-jost text-xs leading-relaxed"
          style={{ color: 'rgba(255,255,255,0.35)' }}
        >
          {t('counter_note')}
        </p>
      </div>
    </div>
  )
}

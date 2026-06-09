'use client'

import { useEffect, useState } from 'react'

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

export function BeforeAfter() {
  const [visible, setVisible] = useState<number[]>([])
  const [started, setStarted] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) {
          setStarted(true)
          const total = problems.length + solutions.length
          for (let i = 0; i < total; i++) {
            setTimeout(() => {
              setVisible((prev) => [...prev, i])
            }, 200 + i * 350)
          }
        }
      },
      { threshold: 0.2 }
    )
    const el = document.getElementById('before-after-section')
    if (el) observer.observe(el)
    return () => observer.disconnect()
  }, [started])

  return (
    <section id="before-after-section" className="bg-nex-black border-t border-white/5 py-24 px-6 lg:px-12">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <p className="font-dm-mono text-[10px] tracking-[0.28em] uppercase text-nex-green mb-3">
            EL CAMBIO
          </p>
          <h2 className="font-jost font-extrabold text-3xl sm:text-4xl text-nex-white">
            Lo que cambia cuando <span className="text-nex-green">trabajamos juntos.</span>
          </h2>
        </div>

        <div className="grid lg:grid-cols-2 rounded-2xl overflow-hidden border border-white/5">
          {/* LEFT — Before */}
          <div className="relative flex flex-col px-10 py-12 border-b lg:border-b-0 lg:border-r border-white/5">
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
          <div className="relative flex flex-col px-10 py-12">
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
      </div>
    </section>
  )
}

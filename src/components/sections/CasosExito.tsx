'use client'

import { useState, useEffect, useRef, type CSSProperties } from 'react'
import { useLocale } from 'next-intl'

type Loc = 'es' | 'en'

// ── Section chrome copy ──
const COPY = {
  eyebrow: { es: 'Casos de éxito', en: 'Success stories' },
  heading: { es: 'Productos reales, resultados reales', en: 'Real products, real results' },
  sub: {
    es: 'Elegí un caso y recorré las pantallas reales del producto.',
    en: 'Pick a case and explore the real product screens.',
  },
  hint: {
    es: 'Tocá las pestañas para navegar la app · mové el mouse para inclinarla',
    en: 'Tap the tabs to navigate the app · move your mouse to tilt it',
  },
}

const CASE_TABS: { es: string; en: string }[] = [
  { es: 'Gestión de obra', en: 'Construction budgets' },
  { es: 'CocinerHosp · Tenerife', en: 'CocinerHosp · Tenerife' },
  { es: 'SpeakPath · Academia', en: 'SpeakPath · Academy' },
]

const INNER_TABS: { es: string; en: string }[][] = [
  [
    { es: 'Rentabilidad', en: 'Profitability' },
    { es: 'Presup. vs Real', en: 'Budget vs actual' },
    { es: 'Presupuestos', en: 'Budgets' },
  ],
  [
    { es: 'Calcular', en: 'Calculate' },
    { es: 'Dashboard', en: 'Dashboard' },
    { es: 'Dietas Blandas', en: 'Soft diets' },
  ],
  [
    { es: 'Inicio', en: 'Home' },
    { es: 'Curso', en: 'Course' },
    { es: 'Lección', en: 'Lesson' },
  ],
]

const HIGHLIGHTS: { big: { es: string; en: string }; small: { es: string; en: string } }[][] = [
  [
    { big: { es: 'Tiempo real', en: 'Real time' }, small: { es: 'Costos y rentabilidad sin esperar cierres', en: 'Costs and profitability without waiting for close-out' } },
    { big: { es: 'Remoto', en: 'Remote' }, small: { es: 'El dueño controla la obra desde EE.UU.', en: 'The owner runs the site from the US' } },
    { big: { es: 'Sin WhatsApp', en: 'No WhatsApp' }, small: { es: 'Aprobaciones por rol, cero ida y vuelta', en: 'Role-based approvals, zero back-and-forth' } },
  ],
  [
    { big: { es: '−30%', en: '−30%' }, small: { es: 'Menos desperdicio de comida', en: 'Less food wasted' } },
    { big: { es: '30→2 min', en: '30→2 min' }, small: { es: 'Cálculo de producción diaria', en: 'Daily production calculation' } },
    { big: { es: '6 centros', en: '6 centers' }, small: { es: 'Operando en simultáneo', en: 'Running simultaneously' } },
  ],
  [
    { big: { es: '−90%', en: '−90%' }, small: { es: 'Errores de reserva eliminados', en: 'Booking errors eliminated' } },
    { big: { es: '15 h/mes', en: '15 h/mo' }, small: { es: 'Ahorradas en coordinación', en: 'Saved in coordination' } },
    { big: { es: '100%', en: '100%' }, small: { es: 'Visibilidad de ingresos y progreso', en: 'Revenue and progress visibility' } },
  ],
]

// ── Animated primitives (remount on screen change re-fires the entry) ──
function Grow({ pct, axis = 'x', color, radius, duration = 950 }: { pct: number; axis?: 'x' | 'y'; color: string; radius?: string; duration?: number }) {
  const [v, setV] = useState(0)
  useEffect(() => {
    const t = setTimeout(() => setV(pct), 40)
    return () => clearTimeout(t)
  }, [pct])
  const style: CSSProperties = {
    background: color,
    borderRadius: radius,
    transition: `width ${duration}ms cubic-bezier(.2,.7,.3,1), height ${duration}ms cubic-bezier(.2,.7,.3,1)`,
    ...(axis === 'x' ? { width: `${v}%`, height: '100%' } : { height: `${v}%`, width: '100%' }),
  }
  return <div style={style} />
}

function Counter({ to, money = false }: { to: number; money?: boolean }) {
  const [n, setN] = useState(0)
  useEffect(() => {
    let raf = 0
    let st: number | null = null
    const step = (ts: number) => {
      if (st === null) st = ts
      const p = Math.min((ts - st) / 1100, 1)
      const e = 1 - Math.pow(1 - p, 3)
      setN(to * e)
      if (p < 1) raf = requestAnimationFrame(step)
    }
    const d = setTimeout(() => { raf = requestAnimationFrame(step) }, 150)
    return () => { clearTimeout(d); cancelAnimationFrame(raf) }
  }, [to])
  if (money) return <>{'$' + Math.round(n).toLocaleString('en-US') + '.00'}</>
  return <>{Math.round(n).toLocaleString('es')}</>
}

// ── Product screen renderer (bilingual; SpeakPath stays English by design) ──
function Screen({ c, ip, loc }: { c: number; ip: number; loc: Loc }) {
  const t = (es: string, en: string) => (loc === 'en' ? en : es)

  // CONSTRUCTION (anonymized, fictitious budget names)
  if (c === 0) {
    if (ip === 0) return (
      <>
        <div className="flex justify-between items-start">
          <div><p className="text-[13px] font-semibold text-nex-white m-0 mb-0.5">{t('Rentabilidad de la obra', 'Project profitability')}</p><p className="text-[11px] text-nex-grey m-0">{t('Ganancia estimada al cerrar', 'Estimated profit at close-out')}</p></div>
          <span className="text-[10px] text-nex-grey border border-white/15 rounded-full px-2.5 py-0.5">{t('En ejecución', 'In progress')}</span>
        </div>
        <div className="flex items-baseline justify-between my-1.5 mb-3"><p className="text-[32px] font-extrabold text-nex-white m-0"><Counter to={2550} money /></p><span className="text-[12px] text-nex-grey">{t('margen', 'margin')} <span className="text-nex-green">30%</span></span></div>
        <p className="text-[10px] text-nex-grey m-0 mb-1.5">{t('De lo que paga el cliente', 'Of what the client pays')} ($11,049.99)</p>
        <div className="flex h-[9px] rounded-md overflow-hidden" style={{ background: 'rgba(255,255,255,.05)' }}>
          <Grow pct={71.6} color="#6b7280" /><Grow pct={5.3} color="#3a4250" /><Grow pct={23.1} color="#22b561" />
        </div>
        <div className="flex gap-3 my-2 mb-2.5 flex-wrap text-[10px] text-nex-grey">
          <span><span style={{ color: '#6b7280' }}>●</span> {t('Gastado', 'Spent')} <b className="text-nex-white font-semibold">$7,910</b></span>
          <span><span style={{ color: '#3a4250' }}>●</span> {t('Por gastar', 'To spend')} <b className="text-nex-white font-semibold">$589.99</b></span>
          <span><span style={{ color: '#22b561' }}>●</span> {t('Ganancia', 'Profit')} <b className="text-nex-green font-semibold">$2,550</b></span>
        </div>
        <div className="rounded-lg px-3 py-2" style={{ background: 'rgba(34,181,97,.06)', border: '1px solid rgba(34,181,97,.15)' }}>
          <p className="text-[10.5px] text-nex-grey m-0 leading-relaxed">{t('Tu ganancia está protegida mientras el gasto no supere el costo presupuestado', 'Your profit is protected as long as spending stays under the budgeted cost')} (<span className="text-nex-white">$8,499.99</span>).</p>
        </div>
      </>
    )
    if (ip === 1) return (
      <>
        <p className="text-[13px] font-semibold text-nex-white m-0 mb-2.5">{t('Presupuestado vs Real', 'Budgeted vs actual')}</p>
        <div className="grid grid-cols-4 gap-1.5 mb-3">
          {[[t('Presup.', 'Budget'), '$8,500', '#f5f5f5'], [t('Real', 'Actual'), '$7,910', '#f5f5f5'], [t('Desv.', 'Dev.'), '−$590', '#22b561'], [t('Ejec.', 'Exec.'), '93%', '#f5f5f5']].map(([k, v, col]) => (
            <div key={k} className="rounded-lg px-2 py-1.5" style={{ border: '1px solid rgba(255,255,255,.06)' }}><p className="text-[9px] text-nex-grey m-0 mb-0.5">{k}</p><p className="text-[13px] font-bold m-0" style={{ color: col }}>{v}</p></div>
          ))}
        </div>
        <table className="w-full border-collapse text-[11px]">
          <tbody>
            <tr className="text-nex-grey"><td className="py-1">{t('Concepto', 'Item')}</td><td className="text-right">{t('Presup.', 'Budget')}</td><td className="text-right">{t('Real', 'Actual')}</td><td className="text-right">{t('Desv.', 'Dev.')}</td></tr>
            {[
              ['● ' + t('Materiales', 'Materials'), '$620', '$620', '0%', '#8a8c8b', true],
              [t('Piedra', 'Stone'), '$20', '$30', '+50%', '#ef5350', false],
              ['● ' + t('Mano de obra', 'Labor'), '$7,000', '$7,100', '+1%', '#fbc02d', true],
              [t('Maestro de obra', 'Foreman'), '$2,000', '$2,600', '+30%', '#ef5350', false],
              ['● ' + t('Equipos', 'Equipment'), '$380', '$190', '−50%', '#22b561', true],
            ].map(([name, p, r, d, col, head], i) => (
              <tr key={i} style={head ? { borderTop: '1px solid rgba(255,255,255,.05)' } : undefined}>
                <td className={head ? 'py-1.5 text-nex-white' : 'py-1.5 pl-3.5 text-nex-grey'}>{name as string}</td>
                <td className="text-right" style={{ color: head ? '#8a8c8b' : '#6b7280' }}>{p as string}</td>
                <td className="text-right" style={{ color: head ? '#8a8c8b' : '#6b7280' }}>{r as string}</td>
                <td className="text-right" style={{ color: col as string }}>{d as string}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </>
    )
    return (
      <>
        <div className="flex justify-between items-center mb-2.5"><p className="text-[13px] font-semibold text-nex-white m-0">{t('Presupuestos', 'Budgets')}</p><span className="text-[10px] text-nex-black bg-nex-green font-semibold px-2.5 py-1 rounded-md">{t('+ Nuevo', '+ New')}</span></div>
        <div className="flex flex-col gap-2">
          {[
            ['PRE-2026-0006', t('Remodelación oficinas centrales', 'Head office remodel'), '$11,500', t('En ejecución', 'In progress'), '#22b561'],
            ['PRE-2026-0005', t('Ampliación de bodega norte', 'North warehouse expansion'), '$14,970', t('En revisión', 'Under review'), '#3b82f6'],
            ['PRE-2026-0004', t('Instalación eléctrica nave 2', 'Electrical install, bay 2'), '$8,500', t('En ejecución', 'In progress'), '#22b561'],
          ].map(([code, name, amt, st, col]) => (
            <div key={code} className="rounded-r-lg px-3 py-2.5" style={{ border: '1px solid rgba(255,255,255,.07)', borderLeft: `3px solid ${col}` }}>
              <div className="flex justify-between"><span className="font-dm-mono text-[9px] text-nex-grey">{code}</span><span className="text-[10px]" style={{ color: col }}>● {st}</span></div>
              <div className="flex justify-between items-center mt-0.5"><span className="text-[12px] text-nex-white font-medium">{name}</span><span className="text-[14px] font-bold text-nex-white">{amt}</span></div>
            </div>
          ))}
        </div>
      </>
    )
  }

  // COCINERHOSP
  if (c === 1) {
    if (ip === 0) return (
      <>
        <div className="rounded-[10px] p-3 mb-2.5" style={{ background: '#15543a' }}>
          <p className="text-[10px] m-0 mb-0.5" style={{ color: 'rgba(255,255,255,.8)', letterSpacing: '.05em' }}>{t('ALMUERZO · Total pacientes', 'LUNCH · Total patients')}</p>
          <p className="text-[26px] font-extrabold text-white m-0"><Counter to={414} /></p>
        </div>
        <div className="flex gap-4 mb-2.5 text-[11px]"><span className="font-semibold" style={{ color: '#15543a' }}>{t('Proteína', 'Protein')}</span><span style={{ color: '#9aa89f' }}>{t('Guarnición', 'Side')}</span></div>
        <div className="rounded-lg p-2 mb-2" style={{ background: '#fff', border: '1px solid #e3e7e3' }}>
          <div className="flex justify-between items-center"><span className="text-[12px] font-semibold" style={{ color: '#2c3a32' }}>{t('Muslo pollo', 'Chicken thigh')}</span><span className="text-[11px]" style={{ color: '#9aa89f' }}>✕</span></div>
        </div>
        <p className="text-[10px] m-0 mb-1.5" style={{ color: '#7a8a80' }}>{t('Proteína — selección rápida', 'Protein — quick select')}</p>
        <div className="grid grid-cols-3 gap-1.5 mb-2.5">
          {[[t('Muslo pollo', 'Chicken thigh'), true], [t('Contramuslo', 'Chicken leg'), false], [t('Pescado', 'Fish'), false], [t('Albóndigas', 'Meatballs'), false], [t('Hamburguesa', 'Burger'), false], [t('+ Otro', '+ Other'), false]].map(([n, act]) => (
            <div key={n as string} className="rounded-md text-center py-2 text-[10px]" style={act ? { background: '#15543a', color: '#fff', fontWeight: 600 } : { background: '#fff', border: '1px solid #e3e7e3', color: '#3a4a40' }}>{n as string}</div>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-2 mb-2">
          {[[t('Unid./caja', 'Units/box'), '20'], [t('Unid./ración', 'Units/serving'), '2'], [t('Merma %', 'Waste %'), '30']].map(([k, v]) => (
            <div key={k}><p className="text-[9px] m-0 mb-1" style={{ color: '#7a8a80' }}>{k}</p><div className="rounded-md px-2 py-1.5 text-[12px] flex justify-between items-center" style={{ background: '#fff', border: '1px solid #e3e7e3', color: '#2c3a32' }}>{v}{(k === 'Merma %' || k === 'Waste %') && <span className="text-[8px] px-1 rounded" style={{ background: '#e3efe8', color: '#15543a' }}>auto</span>}</div></div>
          ))}
        </div>
        <div className="rounded-md text-center py-2.5 text-[12px] font-semibold text-white" style={{ background: '#15543a' }}>{t('Calcular', 'Calculate')}</div>
      </>
    )
    if (ip === 1) return (
      <>
        <div className="grid grid-cols-2 gap-2 mb-3">
          {[['526', t('Barquetas este mes', 'Trays this month'), '#15543a', '#e3efe8', '#cfe3d6', '#5a7065'], ['75', t('Media barquetas/día', 'Avg trays/day'), '#b06f12', '#faecd0', '#f0dcb0', '#8a6a3a'], ['19', t('Elaboraciones', 'Preparations'), '#1e3a8a', '#e6ecf6', '#d2deef', '#46587f'], ['0', t('Barquetas hoy', 'Trays today'), '#15543a', '#e3efe8', '#cfe3d6', '#5a7065']].map(([n, l, col, bg, bd, sub]) => (
            <div key={l} className="rounded-[9px] px-2.5 py-2" style={{ background: bg, border: `1px solid ${bd}` }}><p className="text-[21px] font-extrabold m-0 leading-none" style={{ color: col }}>{n}</p><p className="text-[9.5px] m-0 mt-0.5" style={{ color: sub }}>{l}</p></div>
          ))}
        </div>
        <div className="rounded-[10px] px-3 py-2.5" style={{ background: '#fff', border: '1px solid #e3e7e3' }}>
          <p className="text-[11px] font-semibold text-center m-0 mb-2.5" style={{ color: '#2c3a32' }}>{t('Semana — 8 a 14 jun', 'Week — Jun 8–14')}</p>
          <div className="flex items-end justify-between gap-1.5" style={{ height: '66px' }}>
            {[100, 87, 0, 85, 75, 0, 0].map((h, i) => (
              <div key={i} className="flex-1 flex items-end h-full">{h > 0 ? <Grow pct={h} axis="y" color="#9cc0a8" radius="4px 4px 0 0" /> : <div className="w-full rounded-[3px]" style={{ height: '3px', background: '#e0e5e0' }} />}</div>
            ))}
          </div>
          <div className="flex justify-between mt-1.5">{(loc === 'en' ? ['M', 'T', 'W', 'T', 'F', 'S', 'S'] : ['L', 'M', 'X', 'J', 'V', 'S', 'D']).map((d, i) => <span key={i} className="flex-1 text-center text-[8.5px]" style={{ color: '#8a9a8f' }}>{d}</span>)}</div>
        </div>
      </>
    )
    return (
      <>
        <p className="text-[12px] font-bold m-0 mb-0.5" style={{ color: '#2c3a32' }}>🍲 {t('Dietas Blandas', 'Soft diets')}</p>
        <p className="text-[10px] m-0 mb-2.5" style={{ color: '#7a8a80' }}>{t('Producción fija diaria — no depende del nº de pacientes', 'Fixed daily production — independent of patient count')}</p>
        <div className="rounded-[10px] p-3 text-center mb-2.5" style={{ background: '#15543a' }}><p className="text-[10px] m-0 mb-0.5" style={{ color: 'rgba(255,255,255,.8)', letterSpacing: '.05em' }}>{t('TOTAL BOLSAS CONGELADAS / DÍA', 'TOTAL FROZEN BAGS / DAY')}</p><p className="text-[26px] font-extrabold text-white m-0">47</p></div>
        <div className="rounded-lg px-2.5 py-2 mb-2.5 text-center" style={{ background: '#fff', border: '1px solid #e3e7e3' }}><span className="text-[10.5px]" style={{ color: '#3a4a40' }}>{t('Papas', 'Potato')} <b>41</b> · {t('Zanahoria', 'Carrot')} <b>2</b> · {t('Calabaza', 'Squash')} <b>1</b> · {t('Calabacín', 'Zucchini')} <b>3</b></span></div>
        <div className="rounded-lg px-3 py-2.5" style={{ background: '#fff', border: '1px solid #e3e7e3' }}>
          <p className="text-[11px] font-semibold m-0 mb-2" style={{ color: '#2c3a32' }}>🍲 {t('Chinos — 22 barquetas × 3 kg = 66 kg/día', 'Purées — 22 trays × 3 kg = 66 kg/day')}</p>
          <table className="w-full text-[10.5px] border-collapse">
            <tbody>
              <tr style={{ color: '#8a9a8f' }}><td className="py-0.5">{t('Tipo', 'Type')}</td><td className="text-right">{t('Bolsas', 'Bags')}</td><td className="text-right">{t('Bruto', 'Gross')}</td></tr>
              {[[t('Zanahoria', 'Carrot'), '#fff'], [t('Calabaza', 'Squash'), '#f6f8f6'], [t('Calabacín', 'Zucchini'), '#fff']].map(([ty, bg], i) => (
                <tr key={i} style={{ background: bg, borderTop: i === 0 ? '1px solid #eef1ee' : undefined }}><td className="py-1" style={{ color: '#2c3a32' }}>{ty}</td><td className="text-right" style={{ color: '#3a4a40' }}>4</td><td className="text-right" style={{ color: '#3a4a40' }}>10 kg</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    )
  }

  // SPEAKPATH (English by design — it's an English academy)
  if (ip === 0) return (
    <>
      <p className="text-[20px] font-extrabold m-0 mb-0.5" style={{ color: '#0f1730' }}>Welcome back, Francisco!</p>
      <p className="text-[12px] m-0 mb-3.5" style={{ color: '#6a7290' }}>Ready to keep improving your English?</p>
      <p className="text-[11px] font-semibold m-0 mb-2" style={{ color: '#2c3550' }}>Your courses</p>
      <div className="rounded-[11px] p-3" style={{ background: '#fff', border: '1px solid #e6e9f2' }}>
        <div className="flex justify-between items-center mb-2"><span className="text-[14px] font-bold" style={{ color: '#1a2238' }}>SpeakPath Foundations</span><span className="text-[11px] text-nex-black bg-nex-green font-semibold rounded-md px-2.5 py-1">Continue →</span></div>
        <div className="h-[7px] rounded overflow-hidden" style={{ background: '#e6e9f2' }}><Grow pct={8} color="#234fe0" radius="4px" /></div>
        <p className="text-[10px] m-0 mt-1.5" style={{ color: '#8a90a0' }}>2 / 25 lessons · 8%</p>
      </div>
      <div className="grid grid-cols-2 gap-2 mt-2">
        {[['📚', 'My Courses', 'Browse your curriculum'], ['📅', 'My Lessons', 'Upcoming classes']].map(([ic, t2, d]) => (
          <div key={t2} className="rounded-[11px] p-3" style={{ background: '#fff', border: '1px solid #e6e9f2' }}><p className="text-[18px] m-0">{ic}</p><p className="text-[12px] font-semibold m-0 mt-1.5 mb-0.5" style={{ color: '#1a2238' }}>{t2}</p><p className="text-[10px] m-0 leading-snug" style={{ color: '#8a90a0' }}>{d}</p></div>
        ))}
      </div>
    </>
  )
  if (ip === 1) return (
    <>
      <div className="rounded-[11px] p-3 mb-2.5" style={{ background: '#234fe0' }}>
        <div className="flex justify-between items-start"><div><p className="text-[15px] font-extrabold text-white m-0 mb-0.5">SpeakPath Foundations</p><p className="text-[10px] m-0" style={{ color: 'rgba(255,255,255,.8)' }}>6 units · 25 lessons</p></div><span className="text-[11px] font-bold rounded-full px-2.5 py-0.5" style={{ color: '#234fe0', background: '#fff' }}>A1</span></div>
        <div className="h-[6px] rounded my-2 mb-1.5 overflow-hidden" style={{ background: 'rgba(255,255,255,.25)' }}><Grow pct={8} color="#fff" radius="4px" /></div>
        <p className="text-[10px] m-0" style={{ color: 'rgba(255,255,255,.85)' }}>2 / 25 lessons · 8%</p>
      </div>
      <p className="text-[11px] font-semibold m-0 mb-2" style={{ color: '#2c3550' }}>Course content</p>
      <div className="flex flex-col gap-1.5">
        {[['1 · Meeting People', '5 lessons', '2 / 5 lessons', 40], ['2 · My World', '4 lessons', '0 / 4 lessons', 0], ['3 · Daily Life', '4 lessons', '0 / 4 lessons', 0]].map(([title, n, prog, pct], i) => (
          <div key={i} className="rounded-r-[9px] px-3 py-2" style={{ background: '#fff', border: '1px solid #e6e9f2', borderLeft: `3px solid ${pct ? '#234fe0' : '#cdd4e6'}` }}>
            <div className="flex justify-between items-center"><span className="text-[12px] font-semibold" style={{ color: '#1a2238' }}>{title}</span><span className="text-[9px] rounded-full px-1.5 py-0.5" style={{ color: '#5a6480', background: '#eef1f8' }}>{n}</span></div>
            {(pct as number) > 0 && <div className="h-[4px] rounded my-1.5 mb-0.5 overflow-hidden" style={{ background: '#e6e9f2' }}><Grow pct={pct as number} color="#234fe0" radius="3px" /></div>}
            <span className="text-[9px] block mt-1.5" style={{ color: '#8a90a0' }}>{prog}</span>
          </div>
        ))}
      </div>
    </>
  )
  return (
    <>
      <div className="flex justify-between items-center mb-2"><span className="text-[12px] font-bold" style={{ color: '#1a2238' }}>🎭 Role-play: meeting someone new</span><span className="text-[9px]" style={{ color: '#8a90a0' }}>17 min</span></div>
      <div className="rounded-[9px] px-3 py-2.5 mb-2.5" style={{ background: '#eaf0ff', border: '1px solid #d4e0ff' }}><p className="text-[10.5px] m-0 leading-relaxed" style={{ color: '#3a4868' }}>Act out a real-life situation. You play one person, your teacher plays the other — in 3 steps, so by the end you can do it on your own.</p></div>
      <p className="text-[11px] font-bold m-0 mb-2" style={{ color: '#1a2238' }}>Step 1 — Read it together</p>
      <div className="flex flex-col gap-1.5">
        {[['Ana', 'Hello! Good morning.', '#eaf0ff'], ['Tom', 'Good morning! How are you?', '#f0f2f7'], ['Ana', "I'm fine, thank you. And you?", '#eaf0ff']].map(([who, txt, bg], i) => (
          <div key={i}><span className="text-[9px] font-semibold" style={{ color: '#234fe0' }}>{who}</span><div className="rounded-[9px] px-2.5 py-1.5 text-[11px]" style={{ background: bg, color: '#1a2238' }}>{txt}</div></div>
        ))}
      </div>
    </>
  )
}

// ── Device chrome per case ──
function DeviceHeader({ c, loc }: { c: number; loc: Loc }) {
  if (c === 0) return (
    <div className="flex items-center justify-between px-3 py-2" style={{ borderBottom: '1px solid rgba(255,255,255,.06)', background: 'rgba(34,181,97,.03)' }}>
      <div className="flex gap-1.5">{['#ef5350', '#fbc02d', '#22b561'].map((col) => <span key={col} className="w-2 h-2 rounded-full" style={{ background: col }} />)}</div>
      <span className="font-dm-mono text-[9px] uppercase" style={{ letterSpacing: '.15em', color: 'rgba(34,181,97,.55)' }}>{loc === 'en' ? 'construction budgets' : 'gestión de obra'}</span>
      <span className="font-dm-mono text-[9px] animate-pulse" style={{ color: 'rgba(34,181,97,.5)' }}>● live</span>
    </div>
  )
  if (c === 1) return (
    <div className="flex items-center justify-between px-3 py-2.5" style={{ background: '#15543a' }}><span className="text-[12px] font-semibold text-white">🏥 CocinerHosp</span><span className="font-dm-mono text-[9px]" style={{ color: 'rgba(255,255,255,.7)' }}>{loc === 'en' ? 'Tue Jun 30' : 'mar 30 jun'}</span></div>
  )
  return (
    <div className="flex items-center justify-between px-3 py-2.5" style={{ background: '#fff', borderBottom: '1px solid #e6e9f2' }}><span className="text-[13px] font-extrabold" style={{ color: '#2546d6' }}>SpeakPath</span><span className="text-[14px]" style={{ color: '#8a90a0' }}>≡</span></div>
  )
}

// ac = active bg, fg = active text, idleBg/idleBorder/off = inactive look (per product theme)
const INNER_THEME = [
  { ac: '#22b561', fg: '#070809', off: '#9aa0a0', idleBg: 'rgba(255,255,255,.06)', idleBorder: 'rgba(255,255,255,.12)', barBg: '#111414', bodyBg: '#0a0c0d' },
  { ac: '#15543a', fg: '#ffffff', off: '#5f7268', idleBg: '#e8ece8', idleBorder: '#d2dcd2', barBg: '#eef1ee', bodyBg: '#f3f5f3' },
  { ac: '#234fe0', fg: '#ffffff', off: '#6a7596', idleBg: '#e9edf6', idleBorder: '#d6deec', barBg: '#eef1f6', bodyBg: '#f6f7fb' },
]

export function CasosExito() {
  const locale = useLocale() as Loc
  const [c, setC] = useState(0)
  const [ip, setIp] = useState(0)
  const sceneRef = useRef<HTMLDivElement>(null)

  function selectCase(i: number) { setC(i); setIp(0) }

  // 3D parallax tilt on the active device (pointer-fine only; flat on touch / reduced-motion)
  useEffect(() => {
    const scene = sceneRef.current
    if (!scene) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let bx = 0, by = 0, tx = 0, ty = 0
    let raf: number | null = null
    const dev = () => scene.querySelector<HTMLElement>('[data-dev]')
    const loop = () => {
      tx += (bx - tx) * 0.12; ty += (by - ty) * 0.12
      const d = dev()
      if (d) d.style.transform = `rotateY(${tx}deg) rotateX(${ty}deg)`
      if (Math.abs(bx - tx) > 0.05 || Math.abs(by - ty) > 0.05) raf = requestAnimationFrame(loop)
      else raf = null
    }
    const onMove = (e: MouseEvent) => {
      const d = dev(); if (!d) return
      const r = d.getBoundingClientRect()
      bx = ((e.clientX - r.left) / r.width - 0.5) * 9
      by = -((e.clientY - r.top) / r.height - 0.5) * 6
      if (raf === null) raf = requestAnimationFrame(loop)
    }
    const onLeave = () => { bx = 0; by = 0; if (raf === null) raf = requestAnimationFrame(loop) }
    scene.addEventListener('mousemove', onMove)
    scene.addEventListener('mouseleave', onLeave)
    return () => { scene.removeEventListener('mousemove', onMove); scene.removeEventListener('mouseleave', onLeave); if (raf) cancelAnimationFrame(raf) }
  }, [])

  const theme = INNER_THEME[c]

  return (
    <section id="casos" className="bg-nex-black py-24 px-6 lg:px-12">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <p className="font-dm-mono text-[11px] uppercase text-nex-green mb-2" style={{ letterSpacing: '.25em' }}>{COPY.eyebrow[locale]}</p>
        <h2 className="font-jost font-bold text-3xl sm:text-4xl text-nex-white mb-3">{COPY.heading[locale]}</h2>
        <p className="font-jost text-nex-grey mb-8 max-w-xl">{COPY.sub[locale]}</p>

        {/* Case tabs */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {CASE_TABS.map((tab, i) => (
            <button
              key={i}
              onClick={() => selectCase(i)}
              className={[
                'font-jost text-sm px-3.5 py-1.5 rounded-lg border transition-colors',
                c === i ? 'bg-nex-green text-nex-black border-nex-green font-bold' : 'bg-nex-dark text-nex-grey border-white/10 hover:border-white/30',
              ].join(' ')}
            >
              {tab[locale]}
            </button>
          ))}
        </div>

        {/* Interaction hint */}
        <p className="font-jost text-[12px] text-nex-grey/70 mb-5 flex items-center gap-1.5">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-nex-green"><path d="M9 11V6a2 2 0 0 1 4 0v5" /><path d="M13 9a2 2 0 0 1 4 0v2" /><path d="M17 11a2 2 0 0 1 4 0v3a7 7 0 0 1-7 7h-2a7 7 0 0 1-6-3l-2.5-4a1.7 1.7 0 0 1 3-1.7l1.5 2" /></svg>
          {COPY.hint[locale]}
        </p>

        {/* Scene: device + highlights */}
        <div ref={sceneRef} className="grid lg:grid-cols-[1fr_180px] gap-5 lg:gap-6 items-center" style={{ perspective: '1500px' }}>
          <div>
            <div
              data-dev
              className="rounded-[13px] overflow-hidden"
              style={{ background: '#0d0f10', border: '1px solid rgba(34,181,97,.22)', boxShadow: '0 26px 54px rgba(0,0,0,.6), 0 0 70px rgba(34,181,97,.07)', transformStyle: 'preserve-3d', transition: 'transform .25s cubic-bezier(.2,.7,.3,1)', willChange: 'transform' }}
            >
              <DeviceHeader c={c} loc={locale} />
              {/* Inner tabs — styled as a real segmented control so they read as clickable */}
              <div className="flex gap-1.5 px-2.5 py-2 flex-wrap" style={{ background: theme.barBg }}>
                {INNER_TABS[c].map((t, i) => (
                  <button
                    key={i}
                    onClick={() => setIp(i)}
                    className="text-[10.5px] px-2.5 py-1.5 rounded-md transition-all cursor-pointer"
                    style={ip === i
                      ? { background: theme.ac, color: theme.fg, fontWeight: 600, border: `1px solid ${theme.ac}` }
                      : { background: theme.idleBg, color: theme.off, border: `1px solid ${theme.idleBorder}` }}
                  >
                    {t[locale]}
                  </button>
                ))}
              </div>
              {/* Active screen (remounts on case/inner change → re-fires entry animations) */}
              <div key={`${c}-${ip}`} className="px-3.5 py-4" style={{ background: theme.bodyBg, minHeight: '300px' }}>
                <Screen c={c} ip={ip} loc={locale} />
              </div>
            </div>
          </div>

          {/* Highlights — prominent cards; 3-col row on mobile, vertical stack on desktop */}
          <div key={c} className="grid grid-cols-3 lg:grid-cols-1 gap-2.5 lg:gap-3 mt-1">
            {HIGHLIGHTS[c].map((h, i) => (
              <HlCard key={i} big={h.big[locale]} small={h.small[locale]} delay={150 + i * 150} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function HlCard({ big, small, delay }: { big: string; small: string; delay: number }) {
  const [on, setOn] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setOn(true), delay)
    return () => clearTimeout(t)
  }, [delay])
  return (
    <div
      className="rounded-xl bg-nex-dark border border-white/10 px-3 py-3 lg:px-4 lg:py-3.5"
      style={{ borderLeft: '2px solid rgba(34,181,97,.55)', opacity: on ? 1 : 0, transform: on ? 'none' : 'translateY(8px)', transition: 'opacity .5s, transform .5s' }}
    >
      <p className="font-jost font-extrabold text-nex-green leading-tight m-0 text-lg sm:text-xl lg:text-2xl">{big}</p>
      <p className="font-jost text-nex-grey m-0 mt-1 leading-snug text-[11px] lg:text-[11.5px]">{small}</p>
    </div>
  )
}

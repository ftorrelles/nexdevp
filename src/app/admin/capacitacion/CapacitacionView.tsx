'use client'

import React, { useState } from 'react'
import type { UserRole } from '@/lib/supabase'
import { AdminNav } from '../AdminNav'
import {
  WARM_NETWORK_STEPS,
  WARM_SCRIPTS,
  PRE_DEMO_SCRIPT,
  PRODUCT_GLOSSARY,
  PRODUCT_PITCHES,
  SECTOR_SPEECHES,
  OBJECTIONS,
} from '@/content/sales-onboarding'

interface Props {
  role: UserRole
  email: string
  name?: string
}

type TabType =
  | 'warm'
  | 'flow'
  | 'glossary'
  | 'pre-demo'
  | 'pricing'
  | 'product-pitches'
  | 'speeches'
  | 'objections'
  | 'roi-calc'

type CalcUseCase = 'leads' | 'hours' | 'waste' | 'b2b'

interface ModuleInfo {
  id: TabType
  phase: number
  phaseName: string
  stepNum: number
  title: string
  shortLabel: string
  icon: string
  goal: string
}

const MODULES: ModuleInfo[] = [
  {
    id: 'warm',
    phase: 1,
    phaseName: 'Fase 1: Primeros Pasos & Estrategia',
    stepNum: 1,
    title: 'Módulo 1: Tu Lista de Contactos Cercanos (Red Propia 20%)',
    shortLabel: '1. Red Cercana (20%)',
    icon: '🤝',
    goal: 'Estudia cómo conseguir tus primeras 3 a 5 reuniones en tu primera semana contactando comercios y personas de tu confianza (obteniendo el 20% de comisión).',
  },
  {
    id: 'flow',
    phase: 1,
    phaseName: 'Fase 1: Primeros Pasos & Estrategia',
    stepNum: 2,
    title: 'Módulo 2: Tu Objetivo Comercial & Criterios de Calificación',
    shortLabel: '2. Meta & Flujo',
    icon: '🎯',
    goal: 'Entiende que tu única meta no es cerrar solo el contrato en frío, sino calificar y agendar la llamada de diagnóstico gratuita con los fundadores.',
  },
  {
    id: 'glossary',
    phase: 2,
    phaseName: 'Fase 2: Dominio de Producto & Logística',
    stepNum: 3,
    title: 'Módulo 3: Glosario de Productos & Nichos Recomendados',
    shortLabel: '3. Glosario & Nichos',
    icon: '📚',
    goal: 'Aprende para qué sirve cada producto (Landing, E-commerce, Chatbot IA, PWA, CRM, Dashboard) y a qué comercio recomendárselo.',
  },
  {
    id: 'pre-demo',
    phase: 2,
    phaseName: 'Fase 2: Dominio de Producto & Logística',
    stepNum: 4,
    title: 'Módulo 4: Protocolo Pre-Demo (Checklist de 4 Datos Clave)',
    shortLabel: '4. Datos Pre-Demo',
    icon: '📋',
    goal: 'Aprende los 4 datos obligatorios a pedir al cliente antes de la reunión para que los fundadores preparen la demo interactiva en vivo.',
  },
  {
    id: 'pricing',
    phase: 2,
    phaseName: 'Fase 2: Dominio de Producto & Logística',
    stepNum: 5,
    title: 'Módulo 5: Lógica Comercial de Precios & Cotizador',
    shortLabel: '5. Cotizador & Precios',
    icon: '🧮',
    goal: 'Comprende cómo cotizamos por rangos ajustados al alcance real (tasas regionales LATAM/ES/US, tallas S/M/L/XL y garantías).',
  },
  {
    id: 'product-pitches',
    phase: 3,
    phaseName: 'Fase 3: Herramientas de Cierre & Conversión',
    stepNum: 6,
    title: 'Módulo 6: Mensajes de Abordaje por Producto',
    shortLabel: '6. Mensajes por Producto',
    icon: '🚀',
    goal: 'Guiones conversacionales listos para enviar a clientes según la línea de solución que necesiten.',
  },
  {
    id: 'speeches',
    phase: 3,
    phaseName: 'Fase 3: Herramientas de Cierre & Conversión',
    stepNum: 7,
    title: 'Módulo 7: Guiones de Agendamiento por Sector Comercial',
    shortLabel: '7. Guiones por Sector',
    icon: '💬',
    goal: 'Pitches específicos para Clínicas, Distribuidoras, Retail, Restaurantes y Consultoras B2B.',
  },
  {
    id: 'objections',
    phase: 3,
    phaseName: 'Fase 3: Herramientas de Cierre & Conversión',
    stepNum: 8,
    title: 'Módulo 8: Manejo de Objeciones Frecuentes',
    shortLabel: '8. Objeciones',
    icon: '🛡️',
    goal: 'Aprende a reencuadrar objeciones de precio, respuestas por WhatsApp manual, temores de IA y pedidos de PDF.',
  },
  {
    id: 'roi-calc',
    phase: 3,
    phaseName: 'Fase 3: Herramientas de Cierre & Conversión',
    stepNum: 9,
    title: 'Herramienta Interactiva: Calculadoras ROI Multi-Caso de Uso',
    shortLabel: 'Calculadora ROI',
    icon: '📈',
    goal: 'Usa estas calculadoras en vivo durante la llamada según el tipo de cliente (Ventas, Horas Operativas, Insumos o Consultoría).',
  },
]

export function CapacitacionView({ role, email, name }: Props) {
  const [activeTab, setActiveTab] = useState<TabType>('warm')
  const [searchQuery, setSearchQuery] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Calculator Use Case Selector
  const [calcUseCase, setCalcUseCase] = useState<CalcUseCase>('leads')

  // Case 1: WhatsApp Lead Loss State
  const [dailyLeads, setDailyLeads] = useState(20)
  const [avgTicket, setAvgTicket] = useState(120)
  const [estimatedLossPct, setEstimatedLossPct] = useState(30)

  // Case 2: Manual Task Hours State
  const [staffCount, setStaffCount] = useState(3)
  const [hoursPerDay, setHoursPerDay] = useState(2)
  const [hourlyRate, setHourlyRate] = useState(8)

  // Case 3: Supply / Kitchen Waste State
  const [monthlySupplyBudget, setMonthlySupplyBudget] = useState(4000)
  const [wastePercentage, setWastePercentage] = useState(20)

  // Case 4: B2B Unqualified Calls State
  const [weeklyCalls, setWeeklyCalls] = useState(12)
  const [consultantHourlyRate, setConsultantHourlyRate] = useState(50)
  const [unqualifiedPct, setUnqualifiedPct] = useState(50)

  // Calculations
  // Case 1
  const monthlyLostLeads = Math.round(dailyLeads * 30 * (estimatedLossPct / 100))
  const monthlyLostLeadsMoney = monthlyLostLeads * avgTicket

  // Case 2
  const monthlyWastedHours = Math.round(staffCount * (hoursPerDay * 22))
  const monthlyWastedHoursMoney = monthlyWastedHours * hourlyRate

  // Case 3
  const monthlyWasteSupplyMoney = Math.round(monthlySupplyBudget * (wastePercentage / 100))

  // Case 4
  const monthlyUnqualifiedCalls = Math.round((weeklyCalls * 4) * (unqualifiedPct / 100))
  const monthlyUnqualifiedMoney = Math.round(monthlyUnqualifiedCalls * 1.5 * consultantHourlyRate) // avg 1.5h per meeting + prep

  const currentModule = MODULES.find((m) => m.id === activeTab) ?? MODULES[0]
  const currentIndex = MODULES.findIndex((m) => m.id === activeTab)

  function handleCopy(text: string, id: string) {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  function goToNext() {
    if (currentIndex < MODULES.length - 1) {
      setActiveTab(MODULES[currentIndex + 1].id)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  function goToPrev() {
    if (currentIndex > 0) {
      setActiveTab(MODULES[currentIndex - 1].id)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  // Search Filters
  const filteredGlossary = PRODUCT_GLOSSARY.filter(
    (item) =>
      item.term.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.definition.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.bestFor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.businessValue.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredPitches = PRODUCT_PITCHES.filter(
    (item) =>
      item.product.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.valueFocus.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.conversationalPitch.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.idealProfile.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredSpeeches = SECTOR_SPEECHES.filter(
    (item) =>
      item.sector.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.mainPain.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.pitch.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredObjections = OBJECTIONS.filter(
    (item) =>
      item.objection.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.script.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-nex-black text-nex-white">
      <AdminNav role={role} currentPath="/admin/capacitacion" email={email} name={name} />

      <main className="px-4 sm:px-6 py-8 max-w-6xl mx-auto space-y-8">
        {/* Header & Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-nex-ink/10 pb-6">
          <div>
            <p className="font-dm-mono text-xs text-nex-green uppercase tracking-[0.2em] mb-1">
              nexdevp Academy · Programa de Onboarding Comercial
            </p>
            <h1 className="font-jost font-bold text-3xl text-nex-white">
              Capacitación & Venta de Soluciones
            </h1>
            <p className="font-jost text-sm text-nex-grey mt-1">
              Ruta estructurada paso a paso para dominar las soluciones, agendar clientes y cerrar ventas.
            </p>
          </div>

          {/* Quick Search */}
          <div className="w-full sm:w-72 relative">
            <input
              type="text"
              placeholder="Buscar concepto, sector u objeción..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-nex-dark border border-nex-ink/10 rounded-xl px-4 py-2 text-sm text-nex-white placeholder-nex-grey outline-none focus:border-nex-green/40 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-xs text-nex-grey hover:text-nex-white"
              >
                ✕
              </button>
            )}
          </div>
        </div>



        {/* Tab Navigation Buttons */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-nex-ink/10">
          {MODULES.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={[
                'px-3.5 py-2 rounded-lg font-jost text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-2',
                activeTab === tab.id
                  ? 'bg-nex-green text-nex-black font-semibold shadow-md shadow-nex-green/20'
                  : 'bg-nex-dark text-nex-grey hover:text-nex-white border border-nex-ink/10',
              ].join(' ')}
            >
              <span>{tab.icon}</span>
              <span>{tab.shortLabel}</span>
            </button>
          ))}
        </div>

        {/* CURRENT MODULE OBJECTIVE BANNER */}
        <div className="bg-nex-black/80 border border-nex-green/40 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="font-dm-mono text-[10px] uppercase font-bold text-nex-green tracking-widest">
              {currentModule.phaseName}
            </span>
            <h2 className="font-jost font-bold text-lg text-nex-white flex items-center gap-2">
              <span>{currentModule.icon}</span>
              <span>{currentModule.title}</span>
            </h2>
            <p className="font-jost text-xs text-zinc-300">
              <strong className="text-nex-green font-bold">🎯 Qué vas a aprender aquí:</strong> {currentModule.goal}
            </p>
          </div>

          {/* Module Navigation Next / Prev */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={goToPrev}
              disabled={currentIndex === 0}
              className="px-3 py-1.5 rounded-lg border border-nex-ink/20 font-jost text-xs text-nex-grey hover:text-nex-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              ← Anterior
            </button>
            <button
              onClick={goToNext}
              disabled={currentIndex === MODULES.length - 1}
              className="px-3 py-1.5 rounded-lg bg-nex-green/20 border border-nex-green/40 font-jost text-xs text-nex-green hover:bg-nex-green/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors font-bold"
            >
              Siguiente →
            </button>
          </div>
        </div>

        {/* TAB 1: WARM NETWORK */}
        {activeTab === 'warm' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-nex-green/10 via-transparent to-transparent border border-nex-green/30 rounded-2xl p-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <span className="font-dm-mono text-xs font-bold text-nex-green uppercase tracking-widest bg-nex-green/20 border border-nex-green/40 px-3 py-1 rounded-full">
                    Paso Inicial Obligatorio · Comisión del 20%
                  </span>
                  <h2 className="font-jost font-bold text-2xl text-nex-white mt-3">
                    Paso #1: Tu Lista de Contactos Cercanos
                  </h2>
                  <p className="font-jost text-sm text-zinc-300 mt-1 max-w-2xl">
                    No empieces llamando a desconocidos. La forma más rápida de agendar tus primeras 3 a 5 reuniones en tu primera semana es acudir a personas y comercios donde ya existe confianza previa.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                {WARM_NETWORK_STEPS.map((st) => (
                  <div key={st.step} className="bg-nex-dark/90 border border-nex-ink/10 rounded-xl p-5 space-y-2">
                    <div className="w-8 h-8 rounded-full bg-nex-green/20 text-nex-green font-dm-mono font-bold text-sm flex items-center justify-center">
                      0{st.step}
                    </div>
                    <h3 className="font-jost font-bold text-base text-nex-white">{st.title}</h3>
                    <p className="font-jost text-xs text-zinc-300 leading-relaxed">{st.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Multiple Specialized Scripts for Warm Contacts */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between border-b border-nex-ink/10 pb-3">
                <div>
                  <h3 className="font-jost font-bold text-xl text-nex-white">
                    💬 Mensajes de Abordaje para Conocidos según Producto y Situación
                  </h3>
                  <p className="font-jost text-xs text-zinc-400 mt-0.5">
                    Selecciona y edita el mensaje que mejor se adapte al tipo de conocido o negocio al que vas a escribirle:
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {WARM_SCRIPTS.map((ws) => (
                  <div key={ws.id} className="bg-nex-dark border border-nex-ink/10 rounded-2xl p-6 space-y-4">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{ws.icon}</span>
                        <div>
                          <h4 className="font-jost font-bold text-lg text-nex-white">{ws.title}</h4>
                          <span className="font-dm-mono text-[10px] text-nex-green uppercase tracking-widest bg-nex-green/10 border border-nex-green/20 px-2 py-0.5 rounded">
                            {ws.productFocus}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleCopy(ws.script, ws.id)}
                        className="font-jost text-xs bg-nex-green/10 border border-nex-green/30 text-nex-green hover:bg-nex-green/20 px-3.5 py-1.5 rounded-lg transition-colors font-bold"
                      >
                        {copiedId === ws.id ? '✓ Mensaje copiado' : 'Copiar mensaje'}
                      </button>
                    </div>

                    <div className="bg-nex-black/40 border border-nex-ink/5 p-3 rounded-xl text-xs text-zinc-300">
                      <strong className="text-nex-white font-bold">Cuándo usar este mensaje:</strong> {ws.situation}
                    </div>

                    <div className="bg-nex-black/60 border border-nex-ink/10 rounded-xl p-4 font-jost text-sm text-zinc-200 italic leading-relaxed">
                      {ws.script}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2 text-xs text-nex-green font-dm-mono bg-nex-green/5 border border-nex-green/20 p-4 rounded-xl">
                <span>💡 Regla de Comisión (20%):</span>
                <span className="text-zinc-300">
                  Al enviar cualquiera de estos mensajes a contactos de tu propia red, registra sus datos en el CRM. Como lead propio tuyo, ganas el **20% de comisión** tras el cierre.
                </span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SALES FLOW & GOAL */}
        {activeTab === 'flow' && (
          <div className="space-y-6">
            <div className="bg-nex-dark border border-nex-ink/10 rounded-2xl p-6 space-y-4">
              <h2 className="font-jost font-bold text-2xl text-nex-white">
                El Objetivo del Vendedor & El Flujo de Cierre
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-nex-black/60 border border-nex-green/30 rounded-xl p-5 space-y-3">
                  <h3 className="font-jost font-bold text-lg text-nex-green">🎯 Tu Meta #1: Agendar la Reunión de Diagnóstico</h3>
                  <p className="font-jost text-sm text-zinc-300 leading-relaxed">
                    Tu objetivo no es forzar el cierre del contrato en frío. Tu único objetivo es <strong className="text-nex-white">despertar interés y agendar una llamada de 20 minutos con los fundadores</strong> de nexdevp.
                  </p>
                  <ul className="space-y-2 text-xs font-jost text-zinc-300">
                    <li className="flex items-center gap-2">
                      <span className="text-nex-green">✓</span> Posiciona la llamada como una &ldquo;Demostración Gratuita Operativa&rdquo;.
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-nex-green">✓</span> Los fundadores hacen la demostración técnica en vivo y cierran el contrato.
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-nex-green">✓</span> Tú ganas tu comisión del 15% (pool) o 20% (lead propio) al concretarse el cobro.
                    </li>
                  </ul>
                </div>

                <div className="bg-nex-black/60 border border-nex-ink/10 rounded-xl p-5 space-y-3">
                  <h3 className="font-jost font-bold text-lg text-nex-white">🔍 Filtro de Calificación Rápida</h3>
                  <p className="font-jost text-xs text-zinc-300">
                    Antes de agendar, confirma que el prospecto cumpla al menos 2 de estas características:
                  </p>
                  <div className="space-y-2 text-xs font-jost text-nex-white">
                    <div className="bg-nex-dark p-2.5 rounded-lg border border-nex-ink/10">
                      1. Recibe más de 10-15 mensajes comerciales al día.
                    </div>
                    <div className="bg-nex-dark p-2.5 rounded-lg border border-nex-ink/10">
                      2. Deja clientes sin responder de noche o fines de semana.
                    </div>
                    <div className="bg-nex-dark p-2.5 rounded-lg border border-nex-ink/10">
                      3. Tiene procesos manuales repetitivos (enviar PDFs, anotar a mano).
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: GLOSSARY & INDUSTRY FIT */}
        {activeTab === 'glossary' && (
          <div className="space-y-6">
            <div className="bg-nex-dark border border-nex-ink/10 rounded-2xl p-6">
              <h2 className="font-jost font-bold text-2xl text-nex-white">
                Glosario de Productos & Nichos Recomendados
              </h2>
              <p className="font-jost text-sm text-zinc-300 mt-1">
                Conocimiento de producto simplificado para recomendar la solución exacta según el comercio.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredGlossary.map((item) => (
                <div key={item.id} className="bg-nex-dark border border-nex-ink/10 rounded-xl p-5 space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-jost font-bold text-lg text-nex-white">{item.term}</h3>
                      <span className="font-dm-mono text-[10px] text-nex-green uppercase tracking-widest bg-nex-green/10 border border-nex-green/20 px-2 py-0.5 rounded">
                        {item.category}
                      </span>
                    </div>
                    <p className="font-jost text-xs text-zinc-300 leading-relaxed">{item.definition}</p>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-nex-ink/10">
                    <div className="bg-nex-black/40 p-2.5 rounded-lg border border-nex-ink/5 text-xs">
                      <span className="text-nex-green font-dm-mono font-bold block mb-0.5">🏪 Recomendado para:</span>
                      <span className="text-nex-white font-jost">{item.bestFor}</span>
                    </div>
                    <div className="bg-nex-green/5 p-2.5 rounded-lg border border-nex-green/20 text-xs">
                      <span className="text-nex-green font-dm-mono font-bold block mb-0.5">💰 Argumento comercial (Beneficio):</span>
                      <span className="text-zinc-300 font-jost">{item.businessValue}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: PRE-DEMO SCRIPT */}
        {activeTab === 'pre-demo' && (
          <div className="space-y-6">
            <div className="bg-nex-dark border border-nex-ink/10 rounded-2xl p-6 space-y-3">
              <span className="font-dm-mono text-xs font-bold text-nex-green uppercase tracking-widest">
                Logística Comercial Obligatoria
              </span>
              <h2 className="font-jost font-bold text-2xl text-nex-white">
                Mensaje para Pedir Datos Pre-Demo (Llegar con algo preparado)
              </h2>
              <p className="font-jost text-sm text-zinc-300 max-w-3xl">
                Regla de oro: <strong className="text-nex-white">Nunca entramos a una llamada de diagnóstico sin preparar una demostración previa</strong>. Envía este mensaje al cliente para pedirle sus datos básicos antes de la llamada:
              </p>
            </div>

            <div className="bg-nex-dark border border-nex-ink/10 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h3 className="font-jost font-bold text-lg text-nex-white">
                  💬 {PRE_DEMO_SCRIPT.title}
                </h3>
                <button
                  onClick={() => handleCopy(PRE_DEMO_SCRIPT.script, 'pre-demo-script')}
                  className="font-jost text-xs bg-nex-green/10 border border-nex-green/30 text-nex-green hover:bg-nex-green/20 px-3.5 py-1.5 rounded-lg transition-colors font-bold"
                >
                  {copiedId === 'pre-demo-script' ? '✓ Mensaje copiado' : 'Copiar mensaje'}
                </button>
              </div>

              <div className="bg-nex-black/60 border border-nex-ink/10 rounded-xl p-5 font-jost text-sm text-zinc-200 leading-relaxed whitespace-pre-line">
                {PRE_DEMO_SCRIPT.script}
              </div>

              <div className="bg-nex-green/5 border border-nex-green/20 rounded-xl p-4 text-xs font-jost text-zinc-300">
                <strong className="text-nex-green font-bold">¿Cómo actúa el equipo fundador con esto?</strong> {PRE_DEMO_SCRIPT.why}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: COTIZADOR & PRICING LOGIC */}
        {activeTab === 'pricing' && (
          <div className="space-y-6">
            <div className="bg-nex-dark border border-nex-ink/10 rounded-2xl p-6 space-y-3">
              <span className="font-dm-mono text-xs font-bold text-nex-green uppercase tracking-widest">
                Lógica Comercial de Precios
              </span>
              <h2 className="font-jost font-bold text-2xl text-nex-white">
                Cómo Cotizar: Precios por Rangos y Cotizador
              </h2>
              <p className="font-jost text-sm text-zinc-300 max-w-3xl">
                En nexdevp <strong className="text-nex-white">no vendemos paquetes fijos cerrados</strong>. Cotizamos mediante un Cotizador oficial basado en las necesidades reales del cliente (tallas de desarrollo, tarifas regionales y sobrecostos de garantía).
              </p>
            </div>

            {/* Direct Note from Founders on Price Flexibility & Sales Priority */}
            <div className="bg-gradient-to-r from-nex-green/20 via-nex-green/10 to-transparent border border-nex-green/40 rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-2">
                <span className="font-dm-mono text-[11px] font-bold text-nex-green uppercase tracking-widest bg-nex-green/20 border border-nex-green/40 px-3 py-1 rounded-full">
                  💡 Directiva Comercial Estratégica
                </span>
              </div>
              <h3 className="font-jost font-bold text-lg text-nex-white">
                Precios 100% Ajustables: Lo Primordial en esta Etapa es VENDER
              </h3>
              <p className="font-jost text-xs text-zinc-200 leading-relaxed">
                Los montos y tasas por hora expuestos a continuación son <strong className="text-nex-white">referenciales y totalmente flexibles</strong>. En esta etapa del negocio, nuestra prioridad comercial #1 es <strong className="text-nex-green font-bold">cerrar contratos y sumar clientes satisfechos</strong>.
              </p>
              <div className="bg-nex-black/60 border border-nex-ink/10 rounded-xl p-3.5 text-xs text-zinc-300 font-jost flex items-start gap-2.5">
                <span className="text-base leading-none">💬</span>
                <span>
                  <strong className="text-nex-white font-bold">¿Tienes dudas o necesitas adaptar un precio?</strong> Puedes preguntarnos a los fundadores sin ningún problema. Evaluamos sugerencias y ajustamos la estructura comercial a la medida del prospecto para cerrar el trato.
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-nex-dark border border-nex-ink/10 rounded-xl p-5 space-y-2">
                <p className="font-dm-mono text-xs text-nex-green uppercase tracking-wider">Región LATAM</p>
                <p className="font-jost font-bold text-2xl text-nex-white">~$35 USD / hora</p>
                <p className="font-jost text-xs text-zinc-300">Tarifa base competitiva para pymes en América Latina.</p>
              </div>
              <div className="bg-nex-dark border border-nex-ink/10 rounded-xl p-5 space-y-2">
                <p className="font-dm-mono text-xs text-nex-green uppercase tracking-wider">Región España</p>
                <p className="font-jost font-bold text-2xl text-nex-white">~€55 EUR / hora</p>
                <p className="font-jost text-xs text-zinc-300">Tarifa ajustada al mercado europeo B2B.</p>
              </div>
              <div className="bg-nex-dark border border-nex-ink/10 rounded-xl p-5 space-y-2">
                <p className="font-dm-mono text-xs text-nex-green uppercase tracking-wider">Región EEUU / Global</p>
                <p className="font-jost font-bold text-2xl text-nex-white">~$90 USD / hora</p>
                <p className="font-jost text-xs text-zinc-300">Proyectos de alta complejidad e internacional.</p>
              </div>
            </div>

            <div className="bg-nex-dark border border-nex-ink/10 rounded-2xl p-6 space-y-4">
              <h3 className="font-jost font-bold text-lg text-nex-white">Tallas de Complejidad (T-Shirt Sizing)</h3>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                {[
                  { size: 'S', hours: '8h', desc: 'Pantalla o CRUD simple / Formulario' },
                  { size: 'M', hours: '20h', desc: 'Módulo con lógica o filtros avanzados' },
                  { size: 'L', hours: '40h', desc: 'Integración API Externa / PWA / Chatbot' },
                  { size: 'XL', hours: '80h', desc: 'Agente IA completo + CRM + Multi-sede' },
                ].map((sz) => (
                  <div key={sz.size} className="bg-nex-black/50 border border-nex-ink/10 rounded-xl p-4 space-y-1">
                    <span className="font-dm-mono text-xs font-bold text-nex-green bg-nex-green/10 px-2 py-0.5 rounded">
                      Talla {sz.size} ({sz.hours})
                    </span>
                    <p className="font-jost text-xs text-zinc-300 pt-2">{sz.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: PRODUCT PITCHES FOR ALL PRODUCT LINES */}
        {activeTab === 'product-pitches' && (
          <div className="space-y-6">
            <div className="bg-nex-dark border border-nex-ink/10 rounded-2xl p-6">
              <h2 className="font-jost font-bold text-2xl text-nex-white">
                Mensajes de Abordaje por Producto
              </h2>
              <p className="font-jost text-sm text-zinc-300 mt-1">
                Guiones conversacionales adaptados a cada línea de servicio de nexdevp (Websites, Tiendas Online, IA, PWAs y CRM).
              </p>
            </div>

            <div className="space-y-4">
              {filteredPitches.map((pt) => (
                <div key={pt.id} className="bg-nex-dark border border-nex-ink/10 rounded-2xl p-6 space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{pt.icon}</span>
                      <div>
                        <h3 className="font-jost font-bold text-xl text-nex-white">{pt.product}</h3>
                        <span className="font-dm-mono text-[10px] text-nex-green uppercase tracking-widest">
                          {pt.category}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleCopy(pt.conversationalPitch, pt.id)}
                      className="font-jost text-xs bg-nex-green/10 border border-nex-green/30 text-nex-green hover:bg-nex-green/20 px-3.5 py-1.5 rounded-lg transition-colors font-bold"
                    >
                      {copiedId === pt.id ? '✓ Mensaje copiado' : 'Copiar mensaje'}
                    </button>
                  </div>

                  <div className="bg-nex-black/60 border border-nex-ink/10 rounded-xl p-4 space-y-1">
                    <p className="font-dm-mono text-xs text-nex-green font-bold">🎯 Enfoque de Valor Principal:</p>
                    <p className="font-jost text-xs text-nex-white">{pt.valueFocus}</p>
                  </div>

                  <div className="space-y-2">
                    <p className="font-dm-mono text-xs text-zinc-300 font-bold">💬 Script de Mensaje Conversacional:</p>
                    <p className="font-jost text-sm text-zinc-200 italic bg-nex-black/40 border border-nex-ink/10 rounded-xl p-4 leading-relaxed">
                      {pt.conversationalPitch}
                    </p>
                  </div>

                  <div className="bg-nex-black/30 p-3 rounded-xl border border-nex-ink/5 text-xs">
                    <span className="font-dm-mono font-bold text-nex-green block mb-0.5">👤 Perfil Ideal de Cliente:</span>
                    <span className="font-jost text-zinc-300">{pt.idealProfile}</span>
                  </div>

                  {/* Real World Use Cases by Industry for this Product */}
                  {pt.useCases && pt.useCases.length > 0 && (
                    <div className="space-y-3 pt-3 border-t border-nex-ink/10">
                      <p className="font-dm-mono text-xs font-bold text-nex-green uppercase tracking-widest">
                        💡 Casos de Uso Concretos por Industria (Ideas de Venta):
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {pt.useCases.map((uc, idx) => (
                          <div key={idx} className="bg-nex-black/60 border border-nex-ink/10 rounded-xl p-3.5 space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-base">{uc.icon}</span>
                                <h4 className="font-jost font-bold text-xs text-nex-white">{uc.sector}</h4>
                              </div>
                              <button
                                onClick={() => handleCopy(uc.salesHook, `${pt.id}-uc-${idx}`)}
                                className="font-jost text-[10px] text-nex-green hover:underline font-bold"
                              >
                                {copiedId === `${pt.id}-uc-${idx}` ? '✓ Copiado' : 'Copiar argumento'}
                              </button>
                            </div>
                            <p className="font-jost text-xs text-zinc-300 leading-relaxed">{uc.application}</p>
                            <div className="bg-nex-green/5 border border-nex-green/20 p-2 rounded-lg text-xs font-jost italic text-zinc-200">
                              <strong className="text-nex-green font-dm-mono not-italic font-bold">Hook Comercial: </strong>
                              {uc.salesHook}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 7: SECTOR SPEECHES */}
        {activeTab === 'speeches' && (
          <div className="space-y-6">
            <div className="bg-nex-dark border border-nex-ink/10 rounded-2xl p-6">
              <h2 className="font-jost font-bold text-2xl text-nex-white">
                Guiones de Agendamiento por Sector Comercial
              </h2>
              <p className="font-jost text-sm text-zinc-300 mt-1">
                Pitches específicos para llamadas o mensajes a clientes según su industria.
              </p>
            </div>

            <div className="space-y-4">
              {filteredSpeeches.map((sp) => (
                <div key={sp.id} className="bg-nex-dark border border-nex-ink/10 rounded-2xl p-6 space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{sp.icon}</span>
                      <h3 className="font-jost font-bold text-xl text-nex-white">{sp.sector}</h3>
                    </div>
                    <button
                      onClick={() => handleCopy(sp.pitch, sp.id)}
                      className="font-jost text-xs bg-nex-green/10 border border-nex-green/30 text-nex-green hover:bg-nex-green/20 px-3.5 py-1.5 rounded-lg transition-colors font-bold"
                    >
                      {copiedId === sp.id ? '✓ Mensaje copiado' : 'Copiar mensaje'}
                    </button>
                  </div>

                  <div className="bg-nex-black/60 border border-nex-ink/10 rounded-xl p-4 space-y-2">
                    <p className="font-dm-mono text-xs text-nex-green font-bold">🔥 Dolor principal del nicho:</p>
                    <p className="font-jost text-xs text-zinc-300">{sp.mainPain}</p>
                  </div>

                  <div className="space-y-2">
                    <p className="font-dm-mono text-xs text-nex-white font-bold">💬 Script de Pitch Comercial:</p>
                    <p className="font-jost text-sm text-zinc-200 italic bg-nex-black/40 border border-nex-ink/10 rounded-xl p-4 leading-relaxed">
                      {sp.pitch}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-2">
                    <div className="bg-nex-black/30 p-3 rounded-xl border border-nex-ink/5">
                      <p className="font-dm-mono font-bold text-nex-green mb-1">❓ Preguntas de Descubrimiento:</p>
                      <ul className="list-disc list-inside space-y-1 text-zinc-300">
                        {sp.discoveryQuestions.map((q, i) => (
                          <li key={i}>{q}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-nex-black/30 p-3 rounded-xl border border-nex-ink/5">
                      <p className="font-dm-mono font-bold text-nex-white mb-1">📋 Datos a pedir antes de la llamada:</p>
                      <ul className="list-disc list-inside space-y-1 text-zinc-300">
                        {sp.preDemoData.map((d, i) => (
                          <li key={i}>{d}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 8: OBJECTIONS */}
        {activeTab === 'objections' && (
          <div className="space-y-6">
            <div className="bg-nex-dark border border-nex-ink/10 rounded-2xl p-6">
              <h2 className="font-jost font-bold text-2xl text-nex-white">
                Manejo de Objeciones Frecuentes
              </h2>
              <p className="font-jost text-sm text-zinc-300 mt-1">
                Cómo reencuadrar los temores del cliente hacia la reunión de diagnóstico.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredObjections.map((obj) => (
                <div key={obj.id} className="bg-nex-dark border border-nex-ink/10 rounded-xl p-5 space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <h3 className="font-jost font-bold text-base text-red-400">{obj.objection}</h3>
                    <div className="bg-nex-black/40 p-2.5 rounded-lg border border-nex-ink/5 text-xs text-zinc-300">
                      <strong className="text-nex-green block font-dm-mono mb-0.5">Enfoque de respuesta:</strong>
                      {obj.reframe}
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-nex-ink/10">
                    <div className="flex items-center justify-between">
                      <span className="font-dm-mono text-xs text-nex-white font-bold">Guión de Respuesta:</span>
                      <button
                        onClick={() => handleCopy(obj.script, obj.id)}
                        className="font-jost text-xs text-nex-green hover:underline font-bold"
                      >
                        {copiedId === obj.id ? '✓ Mensaje copiado' : 'Copiar mensaje'}
                      </button>
                    </div>
                    <p className="font-jost text-xs text-zinc-200 italic bg-nex-black/60 p-3 rounded-lg border border-nex-ink/5 leading-relaxed">
                      {obj.script}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 9: MULTI-USE-CASE ROI CALCULATORS */}
        {activeTab === 'roi-calc' && (
          <div className="space-y-6">
            <div className="bg-nex-dark border border-nex-ink/10 rounded-2xl p-6 space-y-3">
              <span className="font-dm-mono text-xs font-bold text-nex-green uppercase tracking-widest">
                Herramientas de Gancho Comercial en Vivo
              </span>
              <h2 className="font-jost font-bold text-2xl text-nex-white">
                Calculadoras en Vivo de Retorno de Inversión (ROI)
              </h2>
              <p className="font-jost text-sm text-zinc-300 max-w-3xl">
                Selecciona el caso de uso del prospecto para proyectar visualmente en vivo el dinero o las horas que está perdiendo por no tener nuestras soluciones.
              </p>

              {/* Use Case Selector Pills */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
                {[
                  {
                    id: 'leads',
                    title: '1. Pérdida en WhatsApp',
                    icon: '📲',
                    subtitle: 'Lentitud de respuesta 24/7',
                  },
                  {
                    id: 'hours',
                    title: '2. Desperdicio de Horas',
                    icon: '⏳',
                    subtitle: 'Tareas manuales/Excel',
                  },
                  {
                    id: 'waste',
                    title: '3. Insumos & Recetas',
                    icon: '🍳',
                    subtitle: 'Over-production en cocina',
                  },
                  {
                    id: 'b2b',
                    title: '4. Llamadas B2B Curiosos',
                    icon: '📞',
                    subtitle: 'Reuniones no calificadas',
                  },
                ].map((uc) => (
                  <button
                    key={uc.id}
                    onClick={() => setCalcUseCase(uc.id as CalcUseCase)}
                    className={[
                      'p-3.5 rounded-xl border text-left transition-all space-y-1',
                      calcUseCase === uc.id
                        ? 'bg-nex-green/10 border-nex-green text-nex-white shadow-lg shadow-nex-green/10'
                        : 'bg-nex-black/40 border-nex-ink/10 text-nex-grey hover:border-nex-ink/30',
                    ].join(' ')}
                  >
                    <div className="flex items-center gap-2 font-jost font-bold text-sm text-nex-white">
                      <span>{uc.icon}</span>
                      <span>{uc.title}</span>
                    </div>
                    <p className="font-jost text-xs text-zinc-400">{uc.subtitle}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* SCENARIO 1: WHATSAPP LEAD LOSS */}
            {calcUseCase === 'leads' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-nex-dark border border-nex-ink/10 rounded-2xl p-6 space-y-5">
                  <div className="border-b border-nex-ink/10 pb-3">
                    <h3 className="font-jost font-bold text-lg text-nex-white">📲 Caso 1: Pérdida por Respuesta Lenta en WhatsApp</h3>
                    <p className="font-jost text-xs text-zinc-400">Ideal para E-commerce, Retail, Clínicas y Venta directa por chat.</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between font-jost text-sm">
                      <span className="text-zinc-300">Mensajes/Consultas diarias recibidas</span>
                      <span className="text-nex-green font-dm-mono font-bold">{dailyLeads} prospectos/día</span>
                    </div>
                    <input
                      type="range"
                      min={5}
                      max={150}
                      value={dailyLeads}
                      onChange={(e) => setDailyLeads(Number(e.target.value))}
                      className="w-full accent-nex-green cursor-pointer"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between font-jost text-sm">
                      <span className="text-zinc-300">Precio promedio del producto/servicio</span>
                      <span className="text-nex-green font-dm-mono font-bold">${avgTicket} USD</span>
                    </div>
                    <input
                      type="range"
                      min={10}
                      max={1000}
                      step={10}
                      value={avgTicket}
                      onChange={(e) => setAvgTicket(Number(e.target.value))}
                      className="w-full accent-nex-green cursor-pointer"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between font-jost text-sm">
                      <span className="text-zinc-300">% Estimado de clientes perdidos por demora (&gt;60s)</span>
                      <span className="text-red-400 font-dm-mono font-bold">{estimatedLossPct}%</span>
                    </div>
                    <input
                      type="range"
                      min={10}
                      max={60}
                      value={estimatedLossPct}
                      onChange={(e) => setEstimatedLossPct(Number(e.target.value))}
                      className="w-full accent-red-400 cursor-pointer"
                    />
                  </div>
                </div>

                <div className="bg-gradient-to-br from-nex-dark to-nex-black border border-red-500/30 rounded-2xl p-6 flex flex-col justify-between space-y-6">
                  <div className="space-y-4">
                    <span className="font-dm-mono text-xs font-bold text-red-400 uppercase tracking-widest bg-red-500/10 border border-red-500/20 px-3 py-1 rounded-full">
                      Pérdida Comercial Mensual
                    </span>

                    <div className="space-y-1">
                      <p className="font-jost text-xs text-zinc-300">Prospectos que compran en otro negocio:</p>
                      <p className="font-jost font-bold text-3xl text-nex-white">
                        ~{monthlyLostLeads} <span className="text-sm font-normal text-zinc-300">clientes/mes</span>
                      </p>
                    </div>

                    <div className="space-y-1 pt-2 border-t border-nex-ink/10">
                      <p className="font-jost text-xs text-zinc-300">Dinero estimado que deja de ingresar:</p>
                      <p className="font-jost font-bold text-4xl text-red-400 font-dm-mono">
                        ${monthlyLostLeadsMoney.toLocaleString()} <span className="text-sm font-normal text-zinc-300">USD / mes</span>
                      </p>
                    </div>
                  </div>

                  <div className="bg-nex-black/60 p-4 rounded-xl border border-nex-ink/10 text-xs text-zinc-300 font-jost space-y-1">
                    <strong className="text-nex-green block font-dm-mono">Argumento de Cierre:</strong>
                    “Recuperar solo el 10% de esos ${monthlyLostLeadsMoney.toLocaleString()} USD paga completamente el Agente IA de WhatsApp en su primer mes de funcionamiento.”
                  </div>
                </div>
              </div>
            )}

            {/* SCENARIO 2: MANUAL TASK HOURS (PWA / CUSTOM SOFTWARE) */}
            {calcUseCase === 'hours' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-nex-dark border border-nex-ink/10 rounded-2xl p-6 space-y-5">
                  <div className="border-b border-nex-ink/10 pb-3">
                    <h3 className="font-jost font-bold text-lg text-nex-white">⏳ Caso 2: Tareas Manuales & Hojas de Excel/Papel</h3>
                    <p className="font-jost text-xs text-zinc-400">Ideal para empresas con empleados de campo, administradores y talleres.</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between font-jost text-sm">
                      <span className="text-zinc-300">N° de empleados con tareas repetitivas</span>
                      <span className="text-nex-green font-dm-mono font-bold">{staffCount} empleados</span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={20}
                      value={staffCount}
                      onChange={(e) => setStaffCount(Number(e.target.value))}
                      className="w-full accent-nex-green cursor-pointer"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between font-jost text-sm">
                      <span className="text-zinc-300">Horas diarias desperdiciadas anotando a mano/Excel</span>
                      <span className="text-nex-green font-dm-mono font-bold">{hoursPerDay}h / día por persona</span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={6}
                      step={0.5}
                      value={hoursPerDay}
                      onChange={(e) => setHoursPerDay(Number(e.target.value))}
                      className="w-full accent-nex-green cursor-pointer"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between font-jost text-sm">
                      <span className="text-zinc-300">Costo / Salario promedio por hora por empleado</span>
                      <span className="text-nex-green font-dm-mono font-bold">${hourlyRate} USD / hora</span>
                    </div>
                    <input
                      type="range"
                      min={3}
                      max={40}
                      value={hourlyRate}
                      onChange={(e) => setHourlyRate(Number(e.target.value))}
                      className="w-full accent-nex-green cursor-pointer"
                    />
                  </div>
                </div>

                <div className="bg-gradient-to-br from-nex-dark to-nex-black border border-red-500/30 rounded-2xl p-6 flex flex-col justify-between space-y-6">
                  <div className="space-y-4">
                    <span className="font-dm-mono text-xs font-bold text-red-400 uppercase tracking-widest bg-red-500/10 border border-red-500/20 px-3 py-1 rounded-full">
                      Desperdicio en Nómina Mensual
                    </span>

                    <div className="space-y-1">
                      <p className="font-jost text-xs text-zinc-300">Horas improductivas tiradas al mes:</p>
                      <p className="font-jost font-bold text-3xl text-nex-white">
                        ~{monthlyWastedHours} <span className="text-sm font-normal text-zinc-300">horas / mes</span>
                      </p>
                    </div>

                    <div className="space-y-1 pt-2 border-t border-nex-ink/10">
                      <p className="font-jost text-xs text-zinc-300">Dinero quemado en sueldos no productivos:</p>
                      <p className="font-jost font-bold text-4xl text-red-400 font-dm-mono">
                        ${monthlyWastedHoursMoney.toLocaleString()} <span className="text-sm font-normal text-zinc-300">USD / mes</span>
                      </p>
                    </div>
                  </div>

                  <div className="bg-nex-black/60 p-4 rounded-xl border border-nex-ink/10 text-xs text-zinc-300 font-jost space-y-1">
                    <strong className="text-nex-green block font-dm-mono">Argumento de Cierre:</strong>
                    “Una PWA o Software a Medida elimina el 80% de ese tiempo muerto en celular en 2 minutos, recuperando ${monthlyWastedHoursMoney.toLocaleString()} USD mensuales en horas del equipo.”
                  </div>
                </div>
              </div>
            )}

            {/* SCENARIO 3: KITCHEN & SUPPLY WASTE (CATERING / RESTAURANTS) */}
            {calcUseCase === 'waste' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-nex-dark border border-nex-ink/10 rounded-2xl p-6 space-y-5">
                  <div className="border-b border-nex-ink/10 pb-3">
                    <h3 className="font-jost font-bold text-lg text-nex-white">🍳 Caso 3: Desperdicio de Insumos (Catering & Gastronomía)</h3>
                    <p className="font-jost text-xs text-zinc-400">Caso real basado en Cocinerhosp (reducción de costo en 6 sedes).</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between font-jost text-sm">
                      <span className="text-zinc-300">Presupuesto mensual de compras/insumos</span>
                      <span className="text-nex-green font-dm-mono font-bold">${monthlySupplyBudget.toLocaleString()} USD / mes</span>
                    </div>
                    <input
                      type="range"
                      min={1000}
                      max={30000}
                      step={500}
                      value={monthlySupplyBudget}
                      onChange={(e) => setMonthlySupplyBudget(Number(e.target.value))}
                      className="w-full accent-nex-green cursor-pointer"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between font-jost text-sm">
                      <span className="text-zinc-300">% Estimado de mermas o sobre-producción</span>
                      <span className="text-red-400 font-dm-mono font-bold">{wastePercentage}%</span>
                    </div>
                    <input
                      type="range"
                      min={10}
                      max={40}
                      value={wastePercentage}
                      onChange={(e) => setWastePercentage(Number(e.target.value))}
                      className="w-full accent-red-400 cursor-pointer"
                    />
                  </div>
                </div>

                <div className="bg-gradient-to-br from-nex-dark to-nex-black border border-red-500/30 rounded-2xl p-6 flex flex-col justify-between space-y-6">
                  <div className="space-y-4">
                    <span className="font-dm-mono text-xs font-bold text-red-400 uppercase tracking-widest bg-red-500/10 border border-red-500/20 px-3 py-1 rounded-full">
                      Fuga Directa de Dinero en Insumos
                    </span>

                    <div className="space-y-1">
                      <p className="font-jost text-xs text-zinc-300">Materia prima o comida tirada a la basura:</p>
                      <p className="font-jost font-bold text-4xl text-red-400 font-dm-mono">
                        ${monthlyWasteSupplyMoney.toLocaleString()} <span className="text-sm font-normal text-zinc-300">USD / mes</span>
                      </p>
                    </div>
                  </div>

                  <div className="bg-nex-black/60 p-4 rounded-xl border border-nex-ink/10 text-xs text-zinc-300 font-jost space-y-1">
                    <strong className="text-nex-green block font-dm-mono">Caso de Éxito Cocinerhosp:</strong>
                    “Con nuestro módulo de cálculo exacto de recetas desde el celular, Cocinerhosp recortó un 25% de desperdicio en sus 6 sedes, salvando más de ${monthlyWasteSupplyMoney.toLocaleString()} USD cada mes.”
                  </div>
                </div>
              </div>
            )}

            {/* SCENARIO 4: UNQUALIFIED B2B CALLS */}
            {calcUseCase === 'b2b' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-nex-dark border border-nex-ink/10 rounded-2xl p-6 space-y-5">
                  <div className="border-b border-nex-ink/10 pb-3">
                    <h3 className="font-jost font-bold text-lg text-nex-white">📞 Caso 4: Llamadas Improductivas con Prospectos sin Presupuesto</h3>
                    <p className="font-jost text-xs text-zinc-400">Ideal para Consultoras, Agencias B2B y Firmas de Servicios Profesionales.</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between font-jost text-sm">
                      <span className="text-zinc-300">N° de reuniones/llamadas semanales realizadas</span>
                      <span className="text-nex-green font-dm-mono font-bold">{weeklyCalls} reuniones / semana</span>
                    </div>
                    <input
                      type="range"
                      min={4}
                      max={30}
                      value={weeklyCalls}
                      onChange={(e) => setWeeklyCalls(Number(e.target.value))}
                      className="w-full accent-nex-green cursor-pointer"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between font-jost text-sm">
                      <span className="text-zinc-300">Valor / Costo por hora del consultor/director</span>
                      <span className="text-nex-green font-dm-mono font-bold">${consultantHourlyRate} USD / hora</span>
                    </div>
                    <input
                      type="range"
                      min={20}
                      max={200}
                      step={5}
                      value={consultantHourlyRate}
                      onChange={(e) => setConsultantHourlyRate(Number(e.target.value))}
                      className="w-full accent-nex-green cursor-pointer"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between font-jost text-sm">
                      <span className="text-zinc-300">% de reuniones con prospectos curiosos sin presupuesto</span>
                      <span className="text-red-400 font-dm-mono font-bold">{unqualifiedPct}%</span>
                    </div>
                    <input
                      type="range"
                      min={20}
                      max={80}
                      value={unqualifiedPct}
                      onChange={(e) => setUnqualifiedPct(Number(e.target.value))}
                      className="w-full accent-red-400 cursor-pointer"
                    />
                  </div>
                </div>

                <div className="bg-gradient-to-br from-nex-dark to-nex-black border border-red-500/30 rounded-2xl p-6 flex flex-col justify-between space-y-6">
                  <div className="space-y-4">
                    <span className="font-dm-mono text-xs font-bold text-red-400 uppercase tracking-widest bg-red-500/10 border border-red-500/20 px-3 py-1 rounded-full">
                      Tiempo Perdido del Socio / Consultor
                    </span>

                    <div className="space-y-1">
                      <p className="font-jost text-xs text-zinc-300">Llamadas tiradas a la basura al mes:</p>
                      <p className="font-jost font-bold text-3xl text-nex-white">
                        ~{monthlyUnqualifiedCalls} <span className="text-sm font-normal text-zinc-300">reuniones / mes</span>
                      </p>
                    </div>

                    <div className="space-y-1 pt-2 border-t border-nex-ink/10">
                      <p className="font-jost text-xs text-zinc-300">Valor de tiempo perdido en Zoom descalificados:</p>
                      <p className="font-jost font-bold text-4xl text-red-400 font-dm-mono">
                        ${monthlyUnqualifiedMoney.toLocaleString()} <span className="text-sm font-normal text-zinc-300">USD / mes</span>
                      </p>
                    </div>
                  </div>

                  <div className="bg-nex-black/60 p-4 rounded-xl border border-nex-ink/10 text-xs text-zinc-300 font-jost space-y-1">
                    <strong className="text-nex-green block font-dm-mono">Argumento de Cierre:</strong>
                    “Nuestro sistema califica automáticamente el presupuesto del prospecto en WhatsApp antes de agendar, ahorrándote ${monthlyUnqualifiedMoney.toLocaleString()} USD al mes en reuniones estériles.”
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

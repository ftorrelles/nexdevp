'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useTranslations } from 'next-intl'

// ── BUSINESS CONFIGS ──
interface BusinessConfig {
  name: string
  avatar: string
  desc: string
  context: { key: string; val: string }[]
  chips: string[]
  responses: Record<string, string | string[]>
}

function detectIntent(text: string): string {
  const t = text.toLowerCase()
  if (/servicio|tienen|ofrecen|especiali|product|qué hay|que hay|catálogo|catalogo|qué hacen|what|service|special|offer|have|available/.test(t)) return 'servicios'
  if (/cita|agendar|reserv|quiero|pedir|pedido|consulta|reunión|reunion|book|schedule|appointment|order|want/.test(t)) return 'cita'
  if (/precio|costo|cuánto|cuanto|vale|valor|cobran|price|cost|how much|charge/.test(t)) return 'precio'
  if (/horario|hora|atienden|disponib|cuándo|cuando|días|dias|hour|schedule|open|available|when/.test(t)) return 'horario'
  if (/gracias|perfecto|excelente|ok|listo|bien|thanks|thank|great|perfect|done/.test(t)) return 'gracias'
  return 'default'
}

interface Message {
  id: number
  text: string
  type: 'incoming' | 'outgoing' | 'system'
  time: string
}

const BIZ_KEYS = ['clinica', 'distribuidora', 'consultora', 'retail'] as const

export function DemoSection() {
  const t = useTranslations('demo')

  const BUSINESSES: Record<string, BusinessConfig> = {
    clinica: {
      name: 'Centro Médico San Rafael',
      avatar: '🏥',
      desc: t('clinica_desc'),
      context: [
        { key: t('clinica_ctx1_key'), val: t('clinica_ctx1_val') },
        { key: t('clinica_ctx2_key'), val: t('clinica_ctx2_val') },
        { key: t('clinica_ctx3_key'), val: t('clinica_ctx3_val') },
        { key: t('clinica_ctx4_key'), val: t('clinica_ctx4_val') },
      ],
      chips: [t('clinica_chip1'), t('clinica_chip2'), t('clinica_chip3'), t('clinica_chip4')],
      responses: {
        default: [t('clinica_resp_default')],
        servicios: t('clinica_resp_servicios'),
        cita: t('clinica_resp_cita'),
        precio: t('clinica_resp_precio'),
        horario: t('clinica_resp_horario'),
        gracias: t('clinica_resp_gracias'),
      },
    },
    distribuidora: {
      name: 'Distribuidora El Volcán',
      avatar: '📦',
      desc: t('dist_desc'),
      context: [
        { key: t('dist_ctx1_key'), val: t('dist_ctx1_val') },
        { key: t('dist_ctx2_key'), val: t('dist_ctx2_val') },
        { key: t('dist_ctx3_key'), val: t('dist_ctx3_val') },
        { key: t('dist_ctx4_key'), val: t('dist_ctx4_val') },
      ],
      chips: [t('dist_chip1'), t('dist_chip2'), t('dist_chip3'), t('dist_chip4')],
      responses: {
        default: [t('dist_resp_default')],
        servicios: t('dist_resp_servicios'),
        cita: t('dist_resp_cita'),
        precio: t('dist_resp_precio'),
        horario: t('dist_resp_horario'),
        gracias: t('dist_resp_gracias'),
      },
    },
    consultora: {
      name: 'nexdevp',
      avatar: '💻',
      desc: t('cons_desc'),
      context: [
        { key: t('cons_ctx1_key'), val: t('cons_ctx1_val') },
        { key: t('cons_ctx2_key'), val: t('cons_ctx2_val') },
        { key: t('cons_ctx3_key'), val: t('cons_ctx3_val') },
        { key: t('cons_ctx4_key'), val: t('cons_ctx4_val') },
      ],
      chips: [t('cons_chip1'), t('cons_chip2'), t('cons_chip3'), t('cons_chip4')],
      responses: {
        default: [t('cons_resp_default')],
        servicios: t('cons_resp_servicios'),
        cita: t('cons_resp_cita'),
        precio: t('cons_resp_precio'),
        horario: t('cons_resp_horario'),
        gracias: t('cons_resp_gracias'),
      },
    },
    retail: {
      name: 'Moda Urbana Store',
      avatar: '👗',
      desc: t('retail_desc'),
      context: [
        { key: t('retail_ctx1_key'), val: t('retail_ctx1_val') },
        { key: t('retail_ctx2_key'), val: t('retail_ctx2_val') },
        { key: t('retail_ctx3_key'), val: t('retail_ctx3_val') },
        { key: t('retail_ctx4_key'), val: t('retail_ctx4_val') },
      ],
      chips: [t('retail_chip1'), t('retail_chip2'), t('retail_chip3'), t('retail_chip4')],
      responses: {
        default: [t('retail_resp_default')],
        servicios: t('retail_resp_servicios'),
        cita: t('retail_resp_cita'),
        precio: t('retail_resp_precio'),
        horario: t('retail_resp_horario'),
        gracias: t('retail_resp_gracias'),
      },
    },
  }

  const BIZ_LABELS: Record<string, string> = {
    clinica: t('biz_clinica'),
    distribuidora: t('biz_distribuidora'),
    consultora: t('biz_consultora'),
    retail: t('biz_retail'),
  }
  const [currentBiz, setCurrentBiz] = useState<string>('clinica')
  const [messages, setMessages] = useState<Message[]>([
    { id: 0, text: t('system_message'), type: 'system', time: '' },
  ])
  const [chips, setChips] = useState<string[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [msgCount, setMsgCount] = useState(0)
  const [crmAdded, setCrmAdded] = useState(false)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const idCounter = useRef(1)

  const scrollToBottom = useCallback(() => {
    const el = messagesContainerRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping, scrollToBottom])

  const getTime = () =>
    new Date().toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })

  const addMessage = useCallback((text: string, type: Message['type']) => {
    const id = idCounter.current++
    setMessages((prev) => [...prev, { id, text, type, time: getTime() }])
    return id
  }, [])

  const handleSend = useCallback(
    async (text?: string) => {
      const msg = (text ?? inputValue).trim()
      if (!msg || isTyping) return
      setInputValue('')

      addMessage(msg, 'outgoing')
      const newCount = msgCount + 1
      setMsgCount(newCount)

      if (!crmAdded) {
        setCrmAdded(true)
      }

      const intent = detectIntent(msg)
      const biz = BUSINESSES[currentBiz]

      await new Promise((r) => setTimeout(r, 600))
      setIsTyping(true)

      const delay = 1200 + Math.random() * 800
      await new Promise((r) => setTimeout(r, delay))
      setIsTyping(false)

      const responses = biz.responses[intent] ?? biz.responses.default
      const response = Array.isArray(responses)
        ? responses[Math.floor(Math.random() * responses.length)]
        : responses

      addMessage(response as string, 'incoming')

      if (newCount === 1) {
        setChips([t('chips_followup_1'), t('chips_followup_2'), t('chips_followup_3'), t('chips_followup_4')])
      }
    },
    [inputValue, isTyping, msgCount, crmAdded, currentBiz, addMessage]
  )

  const handleBizChange = useCallback(
    (biz: string) => {
      setCurrentBiz(biz)
      setMessages([{ id: 0, text: t('system_message'), type: 'system', time: '' }])
      setChips(BUSINESSES[biz].chips)
      setMsgCount(0)
      setCrmAdded(false)
      idCounter.current = 1

      // Show initial greeting after short delay
      setTimeout(async () => {
        setIsTyping(true)
        await new Promise((r) => setTimeout(r, 1000))
        setIsTyping(false)
        const greet = BUSINESSES[biz].responses.default
        const msg = Array.isArray(greet) ? greet[0] : greet
        const id = idCounter.current++
        setMessages((prev) => [...prev, { id, text: msg as string, type: 'incoming', time: getTime() }])
      }, 300)
    },
    []
  )

  // Initial greeting on mount
  useEffect(() => {
    handleBizChange('clinica')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const biz = BUSINESSES[currentBiz]

  const formatMessage = (text: string) =>
    text
      .replace(/\*(.*?)\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br />')

  return (
    <section id="demo" className="bg-nex-dark py-24 px-6 lg:px-12" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.025) 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <p className="font-dm-mono text-xs text-nex-green uppercase tracking-[0.2em] mb-4">
          {t('eyebrow')}
        </p>
        <h2 className="font-jost font-bold text-4xl lg:text-5xl text-nex-white mb-4">
          {t('heading')} <span className="text-nex-green">{t('heading_accent')}</span>
        </h2>
        <p className="font-jost text-nex-grey max-w-2xl mb-10">
          {t('sub')}
        </p>

        {/* Business selector */}
        <div className="flex flex-wrap gap-2 mb-8">
          {BIZ_KEYS.map((key) => (
            <button
              key={key}
              onClick={() => handleBizChange(key)}
              className={`font-dm-mono text-xs uppercase tracking-[0.12em] px-4 py-2 rounded-lg border transition-all ${
                currentBiz === key
                  ? 'bg-nex-green text-nex-black border-nex-green font-semibold'
                  : 'bg-transparent text-nex-grey border-white/10 hover:border-nex-green/50 hover:text-nex-white'
              }`}
            >
              {BIZ_LABELS[key]}
            </button>
          ))}
        </div>

        {/* Main demo grid */}
        <div className="grid lg:grid-cols-[1fr_380px] gap-6">
          {/* LEFT: Context panel */}
          <div className="bg-nex-black rounded-xl border border-white/5 p-6 flex flex-col gap-6">
            {/* Business info */}
            <div>
              <p className="font-dm-mono text-xs text-nex-grey/50 uppercase tracking-[0.2em] mb-2">
                {t('context_label')}
              </p>
              <p className="font-jost font-semibold text-nex-white text-lg">{biz.name}</p>
              <p className="font-jost text-sm text-nex-grey mt-1 leading-relaxed">{biz.desc}</p>
            </div>

            {/* Context box */}
            <div className="bg-nex-dark rounded-lg border border-white/5 p-4">
              <p className="font-dm-mono text-xs text-nex-grey/50 uppercase tracking-[0.2em] mb-3">
                {t('agent_knows')}
              </p>
              <div className="space-y-3">
                {biz.context.map((item, i) => (
                  <div key={i} className={i < biz.context.length - 1 ? 'pb-3 border-b border-white/5' : ''}>
                    <p className="font-dm-mono text-xs text-nex-grey/40 mb-1">{item.key}</p>
                    <p className="font-jost text-sm text-nex-grey leading-relaxed">{item.val}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* CRM preview */}
            <div className="bg-nex-dark rounded-lg border border-white/5 overflow-hidden">
              <div className="bg-nex-black px-4 py-3 flex items-center justify-between">
                <span className="font-dm-mono text-xs text-nex-grey/50 uppercase tracking-[0.15em]">
                  {t('crm_label')}
                </span>
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-nex-green animate-pulse" />
                  <span className="font-dm-mono text-xs text-nex-grey/40">{t('crm_live')}</span>
                </span>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-jost text-sm font-medium text-nex-white">{t('crm_lead1_name')}</p>
                    <p className="font-jost text-xs text-nex-grey/50 mt-0.5">{t('crm_lead1_time')}</p>
                  </div>
                  <span className="font-dm-mono text-xs px-2 py-1 rounded-full bg-blue-500/10 text-blue-400">
                    {t('crm_lead1_status')}
                  </span>
                </div>
                <div className="flex items-center justify-between border-t border-white/5 pt-3">
                  <div>
                    <p className="font-jost text-sm font-medium text-nex-white">{t('crm_lead2_name')}</p>
                    <p className="font-jost text-xs text-nex-grey/50 mt-0.5">{t('crm_lead2_time')}</p>
                  </div>
                  <span className="font-dm-mono text-xs px-2 py-1 rounded-full bg-orange-500/10 text-orange-400">
                    {t('crm_lead2_status')}
                  </span>
                </div>
                {crmAdded && (
                  <div className="flex items-center justify-between border-t border-white/5 pt-3">
                    <div>
                      <p className="font-jost text-sm font-medium text-nex-white">{t('crm_demo_name')}</p>
                      <p className="font-jost text-xs text-nex-grey/50 mt-0.5">{t('crm_demo_time')}</p>
                    </div>
                    <span className="font-dm-mono text-xs px-2 py-1 rounded-full bg-nex-green/10 text-nex-green">
                      {t('crm_demo_status')}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Explanation */}
            <div className="bg-nex-green/5 rounded-lg border border-nex-green/10 p-4">
              <p className="font-jost font-semibold text-nex-white text-sm mb-2">{t('explanation_title')}</p>
              <p className="font-jost text-xs text-nex-grey leading-relaxed">
                {t('explanation_text')}
              </p>
            </div>
          </div>

          {/* RIGHT: WhatsApp simulation */}
          <div
            className="rounded-xl overflow-hidden flex flex-col"
            style={{ height: '600px', background: '#e5ddd5' }}
          >
            {/* WA Header */}
            <div className="px-4 py-3 flex items-center gap-3" style={{ background: '#128c7e' }}>
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-base flex-shrink-0"
                style={{ background: 'rgba(255,255,255,0.15)' }}
              >
                {biz.avatar}
              </div>
              <div>
                <p className="text-white font-medium text-sm">{biz.name}</p>
                <p className="text-white/70 text-xs flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block animate-pulse" />
                  {t('online_status')}
                </p>
              </div>
            </div>

            {/* Messages */}
            <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-3 flex flex-col gap-1.5">
              {messages.map((msg) => {
                if (msg.type === 'system') {
                  return (
                    <div
                      key={msg.id}
                      className="self-center text-center text-xs italic px-3 py-1.5 rounded-full"
                      style={{ background: 'rgba(0,0,0,0.06)', color: 'rgba(0,0,0,0.5)' }}
                    >
                      {msg.text}
                    </div>
                  )
                }
                return (
                  <div
                    key={msg.id}
                    className={`max-w-[82%] px-3 py-2 rounded-lg text-sm leading-relaxed word-wrap break-words ${
                      msg.type === 'outgoing' ? 'self-end rounded-tr-sm' : 'self-start rounded-tl-sm'
                    }`}
                    style={{
                      background: msg.type === 'outgoing' ? '#dcf8c6' : '#ffffff',
                      color: '#111',
                      boxShadow: '0 1px 1px rgba(0,0,0,0.08)',
                    }}
                  >
                    <span
                      dangerouslySetInnerHTML={{ __html: formatMessage(msg.text) }}
                    />
                    {msg.time && (
                      <span
                        className="text-right block mt-1"
                        style={{ fontSize: '9.5px', color: 'rgba(0,0,0,0.35)' }}
                      >
                        {msg.time}
                        {msg.type === 'outgoing' && ' ✓✓'}
                      </span>
                    )}
                  </div>
                )
              })}

              {/* Typing indicator */}
              {isTyping && (
                <div
                  className="self-start px-3 py-2.5 rounded-lg rounded-tl-sm flex items-center gap-1"
                  style={{ background: '#ffffff', boxShadow: '0 1px 1px rgba(0,0,0,0.08)' }}
                >
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="w-1.5 h-1.5 rounded-full inline-block"
                      style={{
                        background: '#aaa',
                        animation: `typing 1.2s ease-in-out ${i * 0.2}s infinite`,
                      }}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Quick replies */}
            <div
              className="px-3 py-2 flex gap-1.5 flex-wrap"
              style={{ background: 'rgba(0,0,0,0.04)', borderTop: '1px solid rgba(0,0,0,0.06)' }}
            >
              {chips.map((chip) => (
                <button
                  key={chip}
                  onClick={() => handleSend(chip)}
                  className="text-xs px-3 py-1.5 rounded-full border cursor-pointer whitespace-nowrap transition-all"
                  style={{
                    color: '#075e54',
                    borderColor: '#075e54',
                    background: 'rgba(255,255,255,0.8)',
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = '#075e54'
                    e.currentTarget.style.color = '#fff'
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.8)'
                    e.currentTarget.style.color = '#075e54'
                  }}
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Input area */}
            <div
              className="px-3 py-2 flex items-center gap-2.5"
              style={{ background: '#f0f0f0', borderTop: '1px solid rgba(0,0,0,0.1)' }}
            >
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder={t('placeholder')}
                className="flex-1 rounded-full px-4 py-2 text-sm outline-none border-none"
                style={{ background: '#fff', color: '#333' }}
              />
              <button
                onClick={() => handleSend()}
                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-colors"
                style={{ background: '#128c7e' }}
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Typing animation keyframes */}
      <style>{`
        @keyframes typing {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-5px); }
        }
      `}</style>
    </section>
  )
}

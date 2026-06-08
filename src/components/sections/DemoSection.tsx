'use client'

import { useState, useRef, useEffect, useCallback } from 'react'

// ── BUSINESS CONFIGS ──
interface BusinessConfig {
  name: string
  avatar: string
  desc: string
  context: { key: string; val: string }[]
  chips: string[]
  responses: Record<string, string | string[]>
}

const BUSINESSES: Record<string, BusinessConfig> = {
  clinica: {
    name: 'Centro Médico San Rafael',
    avatar: '🏥',
    desc: 'Clínica privada · Especialidades: pediatría, medicina interna, ginecología · Citas desde $25 · Atiende lunes a sábado',
    context: [
      { key: 'Servicios principales', val: 'Pediatría, Medicina Interna, Ginecología, Cardiología' },
      { key: 'Precio consulta', val: 'Desde $25 · Precio exacto según especialidad' },
      { key: 'Disponibilidad', val: 'Lunes a Sábado, 8am–6pm · Urgencias hasta 9pm' },
      { key: 'Cómo agendar', val: 'El agente agenda directamente o pasa a humano si el caso es complejo' },
    ],
    chips: ['¿Qué especialidades tienen?', 'Quiero agendar una cita', '¿Cuánto cuesta consulta?', '¿En qué horario atienden?'],
    responses: {
      default: [
        '¡Hola! Bienvenido al Centro Médico San Rafael. Soy el asistente virtual del centro. ¿En qué puedo ayudarte hoy? 😊',
      ],
      servicios: 'Contamos con las siguientes especialidades médicas:\n\n• 👶 *Pediatría* — Consulta desde $25\n• 🩺 *Medicina Interna* — Consulta desde $30\n• 👩‍⚕️ *Ginecología* — Consulta desde $35\n• ❤️ *Cardiología* — Consulta desde $40\n\nTodas nuestras consultas incluyen revisión completa. ¿Te gustaría agendar?',
      cita: '¡Perfecto! Para agendar tu cita necesito algunos datos:\n\n1️⃣ ¿Con qué especialidad necesitas la cita?\n2️⃣ ¿Prefieres mañana por la mañana o la tarde?\n\nTenemos disponibilidad esta semana. 📅',
      precio: 'Nuestros precios de consulta son:\n\n• Pediatría: *$25*\n• Medicina Interna: *$30*\n• Ginecología: *$35*\n• Cardiología: *$40*\n\n💡 El pago se realiza el día de la consulta. ¿Deseas agendar?',
      horario: 'Nuestros horarios de atención:\n\n🕗 *Lunes a Viernes:* 8:00am – 6:00pm\n🕗 *Sábado:* 8:00am – 2:00pm\n🚨 *Urgencias:* hasta las 9:00pm\n\n¿En qué momento te quedaría mejor una cita?',
      gracias: '¡Con mucho gusto! Si tienes alguna duda más no dudes en escribirnos. Te esperamos pronto. 🙏',
    },
  },
  distribuidora: {
    name: 'Distribuidora El Volcán',
    avatar: '📦',
    desc: 'Distribuidora de alimentos · Ventas al mayor y detal · Despacho 24-48h · Pago Móvil y Zelle',
    context: [
      { key: 'Productos', val: 'Granos, aceites, harina, azúcar, productos de limpieza' },
      { key: 'Pedido mínimo', val: '$80 USD para despacho a domicilio' },
      { key: 'Métodos de pago', val: 'Pago Móvil, Zelle, transferencia bancaria' },
      { key: 'Despacho', val: '24-48 horas dentro de Caracas y Miranda' },
    ],
    chips: ['¿Qué productos tienen?', 'Quiero hacer un pedido', '¿Cuál es el precio del aceite?', '¿Hacen despacho?'],
    responses: {
      default: ['¡Hola! Bienvenido a Distribuidora El Volcán. ¿Estás buscando algún producto o quieres ver nuestra lista de precios? 📦'],
      servicios: 'Estos son los más solicitados esta semana:\n\n🫙 *Aceite de maíz* 1L — $2.80\n🌾 *Harina PAN* 1kg — $1.50\n🫘 *Caraotas negras* 1kg — $1.80\n🧴 *Azúcar blanca* 1kg — $1.20\n\n¿Te interesa alguno? Pedido mínimo para despacho: *$80*.',
      cita: 'Para procesar tu pedido necesito:\n\n1️⃣ ¿Qué productos y en qué cantidad?\n2️⃣ Dirección de entrega\n3️⃣ ¿Prefieres Zelle o Pago Móvil?\n\nEscríbeme la lista y te calculo el total. 📋',
      precio: 'Lista de precios actual:\n\n*Aceites:* Maíz 1L $2.80 · Soya 1L $2.60\n*Harinas:* PAN 1kg $1.50 · Trigo 1kg $1.80\n*Granos:* Caraotas $1.80 · Lentejas $2.10\n*Azúcar:* Blanca 1kg $1.20\n\n📦 *Pedido mínimo $80 para despacho.*',
      horario: 'Tomamos pedidos *todos los días de 7am a 6pm*. El despacho se hace en 24-48 horas hábiles en Caracas y Miranda.\n\n🚚 *Despacho gratuito* en pedidos mayores a $150.',
      gracias: '¡Gracias a ti! Tu pedido queda registrado y te confirmamos por este mismo chat. 🙌',
    },
  },
  consultora: {
    name: 'nexdevp',
    avatar: '💻',
    desc: 'Ingeniería de Ventas con IA · Sistemas, automatización y agentes de IA · Venezuela e internacional',
    context: [
      { key: 'Productos principales', val: 'Motor de Ventas con IA, Presencia Inteligente, Comercio Inteligente' },
      { key: 'Ticket promedio', val: '$2,200 – $3,200 por proyecto · Retainer desde $1,200/mes' },
      { key: 'Primera consulta', val: 'Siempre gratis, sin compromiso · 20 minutos' },
      { key: 'Tiempo de entrega', val: '25 a 45 días según el producto' },
    ],
    chips: ['¿Qué servicios ofrecen?', 'Quiero una consulta gratis', '¿Cuánto cuestan sus servicios?', '¿Cuánto tarda un proyecto?'],
    responses: {
      default: ['¡Hola! Soy el asistente de nexdevp 👋 Ayudamos a empresas a automatizar sus ventas usando inteligencia artificial. ¿Qué necesita tu negocio?'],
      servicios: 'Trabajamos con 4 productos principales:\n\n🌐 *Presencia Inteligente* ($2,200) — Web premium + chatbot IA\n🤖 *Motor de Ventas con IA* ($2,800) — Agente IA + CRM + WhatsApp\n🛒 *Comercio Inteligente* ($3,200) — Tienda online + agente de atención\n📈 *Retainer de Crecimiento* ($1,200/mes) — Optimización continua\n\n¿Cuál se ajusta más a lo que buscas?',
      cita: '¡Perfecto! La primera consulta es *gratis* y dura 20 minutos. Revisamos tu situación y te decimos exactamente qué tiene más sentido para tu negocio.\n\n📅 ¿Cuándo tenés disponibilidad esta semana?',
      precio: 'Nuestros productos tienen precios fijos:\n\n• Presencia Inteligente: *$2,200*\n• Motor de Ventas con IA: *$2,800* ⭐\n• Comercio Inteligente: *$3,200*\n• Retainer mensual: desde *$1,200/mes*\n\n💡 Primera consulta siempre *gratis*.',
      horario: 'Atendemos de lunes a viernes de 9am a 6pm. La consulta inicial la hacemos por videollamada.\n\n🕗 Normalmente respondemos en menos de 2 horas.',
      gracias: '¡Gracias por escribirnos! Quedamos atentos. Un asesor te contactará pronto. 🙏',
    },
  },
  retail: {
    name: 'Moda Urbana Store',
    avatar: '👗',
    desc: 'Tienda de ropa y accesorios · Caracas · Colecciones nuevas cada mes · Envío nacional',
    context: [
      { key: 'Productos', val: 'Ropa casual, ropa de trabajo, accesorios, calzado' },
      { key: 'Precios', val: 'Camisas desde $12 · Pantalones desde $18 · Accesorios desde $5' },
      { key: 'Formas de pago', val: 'Zelle, Pago Móvil, efectivo USD' },
      { key: 'Despacho', val: 'Caracas: 24h · Nacional: 3-5 días por MRW o Zoom' },
    ],
    chips: ['¿Qué tienen disponible?', 'Quiero ver los precios', '¿Hacen envíos?', '¿Tienen tallas grandes?'],
    responses: {
      default: ['¡Hola! Bienvenido a Moda Urbana Store 👗✨ ¿Qué tipo de ropa estás buscando hoy?'],
      servicios: 'Tenemos disponible:\n\n👕 *Camisas básicas* desde $12 · Tallas XS-XXL\n👖 *Pantalones* desde $18 · Jeans y casuales\n👗 *Vestidos* desde $22 · Colección nueva esta semana\n👟 *Calzado* desde $25\n💍 *Accesorios* desde $5\n\n¿Te interesa algo en particular?',
      cita: '¡Claro! Para prepararte el pedido necesito:\n\n1️⃣ ¿Qué prendas te interesan?\n2️⃣ ¿Cuál es tu talla?\n3️⃣ ¿Estás en Caracas o necesitas envío?\n\nTe mando fotos de las opciones disponibles 📸',
      precio: 'Rangos de precio actuales:\n\n• Camisas: $12 – $22\n• Pantalones: $18 – $35\n• Vestidos: $22 – $45\n• Calzado: $25 – $55\n• Accesorios: $5 – $25\n\nAceptamos Zelle, Pago Móvil y efectivo USD.',
      horario: 'Tomamos pedidos *todos los días de 9am a 8pm*.\n\n🚚 Caracas: *24 horas* · Nacional: *3-5 días*\n\n¿Necesitas algo para este fin de semana?',
      gracias: '¡Gracias por escribirnos! Cualquier duda sobre tallas o disponibilidad, estamos aquí 🙌',
    },
  },
}

function detectIntent(text: string): string {
  const t = text.toLowerCase()
  if (/servicio|tienen|ofrecen|especiali|product|qué hay|que hay|catálogo|catalogo|qué hacen/.test(t)) return 'servicios'
  if (/cita|agendar|reserv|quiero|pedir|pedido|consulta|reunión|reunion/.test(t)) return 'cita'
  if (/precio|costo|cuánto|cuanto|vale|valor|cobran/.test(t)) return 'precio'
  if (/horario|hora|atienden|disponib|cuándo|cuando|días|dias/.test(t)) return 'horario'
  if (/gracias|perfecto|excelente|ok|listo|bien/.test(t)) return 'gracias'
  return 'default'
}

interface Message {
  id: number
  text: string
  type: 'incoming' | 'outgoing' | 'system'
  time: string
}

const BIZ_KEYS = ['clinica', 'distribuidora', 'consultora', 'retail'] as const
const BIZ_LABELS: Record<string, string> = {
  clinica: 'Clínica',
  distribuidora: 'Distribuidora',
  consultora: 'Consultora',
  retail: 'Retail',
}

export function DemoSection() {
  const [currentBiz, setCurrentBiz] = useState<string>('clinica')
  const [messages, setMessages] = useState<Message[]>([
    { id: 0, text: 'Escribe como si fueras un cliente del negocio', type: 'system', time: '' },
  ])
  const [chips, setChips] = useState<string[]>(BUSINESSES.clinica.chips)
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [msgCount, setMsgCount] = useState(0)
  const [crmAdded, setCrmAdded] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const idCounter = useRef(1)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
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
        setChips(['¿Y los precios?', 'Quiero agendar', '¿Cuánto tardan?', 'Gracias, ya está'])
      }
    },
    [inputValue, isTyping, msgCount, crmAdded, currentBiz, addMessage]
  )

  const handleBizChange = useCallback(
    (biz: string) => {
      setCurrentBiz(biz)
      setMessages([{ id: 0, text: 'Escribe como si fueras un cliente del negocio', type: 'system', time: '' }])
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
    <section className="bg-nex-dark py-24 px-6 lg:px-12">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <p className="font-dm-mono text-xs text-nex-green uppercase tracking-[0.2em] mb-4">
          DEMO INTERACTIVA
        </p>
        <h2 className="font-jost font-bold text-4xl lg:text-5xl text-nex-white mb-4">
          Así trabaja el Agente. <span className="text-nex-green">En vivo.</span>
        </h2>
        <p className="font-jost text-nex-grey max-w-2xl mb-10">
          Elegí un tipo de negocio y escribí como si fueras un cliente. El agente responde, cualifica y agenda en tiempo real.
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
                Empresa en demo
              </p>
              <p className="font-jost font-semibold text-nex-white text-lg">{biz.name}</p>
              <p className="font-jost text-sm text-nex-grey mt-1 leading-relaxed">{biz.desc}</p>
            </div>

            {/* Context box */}
            <div className="bg-nex-dark rounded-lg border border-white/5 p-4">
              <p className="font-dm-mono text-xs text-nex-grey/50 uppercase tracking-[0.2em] mb-3">
                Lo que el agente sabe sobre este negocio
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
                  CRM · Leads capturados
                </span>
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-nex-green animate-pulse" />
                  <span className="font-dm-mono text-xs text-nex-grey/40">En vivo</span>
                </span>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-jost text-sm font-medium text-nex-white">María G.</p>
                    <p className="font-jost text-xs text-nex-grey/50 mt-0.5">Consulta · Hace 12 min</p>
                  </div>
                  <span className="font-dm-mono text-xs px-2 py-1 rounded-full bg-blue-500/10 text-blue-400">
                    Agendada
                  </span>
                </div>
                <div className="flex items-center justify-between border-t border-white/5 pt-3">
                  <div>
                    <p className="font-jost text-sm font-medium text-nex-white">Carlos M.</p>
                    <p className="font-jost text-xs text-nex-grey/50 mt-0.5">Consulta · Hace 1h</p>
                  </div>
                  <span className="font-dm-mono text-xs px-2 py-1 rounded-full bg-orange-500/10 text-orange-400">
                    Interesado
                  </span>
                </div>
                {crmAdded && (
                  <div className="flex items-center justify-between border-t border-white/5 pt-3">
                    <div>
                      <p className="font-jost text-sm font-medium text-nex-white">Tú (Demo)</p>
                      <p className="font-jost text-xs text-nex-grey/50 mt-0.5">Demo en curso · Ahora</p>
                    </div>
                    <span className="font-dm-mono text-xs px-2 py-1 rounded-full bg-nex-green/10 text-nex-green">
                      Nuevo ↑
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Explanation */}
            <div className="bg-nex-green/5 rounded-lg border border-nex-green/10 p-4">
              <p className="font-jost font-semibold text-nex-white text-sm mb-2">¿Qué está pasando aquí?</p>
              <p className="font-jost text-xs text-nex-grey leading-relaxed">
                Mientras el agente conversa con el cliente en WhatsApp, toda la información queda
                registrada automáticamente en el CRM. El dueño del negocio lo ve en tiempo real sin hacer nada.
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
                  En línea · Responde al instante
                </p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-1.5">
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
              <div ref={messagesEndRef} />
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
                placeholder="Escribe un mensaje..."
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

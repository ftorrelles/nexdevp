// OpenWA sends POST with message payload
// This scaffold is ready to connect — set OPENWA_WEBHOOK_SECRET and GROQ_API_KEY in .env.local

interface OpenWAMessage {
  body: string
  from: string
  id: string
  type: string
}

export async function POST(req: Request) {
  // 1. Verify webhook secret
  const secret = req.headers.get('x-webhook-secret')
  if (secret !== process.env.OPENWA_WEBHOOK_SECRET) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const message: OpenWAMessage = await req.json()

  // Only handle text messages
  if (message.type !== 'chat') return Response.json({ ok: true })

  // 2. Call Groq for AI response
  const aiResponse = await getGroqResponse(message.body, message.from)

  // 3. If lead qualified → save to Supabase
  if (aiResponse.qualified) {
    await saveWhatsAppLead(message.from, aiResponse)
  }

  // 4. Return response text (OpenWA will send it)
  return Response.json({ reply: aiResponse.text })
}

async function getGroqResponse(message: string, from: string) {
  if (!process.env.GROQ_API_KEY) {
    return {
      text: 'Hola! En este momento no puedo responder automáticamente. Un asesor te contactará pronto.',
      qualified: false,
    }
  }

  // `from` is available for future per-user conversation history
  void from

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama3-8b-8192',
      messages: [
        {
          role: 'system',
          content: `Eres el asistente de ventas de nexdevp, una consultora de software e IA.
Tu objetivo es calificar leads. Responde de forma amigable y profesional.
Si el usuario muestra interés real en contratar servicios, incluye la palabra QUALIFIED en tu respuesta.
Servicios: Software a medida, Agentes IA para WhatsApp, Automatización de procesos.
Precio promedio: $2,200 - $3,200 por proyecto.`,
        },
        { role: 'user', content: message },
      ],
      max_tokens: 300,
    }),
  })

  const data = await response.json()
  const text =
    data.choices?.[0]?.message?.content ??
    'Un momento, te conectamos con un asesor.'
  const qualified = text.includes('QUALIFIED')

  return { text: text.replace('QUALIFIED', '').trim(), qualified }
}

async function saveWhatsAppLead(
  phone: string,
  aiResponse: { text: string; qualified: boolean }
) {
  const { createServiceClient } = await import('@/lib/supabase')
  const client = createServiceClient()
  await client.from('leads').insert({
    nombre: 'Lead WhatsApp',
    email: '',
    telefono: phone.replace('@c.us', ''),
    canal: 'whatsapp',
    estado: 'calificado',
    mensaje: aiResponse.text,
  })
}

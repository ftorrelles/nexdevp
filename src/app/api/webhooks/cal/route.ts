import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { createHmac } from 'crypto'

export async function POST(req: NextRequest) {
  // Verify Cal.com webhook signature
  const secret = process.env.CAL_WEBHOOK_SECRET
  if (secret) {
    const signature = req.headers.get('x-cal-signature-256')
    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 401 })
    }
    const body = await req.text()
    const expected = createHmac('sha256', secret).update(body).digest('hex')
    const received = signature.replace(/^sha256=/, '')
    if (received !== expected) {
      console.error('Cal webhook signature mismatch', { received, expected })
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }
    const payload = JSON.parse(body)
    return handleEvent(payload)
  }

  // No secret configured — accept without verification (dev/setup mode)
  const payload = await req.json()
  return handleEvent(payload)
}

async function handleEvent(payload: Record<string, unknown>) {
  // Only handle new bookings
  if (payload.triggerEvent !== 'BOOKING_CREATED') {
    return NextResponse.json({ ok: true, skipped: true })
  }

  const booking = payload.payload as Record<string, unknown>
  const attendees = booking.attendees as Array<{ name: string; email: string }> | undefined
  const attendee  = attendees?.[0]

  if (!attendee?.email) {
    return NextResponse.json({ error: 'No attendee data' }, { status: 400 })
  }

  const client = createServiceClient()

  // Avoid duplicate leads for the same email
  const { data: existing } = await client
    .from('leads')
    .select('id')
    .eq('email', attendee.email)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ ok: true, duplicate: true, lead_id: existing.id })
  }

  const eventTitle = typeof booking.title === 'string' ? booking.title : 'Llamada Cal.com'
  const notes      = typeof booking.description === 'string' ? booking.description : null

  const { data, error } = await client
    .from('leads')
    .insert({
      nombre:       attendee.name,
      email:        attendee.email,
      canal:        'cal',
      estado:       'nuevo',
      tipo_negocio: eventTitle,
      mensaje:      notes,
    })
    .select('id')
    .single()

  if (error) {
    console.error('Cal webhook — lead insert error:', error)
    return NextResponse.json({ error: 'Failed to create lead' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, lead_id: data.id })
}

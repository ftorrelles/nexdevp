import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { getActor } from '@/lib/auth-server'
import { notifyOwnersOfNewLead } from '@/lib/notify'
import { isMissingAttributionColumn, sanitizeAttribution } from '@/lib/attribution'
import { evaluatePublicLead, resolveCanal } from '@/lib/lead-validation'
import { createRateLimiter, firstForwardedIp } from '@/lib/rate-limit'

const PUBLIC_WINDOW_MS = 10 * 60 * 1000

// Best-effort only: on serverless this protects per warm instance, not globally.
const publicLimiter = createRateLimiter({ max: 5, windowMs: PUBLIC_WINDOW_MS })

// POST /api/leads
// Dual-purpose endpoint:
//   • Public website capture (no session) → validated, spam-guarded, anonymous insert.
//   • Staff creating a manual lead (authenticated) → stamps created_by, and for
//     a vendor also auto-assigns the lead to himself so he owns it.
export async function POST(req: NextRequest) {
  try {
    let body: unknown
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }
    if (typeof body !== 'object' || body === null) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }
    const fields = body as Record<string, unknown>

    const actor = await getActor() // null for public, anonymous submissions
    const client = createServiceClient()

    let insert: Record<string, unknown>
    let leadName: string
    let ip: string | null = null

    if (actor) {
      const { nombre, email, telefono, tipo_negocio, mensaje, canal } = fields

      if (!nombre || !email) {
        return NextResponse.json({ error: 'nombre and email are required' }, { status: 400 })
      }

      leadName = nombre as string
      insert = {
        nombre,
        email,
        telefono: telefono || null,
        tipo_negocio: tipo_negocio || null,
        mensaje: mensaje || null,
        canal: resolveCanal(true, canal),
        estado: 'nuevo',
        created_by: actor.id,
      }
      // A vendor's manually-created lead belongs to that vendor.
      if (actor.role === 'vendor') insert.assigned_to = actor.id
    } else {
      const outcome = evaluatePublicLead(fields)

      // Bots get the same answer as a real success, so they learn nothing.
      if (outcome.kind === 'silent') return NextResponse.json({ success: true })
      if (outcome.kind === 'invalid') {
        return NextResponse.json({ error: outcome.error }, { status: 400 })
      }

      const { lead } = outcome
      ip = firstForwardedIp(req.headers.get('x-forwarded-for'))
      if (ip && publicLimiter.isLimited(ip)) {
        return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
      }

      // Same email already submitted through the form in the last 10 minutes
      // (double click, retry, replay): report success without a second lead or alert.
      const since = new Date(Date.now() - PUBLIC_WINDOW_MS).toISOString()
      const { data: recent } = await client
        .from('leads')
        .select('id')
        .eq('email', lead.email)
        .eq('canal', 'form')
        .gte('created_at', since)
        .limit(1)
      if (recent && recent.length > 0) return NextResponse.json({ success: true })

      leadName = lead.nombre
      insert = {
        ...lead,
        canal: resolveCanal(false, fields.canal),
        estado: 'nuevo',
      }
      const attribution = sanitizeAttribution(fields.attribution)
      if (attribution) insert.attribution = attribution
    }

    let result = await client.from('leads').insert(insert).select('id').single()

    // A lead must never be lost because of tracking data: if the `attribution`
    // column is not in the database (or PostgREST's schema cache) yet, save the
    // lead without it.
    if (result.error && 'attribution' in insert && isMissingAttributionColumn(result.error)) {
      console.warn('leads.attribution column not available; saving lead without attribution')
      const withoutAttribution = { ...insert }
      delete withoutAttribution.attribution
      result = await client.from('leads').insert(withoutAttribution).select('id').single()
    }

    const { data, error } = result
    if (error) {
      console.error('Supabase insert error:', error)
      return NextResponse.json({ error: 'Failed to save lead' }, { status: 500 })
    }

    if (ip) publicLimiter.record(ip)

    let sourceLabel = 'Agregado desde el formulario de la página.'
    if (actor) {
      const { data: actorUser } = await client.auth.admin.getUserById(actor.id)
      const actorName =
        (actorUser?.user?.user_metadata?.full_name as string | undefined)?.trim() ||
        actorUser?.user?.email ||
        'un miembro del equipo'
      const roleLabel = actor.role === 'vendor' ? 'el vendedor' : 'el equipo'
      sourceLabel = `Agregado por ${roleLabel} ${actorName}.`
    }
    await notifyOwnersOfNewLead(client, leadName, sourceLabel, actor?.id)

    // The public form does not need the row id, and omitting it keeps a real
    // success indistinguishable from the silent bot success above.
    return actor
      ? NextResponse.json({ success: true, id: data.id })
      : NextResponse.json({ success: true })
  } catch (err) {
    console.error('Leads POST error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

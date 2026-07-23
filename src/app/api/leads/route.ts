import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { getActor } from '@/lib/auth-server'
import { notifyOwnersOfNewLead } from '@/lib/notify'

// POST /api/leads
// Dual-purpose endpoint:
//   • Public website capture (no session) → anonymous insert, as before.
//   • Staff creating a manual lead (authenticated) → stamps created_by, and for
//     a vendor also auto-assigns the lead to himself so he owns it.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { nombre, email, telefono, tipo_negocio, mensaje, canal } = body

    if (!nombre || !email) {
      return NextResponse.json({ error: 'nombre and email are required' }, { status: 400 })
    }

    const actor = await getActor() // null for public, anonymous submissions
    const client = createServiceClient()

    const insert: Record<string, unknown> = {
      nombre,
      email,
      telefono: telefono || null,
      tipo_negocio: tipo_negocio || null,
      mensaje: mensaje || null,
      canal: canal || 'form',
      estado: 'nuevo',
    }

    if (actor) {
      insert.created_by = actor.id
      // A vendor's manually-created lead belongs to that vendor.
      if (actor.role === 'vendor') insert.assigned_to = actor.id
    }

    const { data, error } = await client.from('leads').insert(insert).select('id').single()

    if (error) {
      console.error('Supabase insert error:', error)
      return NextResponse.json({ error: 'Failed to save lead' }, { status: 500 })
    }

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
    await notifyOwnersOfNewLead(client, nombre, sourceLabel, actor?.id)

    return NextResponse.json({ success: true, id: data.id })
  } catch (err) {
    console.error('Leads POST error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

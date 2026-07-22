import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { getActor } from '@/lib/auth-server'
import { canEditLead, canDeleteLead, canAssignLead, type LeadOwnership } from '@/lib/permissions'
import type { LeadEstado } from '@/lib/supabase'

const VALID_ESTADOS: LeadEstado[] = ['nuevo', 'contactado', 'calificado', 'cerrado', 'perdido']

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const actor = await getActor()
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await params
    const body = await req.json()
    const { estado, notas, assigned_to } = body

    if (estado && !VALID_ESTADOS.includes(estado)) {
      return NextResponse.json({ error: 'Invalid estado value' }, { status: 400 })
    }

    const client = createServiceClient()

    // Load ownership for authorization (cannot be derived from the request body).
    const { data: lead } = await client
      .from('leads')
      .select('assigned_to, created_by, estado')
      .eq('id', id)
      .maybeSingle()
    if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 })

    if (!canEditLead(actor.role, actor.id, lead as LeadOwnership)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const updates: Record<string, string | null> = {}
    if (estado) updates.estado = estado
    if (notas !== undefined) updates.notas = notas
    // Reassignment is owner-only — silently ignored for everyone else.
    if (assigned_to !== undefined) {
      if (!canAssignLead(actor.role)) {
        return NextResponse.json({ error: 'No autorizado para reasignar leads.' }, { status: 403 })
      }
      updates.assigned_to = assigned_to
    }

    const { error } = await client.from('leads').update(updates).eq('id', id)
    if (error) {
      console.error('Supabase update error:', error)
      return NextResponse.json({ error: 'Failed to update lead' }, { status: 500 })
    }

    // Log the first contact for the response-time metric.
    if (estado === 'contactado' && lead.estado !== 'contactado') {
      await client.from('lead_activities').insert({
        lead_id: id,
        user_id: actor.id,
        type: 'contacted',
        notes: 'Estado cambiado a contactado',
      })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Lead PATCH error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const actor = await getActor()
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!canDeleteLead(actor.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const client = createServiceClient()
  const { error } = await client.from('leads').delete().eq('id', id)

  if (error) {
    console.error('Lead DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete lead' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { getActor } from '@/lib/auth-server'
import { canViewLead, canCreateLeadActivity, type LeadOwnership } from '@/lib/permissions'
import type { LeadActivityType } from '@/lib/supabase'

const VALID_TYPES: LeadActivityType[] = [
  'note', 'contacted', 'call', 'whatsapp', 'email', 'status_change', 'quote_sent',
]

async function loadLeadOwnership(
  client: ReturnType<typeof createServiceClient>,
  id: string,
): Promise<LeadOwnership | null> {
  const { data } = await client
    .from('leads')
    .select('assigned_to, created_by')
    .eq('id', id)
    .maybeSingle()
  return (data as LeadOwnership) ?? null
}

// GET /api/leads/[id]/activities — timeline for a lead
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const actor = await getActor()
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const client = createServiceClient()

  const lead = await loadLeadOwnership(client, id)
  if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
  if (!canViewLead(actor.role, actor.id, lead)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data, error } = await client
    .from('lead_activities')
    .select('*')
    .eq('lead_id', id)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ activities: data ?? [] })
}

// POST /api/leads/[id]/activities — add a follow-up note / contact event
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const actor = await getActor()
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const type = body.type as LeadActivityType
  const notes = typeof body.notes === 'string' ? body.notes : null

  if (!VALID_TYPES.includes(type)) {
    return NextResponse.json({ error: 'Invalid activity type' }, { status: 400 })
  }

  const client = createServiceClient()
  const lead = await loadLeadOwnership(client, id)
  if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
  if (!canCreateLeadActivity(actor.role, actor.id, lead)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data, error } = await client
    .from('lead_activities')
    .insert({ lead_id: id, user_id: actor.id, type, notes })
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ activity: data }, { status: 201 })
}

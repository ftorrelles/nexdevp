import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { createAuthServerClient } from '@/lib/supabase-server'
import { DEFAULT_BUDGET_SETTINGS } from '@/lib/budget'

const RATE_FIELDS = [
  'commission_pool_rate',
  'commission_own_lead_rate',
  'company_margin_rate',
] as const

async function getRole() {
  const supabase = await createAuthServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  return { user, role: user?.app_metadata?.role ?? null }
}

export async function GET() {
  const { user, role } = await getRole()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!['owner', 'supervisor'].includes(role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const client = createServiceClient()
  const { data } = await client.from('budget_settings').select('*').eq('id', 1).maybeSingle()
  return NextResponse.json(data ?? DEFAULT_BUDGET_SETTINGS)
}

// Changing the default split is an owner decision. It only affects projects
// created from here on: every existing project carries its own frozen rates.
export async function PATCH(req: NextRequest) {
  const { user, role } = await getRole()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (role !== 'owner') {
    return NextResponse.json({ error: 'Solo el owner puede cambiar el reparto.' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const patch: Record<string, number> = {}

    for (const field of RATE_FIELDS) {
      if (body[field] === undefined) continue
      const value = Number(body[field])
      if (!Number.isFinite(value) || value < 0 || value > 1) {
        return NextResponse.json(
          { error: `${field} debe estar entre 0 y 1.` }, { status: 400 },
        )
      }
      patch[field] = value
    }

    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ error: 'Nada para actualizar.' }, { status: 400 })
    }

    const client = createServiceClient()
    const { data: current } = await client
      .from('budget_settings').select('*').eq('id', 1).maybeSingle()

    const merged = { ...(current ?? DEFAULT_BUDGET_SETTINGS), ...patch }

    // The highest commission plus the margin has to leave something for the
    // people who build it, otherwise the pool goes negative.
    if (merged.commission_own_lead_rate + merged.company_margin_rate >= 1) {
      return NextResponse.json(
        { error: 'La comisión más el margen no dejan nada para desarrollo.' },
        { status: 400 },
      )
    }

    const { data, error } = await client
      .from('budget_settings')
      .update({ ...patch, updated_at: new Date().toISOString(), updated_by: user.id })
      .eq('id', 1)
      .select()
      .single()

    if (error) {
      console.error('budget_settings PATCH error:', error)
      return NextResponse.json({ error: 'Error al guardar.' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (err) {
    console.error('budget_settings PATCH error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

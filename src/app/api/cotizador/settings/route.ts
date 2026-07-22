import { NextRequest, NextResponse } from 'next/server'
import { createAuthServerClient } from '@/lib/supabase-server'
import { createServiceClient } from '@/lib/supabase'
import { canModifyQuotePricing } from '@/lib/permissions'
import { bumpConfigVersion } from '@/lib/config-version'
import type { UserRole } from '@/lib/supabase'

export async function GET() {
  const auth = await createAuthServerClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const client = createServiceClient()
  const { data, error } = await client.from('pricing_settings').select('*').order('region')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ settings: data })
}

export async function PUT(req: NextRequest) {
  const auth = await createAuthServerClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = user.app_metadata?.role as UserRole | undefined
  if (!role || !canModifyQuotePricing(role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const { region, hourly_rate, overhead_pm, overhead_qa, overhead_cx, maint_rate, currency } = body

  if (!region) return NextResponse.json({ error: 'region required' }, { status: 400 })

  const client = createServiceClient()
  const { data, error } = await client
    .from('pricing_settings')
    .update({ hourly_rate, overhead_pm, overhead_qa, overhead_cx, maint_rate, currency })
    .eq('region', region)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Bump the pricing version so quotes created from now on freeze the new config,
  // while previously-saved quotes keep their original snapshot.
  await bumpConfigVersion(client, 'pricing')

  return NextResponse.json({ setting: data })
}

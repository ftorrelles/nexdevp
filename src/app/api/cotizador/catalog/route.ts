import { NextRequest, NextResponse } from 'next/server'
import { createAuthServerClient } from '@/lib/supabase-server'
import { createServiceClient } from '@/lib/supabase'
import { bumpConfigVersion } from '@/lib/config-version'

export async function GET() {
  const auth = await createAuthServerClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const client = createServiceClient()
  const { data, error } = await client
    .from('quote_catalog')
    .select('*')
    .eq('active', true)
    .order('sort_order').order('name')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ items: data })
}

export async function POST(req: NextRequest) {
  const auth = await createAuthServerClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = user.app_metadata?.role
  if (!['owner', 'supervisor'].includes(role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const { name, category, size, base_hours, complexity, description, sort_order } = body
  if (!name || !category || !size) {
    return NextResponse.json({ error: 'name, category, size required' }, { status: 400 })
  }

  const client = createServiceClient()
  const { data, error } = await client
    .from('quote_catalog')
    .insert({
      name,
      category,
      size,
      base_hours:  base_hours ?? 0,
      complexity:  complexity || null,
      description: description ?? null,
      sort_order:  sort_order ?? 999,
      active:      true,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await bumpConfigVersion(client, 'catalog')
  return NextResponse.json({ item: data }, { status: 201 })
}

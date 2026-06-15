import { NextRequest, NextResponse } from 'next/server'
import { createAuthServerClient } from '@/lib/supabase-server'
import { createServiceClient } from '@/lib/supabase'

export async function GET() {
  const auth = await createAuthServerClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const client = createServiceClient()
  const { data, error } = await client
    .from('quote_catalog')
    .select('*')
    .order('tipo').order('product').order('size').order('name')

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
  const { name, tipo, product, size, default_hours, description } = body
  if (!name || !tipo || !product || !size) {
    return NextResponse.json({ error: 'name, tipo, product, size required' }, { status: 400 })
  }

  const client = createServiceClient()
  const { data, error } = await client
    .from('quote_catalog')
    .insert({ name, tipo, product, size, default_hours: default_hours ?? 0, description: description ?? null })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ item: data }, { status: 201 })
}

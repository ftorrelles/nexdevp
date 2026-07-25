import { NextRequest, NextResponse } from 'next/server'
import { createAuthServerClient } from '@/lib/supabase-server'
import { createServiceClient } from '@/lib/supabase'
import { bumpConfigVersion } from '@/lib/config-version'

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await createAuthServerClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = user.app_metadata?.role
  if (!['owner', 'supervisor'].includes(role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const body = await req.json()
  const { name, category, size, base_hours, complexity, description, sort_order } = body

  const client = createServiceClient()
  const { data, error } = await client
    .from('quote_catalog')
    .update({
      name,
      category,
      size,
      base_hours,
      complexity:  complexity || null,
      description: description ?? null,
      ...(sort_order !== undefined ? { sort_order } : {}),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await bumpConfigVersion(client, 'catalog')
  return NextResponse.json({ item: data })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await createAuthServerClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = user.app_metadata?.role
  if (!['owner', 'supervisor'].includes(role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const client = createServiceClient()
  // Soft delete: already-saved quotes still reference this row through
  // quote_items.catalog_id, so the row has to survive. Retiring it just hides
  // it from the catalog and from every product template.
  const { error } = await client
    .from('quote_catalog')
    .update({ active: false })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await bumpConfigVersion(client, 'catalog')
  return new NextResponse(null, { status: 204 })
}

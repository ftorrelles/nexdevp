import { NextRequest, NextResponse } from 'next/server'
import { createAuthServerClient } from '@/lib/supabase-server'
import { createServiceClient } from '@/lib/supabase'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const supabase = await createAuthServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  const role = user?.user_metadata?.role ?? 'vendor'

  if (!user || (role !== 'owner' && role !== 'supervisor')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    const body = await req.json()

    const updates: Record<string, unknown> = {}
    const fields = [
      'title_es',
      'title_en',
      'department_es',
      'department_en',
      'location_es',
      'location_en',
      'type_es',
      'type_en',
      'description_es',
      'description_en',
      'requirements_es',
      'requirements_en',
      'responsibilities_es',
      'responsibilities_en',
      'active',
    ]

    for (const f of fields) {
      if (body[f] !== undefined) {
        updates[f] = body[f]
      }
    }

    const client = createServiceClient()
    const { error } = await client.from('careers').update(updates).eq('id', id)

    if (error) {
      console.error('Failed to update career:', error)
      return NextResponse.json({ error: 'Failed to update position' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Career PATCH error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const supabase = await createAuthServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  const role = user?.user_metadata?.role ?? 'vendor'

  if (!user || (role !== 'owner' && role !== 'supervisor')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    const client = createServiceClient()
    const { error } = await client.from('careers').delete().eq('id', id)

    if (error) {
      console.error('Failed to delete career:', error)
      return NextResponse.json({ error: 'Failed to delete position' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Career DELETE error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

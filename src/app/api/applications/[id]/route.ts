import { NextRequest, NextResponse } from 'next/server'
import { createAuthServerClient } from '@/lib/supabase-server'
import { createServiceClient } from '@/lib/supabase'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createAuthServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  const role = user?.user_metadata?.role ?? 'vendor'

  if (!user || (role !== 'owner' && role !== 'supervisor')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    const body = await req.json()
    const { estado } = body

    const validEstados = ['nuevo', 'revisado', 'aceptado', 'rechazado']
    if (!estado || !validEstados.includes(estado)) {
      return NextResponse.json({ error: 'Invalid or missing estado' }, { status: 400 })
    }

    const client = createServiceClient()
    const { error } = await client.from('career_applications').update({ estado }).eq('id', id)

    if (error) {
      console.error('Failed to update application:', error)
      return NextResponse.json({ error: 'Failed to update application' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Application PATCH error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createAuthServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  const role = user?.user_metadata?.role ?? 'vendor'

  if (!user || (role !== 'owner' && role !== 'supervisor')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    const client = createServiceClient()

    const { data: application } = await client
      .from('career_applications')
      .select('cv_url')
      .eq('id', id)
      .single()

    if (application && application.cv_url) {
      const parts = application.cv_url.split('/')
      const fileName = parts[parts.length - 1]
      if (fileName) {
        await client.storage.from('cvs').remove([fileName])
      }
    }

    const { error } = await client.from('career_applications').delete().eq('id', id)

    if (error) {
      console.error('Failed to delete application:', error)
      return NextResponse.json({ error: 'Failed to delete application' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Application DELETE error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

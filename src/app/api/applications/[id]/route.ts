import { NextRequest, NextResponse } from 'next/server'
import { createAuthServerClient } from '@/lib/supabase-server'
import { createServiceClient } from '@/lib/supabase'
import { sendApplicantDecisionEmail } from '@/lib/email'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const supabase = await createAuthServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  const role = user?.app_metadata?.role ?? 'vendor'

  if (!user || (role !== 'owner' && role !== 'supervisor')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    const body = await req.json()
    const { estado } = body

    // 'aceptado' is intentionally excluded: accepting promotes the candidate to
    // vendor, which only the dedicated accept endpoint does. This prevents a
    // status that says "accepted" without the account ever being promoted.
    const validEstados = ['nuevo', 'revisado', 'rechazado']
    if (!estado || !validEstados.includes(estado)) {
      return NextResponse.json({ error: 'Estado inválido' }, { status: 400 })
    }

    const client = createServiceClient()
    // Record who is handling this application (assignment on review, etc.).
    const { data: updated, error } = await client
      .from('career_applications')
      .update({ estado, handled_by: user.id })
      .eq('id', id)
      .select('nombre, email')
      .single()

    if (error) {
      console.error('Failed to update application:', error)
      return NextResponse.json({ error: 'Failed to update application' }, { status: 500 })
    }

    // Notify the candidate when they're not selected (best-effort, never blocks).
    if (estado === 'rechazado' && updated?.email) {
      await sendApplicantDecisionEmail(updated.email, updated.nombre ?? '', 'rejected')
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
): Promise<NextResponse> {
  const supabase = await createAuthServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  const role = user?.app_metadata?.role ?? 'vendor'

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

    // cv_url stores the storage object path; remove it directly.
    if (application?.cv_url) {
      await client.storage.from('cvs').remove([application.cv_url])
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

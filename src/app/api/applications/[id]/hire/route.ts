import { NextRequest, NextResponse } from 'next/server'
import { createAuthServerClient } from '@/lib/supabase-server'
import { createServiceClient } from '@/lib/supabase'
import { sendApplicantDecisionEmail } from '@/lib/email'

// Accepting a candidate promotes their account to 'vendor' (CRM access) and
// marks the application accepted. Owners and supervisors can do this.
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const supabase = await createAuthServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  const role = user?.app_metadata?.role
  if (!user || (role !== 'owner' && role !== 'supervisor')) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 403 })
  }

  try {
    const { id } = await params
    const client = createServiceClient()

    const { data: application, error: fetchError } = await client
      .from('career_applications')
      .select('user_id, estado, nombre, email')
      .eq('id', id)
      .single()

    if (fetchError || !application) {
      return NextResponse.json({ error: 'Postulación no encontrada' }, { status: 404 })
    }

    if (!application.user_id) {
      return NextResponse.json(
        { error: 'Esta postulación no tiene una cuenta vinculada y no puede contratarse automáticamente.' },
        { status: 400 }
      )
    }

    const { error: roleError } = await client.auth.admin.updateUserById(application.user_id, {
      app_metadata: { role: 'vendor' },
    })

    if (roleError) {
      console.error('Failed to promote applicant to vendor:', roleError)
      return NextResponse.json({ error: 'No se pudo promover al usuario' }, { status: 500 })
    }

    const { error: estadoError } = await client
      .from('career_applications')
      .update({ estado: 'aceptado', handled_by: user.id })
      .eq('id', id)

    if (estadoError) {
      console.error('Failed to mark application accepted:', estadoError)
      // Role already changed; report partial success so the UI can refresh.
      return NextResponse.json({ success: true, estado: application.estado })
    }

    // Notify the candidate they were selected (best-effort, never blocks).
    if (application.email) {
      await sendApplicantDecisionEmail(application.email, application.nombre ?? '', 'accepted')
    }

    return NextResponse.json({ success: true, estado: 'aceptado', role: 'vendor' })
  } catch (err) {
    console.error('Application hire error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

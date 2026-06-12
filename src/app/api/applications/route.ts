import { NextRequest, NextResponse } from 'next/server'
import { createAuthServerClient } from '@/lib/supabase-server'
import { createServiceClient, withSignedCvUrls, type CareerApplication } from '@/lib/supabase'

const ALLOWED_CV_EXTENSIONS = ['pdf', 'doc', 'docx']
const ALLOWED_CV_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]
const MAX_CV_SIZE_BYTES = 5 * 1024 * 1024 // 5 MB

export async function GET(): Promise<NextResponse> {
  const supabase = await createAuthServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  const role = user?.app_metadata?.role ?? 'vendor'

  if (!user || (role !== 'owner' && role !== 'supervisor')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const client = createServiceClient()
  const { data, error } = await client
    .from('career_applications')
    .select('*, careers(title_es, title_en)')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Failed to fetch applications:', error)
    return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 })
  }

  const applications = await withSignedCvUrls(client, (data as CareerApplication[]) ?? [])
  return NextResponse.json({ applications })
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // Applying requires an account. The applicant's email comes from their
    // session (authoritative), not the form, so it can't be spoofed.
    const supabase = await createAuthServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Debés iniciar sesión para postularte.' }, { status: 401 })
    }

    const formData = await req.formData()
    const career_id = formData.get('career_id') as string
    const nombre = formData.get('nombre') as string
    const telefono = formData.get('telefono') as string
    const mensaje = formData.get('mensaje') as string
    const cvFile = formData.get('cv') as File | null
    const email = user.email ?? ''

    if (!career_id || !nombre || !cvFile) {
      return NextResponse.json(
        { error: 'Missing required fields (career_id, nombre, cv)' },
        { status: 400 }
      )
    }

    const fileExt = (cvFile.name.split('.').pop() ?? '').toLowerCase().replace(/[^a-z0-9]/g, '')

    if (
      !ALLOWED_CV_EXTENSIONS.includes(fileExt) &&
      !ALLOWED_CV_MIME_TYPES.includes(cvFile.type)
    ) {
      return NextResponse.json(
        { error: 'Invalid file type. Only PDF or Word documents are allowed.' },
        { status: 400 }
      )
    }

    if (cvFile.size > MAX_CV_SIZE_BYTES) {
      return NextResponse.json({ error: 'File too large. Maximum size is 5MB.' }, { status: 400 })
    }

    const client = createServiceClient()

    // One application per position per user.
    const { data: existing } = await client
      .from('career_applications')
      .select('id')
      .eq('career_id', career_id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (existing) {
      return NextResponse.json(
        { error: 'Ya te postulaste a esta posición.' },
        { status: 409 }
      )
    }

    const arrayBuffer = await cvFile.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const safeExt = ALLOWED_CV_EXTENSIONS.includes(fileExt) ? fileExt : 'pdf'
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${safeExt}`
    const filePath = fileName

    const { error: uploadError } = await client.storage
      .from('cvs')
      .upload(filePath, buffer, {
        contentType: cvFile.type,
      })

    if (uploadError) {
      console.error('Supabase storage upload error:', uploadError)
      return NextResponse.json({ error: 'Failed to upload CV file' }, { status: 500 })
    }

    const { data: appData, error: insertError } = await client
      .from('career_applications')
      .insert({
        career_id,
        user_id: user.id,
        nombre,
        email,
        telefono: telefono || null,
        mensaje: mensaje || null,
        cv_url: filePath,
        estado: 'nuevo',
      })
      .select()
      .single()

    if (insertError) {
      console.error('Database insert error for application:', insertError)
      await client.storage.from('cvs').remove([filePath])
      return NextResponse.json({ error: 'Failed to save application' }, { status: 500 })
    }

    return NextResponse.json({ success: true, application: appData })
  } catch (err) {
    console.error('Application POST error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

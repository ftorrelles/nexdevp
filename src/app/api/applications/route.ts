import { NextRequest, NextResponse } from 'next/server'
import { createAuthServerClient } from '@/lib/supabase-server'
import { createServiceClient } from '@/lib/supabase'

export async function GET(): Promise<NextResponse> {
  const supabase = await createAuthServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  const role = user?.user_metadata?.role ?? 'vendor'

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

  return NextResponse.json({ applications: data })
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const formData = await req.formData()
    const career_id = formData.get('career_id') as string
    const nombre = formData.get('nombre') as string
    const email = formData.get('email') as string
    const telefono = formData.get('telefono') as string
    const mensaje = formData.get('mensaje') as string
    const cvFile = formData.get('cv') as File | null

    if (!career_id || !nombre || !email || !cvFile) {
      return NextResponse.json(
        { error: 'Missing required fields (career_id, nombre, email, cv)' },
        { status: 400 }
      )
    }

    const arrayBuffer = await cvFile.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const fileExt = cvFile.name.split('.').pop()
    const safeExt = fileExt ? fileExt.replace(/[^a-zA-Z0-9]/g, '') : 'pdf'
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${safeExt}`
    const filePath = `${fileName}`

    const client = createServiceClient()

    const { error: uploadError } = await client.storage
      .from('cvs')
      .upload(filePath, buffer, {
        contentType: cvFile.type,
      })

    if (uploadError) {
      console.error('Supabase storage upload error:', uploadError)
      return NextResponse.json({ error: 'Failed to upload CV file' }, { status: 500 })
    }

    const { data: { publicUrl } } = client.storage.from('cvs').getPublicUrl(filePath)

    const { data: appData, error: insertError } = await client
      .from('career_applications')
      .insert({
        career_id,
        nombre,
        email,
        telefono: telefono || null,
        mensaje: mensaje || null,
        cv_url: publicUrl,
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

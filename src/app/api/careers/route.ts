import { NextRequest, NextResponse } from 'next/server'
import { createAuthServerClient } from '@/lib/supabase-server'
import { createServiceClient } from '@/lib/supabase'

export async function GET(): Promise<NextResponse> {
  const supabase = await createAuthServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  const role = user?.app_metadata?.role ?? 'vendor'
  const isManager = user && (role === 'owner' || role === 'supervisor')

  const client = createServiceClient()
  const query = client.from('careers').select('*').order('created_at', { ascending: false })

  if (!isManager) {
    query.eq('active', true)
  }

  const { data, error } = await query
  if (error) {
    console.error('Failed to fetch careers:', error)
    return NextResponse.json({ error: 'Failed to fetch positions' }, { status: 500 })
  }

  return NextResponse.json({ careers: data })
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const supabase = await createAuthServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  const role = user?.app_metadata?.role ?? 'vendor'

  if (!user || (role !== 'owner' && role !== 'supervisor')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const {
      title_es,
      title_en,
      department_es,
      department_en,
      location_es,
      location_en,
      type_es,
      type_en,
      description_es,
      description_en,
      requirements_es,
      requirements_en,
      responsibilities_es,
      responsibilities_en,
      active,
    } = body

    if (
      !title_es ||
      !title_en ||
      !department_es ||
      !department_en ||
      !location_es ||
      !location_en ||
      !type_es ||
      !type_en ||
      !description_es ||
      !description_en
    ) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const client = createServiceClient()
    const { data, error } = await client
      .from('careers')
      .insert({
        title_es,
        title_en,
        department_es,
        department_en,
        location_es,
        location_en,
        type_es,
        type_en,
        description_es,
        description_en,
        requirements_es: requirements_es || null,
        requirements_en: requirements_en || null,
        responsibilities_es: responsibilities_es || null,
        responsibilities_en: responsibilities_en || null,
        active: active !== undefined ? active : true,
      })
      .select()
      .single()

    if (error) {
      console.error('Failed to create career:', error)
      return NextResponse.json({ error: 'Failed to create career' }, { status: 500 })
    }

    return NextResponse.json({ success: true, career: data })
  } catch (err) {
    console.error('Career POST error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

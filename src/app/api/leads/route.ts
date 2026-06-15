import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { nombre, email, telefono, tipo_negocio, mensaje, canal } = body

    if (!nombre || !email) {
      return NextResponse.json({ error: 'nombre and email are required' }, { status: 400 })
    }

    const client = createServiceClient()
    const { data, error } = await client
      .from('leads')
      .insert({
        nombre,
        email,
        telefono: telefono || null,
        tipo_negocio: tipo_negocio || null,
        mensaje: mensaje || null,
        canal: canal || 'form',
        estado: 'nuevo',
      })
      .select('id')
      .single()

    if (error) {
      console.error('Supabase insert error:', error)
      return NextResponse.json({ error: 'Failed to save lead' }, { status: 500 })
    }

    return NextResponse.json({ success: true, id: data.id })
  } catch (err) {
    console.error('Leads POST error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

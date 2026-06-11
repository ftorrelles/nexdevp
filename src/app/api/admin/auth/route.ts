import { NextRequest, NextResponse } from 'next/server'
import { createAuthServerClient } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    const supabase = await createAuthServerClient()
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error || !data.user) {
      return NextResponse.json({ error: 'Credenciales incorrectas' }, { status: 401 })
    }

    const role = data.user.user_metadata?.role ?? 'vendor'
    return NextResponse.json({ success: true, role })
  } catch (err) {
    console.error('Admin auth error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE() {
  const supabase = await createAuthServerClient()
  await supabase.auth.signOut()
  return NextResponse.json({ success: true })
}

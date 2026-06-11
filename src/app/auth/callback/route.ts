import { NextRequest, NextResponse } from 'next/server'
import { createAuthServerClient } from '@/lib/supabase-server'

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url)
  const next = searchParams.get('next') ?? '/admin'
  const supabase = await createAuthServerClient()

  // PKCE flow (reset password)
  const code = searchParams.get('code')
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return NextResponse.redirect(`${origin}${next}`)
  }

  // Token hash flow (invite emails)
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type') as 'invite' | 'recovery' | 'email' | null
  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
    if (!error) return NextResponse.redirect(`${origin}${next}`)
  }

  return NextResponse.redirect(`${origin}/admin/login?error=link_invalido`)
}

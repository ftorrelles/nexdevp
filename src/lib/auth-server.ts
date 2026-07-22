// Server-only auth helpers. Centralizes the "read the authenticated user and its
// role from the Supabase session" pattern repeated across every route handler.
//
// IMPORTANT: the role is read from the *verified* session (auth.getUser()), not
// from any client-supplied value, so it cannot be spoofed from the browser.

import { createAuthServerClient } from './supabase-server'
import { isStaff } from './permissions'
import type { UserRole } from './supabase'

export interface Actor {
  id:   string
  role: UserRole
}

/** Returns the authenticated staff actor, or null if not logged in / not staff. */
export async function getActor(): Promise<Actor | null> {
  const supabase = await createAuthServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const role = user.app_metadata?.role as UserRole | undefined
  if (!isStaff(role)) return null
  return { id: user.id, role }
}

import type { createServiceClient } from '@/lib/supabase'
import { sendNewLeadEmail } from '@/lib/email'

type ServiceClient = ReturnType<typeof createServiceClient>

// Emails every owner/supervisor about a newly created lead, regardless of the
// channel it came from (public form, vendor, Cal booking, WhatsApp).
// Best-effort: never throws, so lead creation is never blocked by email failures.
export async function notifyOwnersOfNewLead(
  client: ServiceClient,
  leadName: string,
  sourceLabel: string,
  excludeUserId?: string,
): Promise<void> {
  try {
    const { data: { users } } = await client.auth.admin.listUsers()
    const adminEmails = (users ?? [])
      .filter((u) => ['owner', 'supervisor'].includes(u.app_metadata?.role ?? ''))
      .filter((u) => !excludeUserId || u.id !== excludeUserId)
      .map((u) => u.email)
      .filter(Boolean) as string[]

    if (adminEmails.length > 0) {
      await sendNewLeadEmail(adminEmails, leadName, sourceLabel)
    }
  } catch (err) {
    console.error('notifyOwnersOfNewLead error:', err)
  }
}

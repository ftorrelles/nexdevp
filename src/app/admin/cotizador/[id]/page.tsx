import { redirect, notFound } from 'next/navigation'
import { createAuthServerClient } from '@/lib/supabase-server'
import { createServiceClient } from '@/lib/supabase'
import { loadBudgetSettings } from '@/lib/budget'
import type { UserRole } from '@/lib/supabase'
import { AdminNav } from '@/app/admin/AdminNav'
import { QuoteEditor } from './QuoteEditor'

type Props = { params: Promise<{ id: string }> }

export default async function QuoteDetailPage({ params }: Props): Promise<React.JSX.Element> {
  const supabase = await createAuthServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/admin/login')

  const role = (user.app_metadata?.role ?? 'vendor') as UserRole
  if (!['owner', 'supervisor', 'vendor'].includes(role)) redirect('/admin')

  const { id } = await params
  const client = createServiceClient()

  const [quoteRes, itemsRes, settingsRes, budget] = await Promise.all([
    client.from('quotes').select('*').eq('id', id).single(),
    client.from('quote_items').select('*').eq('quote_id', id).order('sort_order'),
    client.from('pricing_settings').select('*').order('region'),
    loadBudgetSettings(client),
  ])

  if (quoteRes.error || !quoteRes.data) notFound()

  return (
    <div className="min-h-screen bg-nex-black text-nex-white">
      <AdminNav role={role} currentPath="/admin/cotizador" email={user.email ?? ''} name={user.user_metadata?.full_name as string | undefined} />
      <main className="px-4 sm:px-6 py-10 max-w-4xl mx-auto">
        <QuoteEditor
          quote={quoteRes.data}
          items={itemsRes.data ?? []}
          settings={settingsRes.data ?? []}
          budget={budget}
        />
      </main>
    </div>
  )
}

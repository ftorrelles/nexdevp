import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createServiceClient, Lead } from '@/lib/supabase'
import { AdminCRM } from './AdminCRM'

export default async function AdminPage() {
  const cookieStore = await cookies()
  const authCookie = cookieStore.get('admin_auth')

  if (!authCookie || authCookie.value !== process.env.ADMIN_PASSWORD) {
    redirect('/admin/login')
  }

  const client = createServiceClient()
  const { data: leads, error } = await client
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Failed to fetch leads:', error)
  }

  return <AdminCRM leads={(leads as Lead[]) ?? []} />
}

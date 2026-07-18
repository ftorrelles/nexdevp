import { redirect } from 'next/navigation'
import { setRequestLocale } from 'next-intl/server'
import { createAuthServerClient } from '@/lib/supabase-server'
import { ProyectoUserMenu } from './ProyectoLogout'
import { BrandLogo } from '@/components/theme/BrandLogo'

export default async function ProyectoLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  const auth = await createAuthServerClient()
  const { data: { user } } = await auth.auth.getUser()

  if (!user) redirect('/admin/login')

  const role = user.app_metadata?.role
  if (role !== 'client') redirect('/admin')

  return (
    <div className="min-h-screen bg-nex-black text-nex-white">
      <header className="border-b border-nex-ink/10 px-4 sm:px-6 py-4 flex items-center justify-between">
        <BrandLogo />
        <ProyectoUserMenu
          email={user.email ?? ''}
          name={user.user_metadata?.full_name as string | undefined}
          locale={locale === 'en' ? 'en' : 'es'}
        />
      </header>
      {children}
    </div>
  )
}

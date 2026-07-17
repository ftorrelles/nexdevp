import { redirect } from 'next/navigation'
import { setRequestLocale } from 'next-intl/server'
import { createAuthServerClient } from '@/lib/supabase-server'

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
      <header className="border-b border-white/10 px-4 sm:px-6 py-4 flex items-center justify-between">
        <img src="/brand/logo-dark.svg" alt="nexdevp" className="h-9 w-auto" />
        <form action="/api/admin/auth" method="POST">
          <input type="hidden" name="_method" value="DELETE" />
          <button
            type="submit"
            className="font-jost text-sm text-nex-grey hover:text-nex-white transition-colors"
          >
            {locale === 'es' ? 'Cerrar sesión' : 'Log out'}
          </button>
        </form>
      </header>
      {children}
    </div>
  )
}

import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createAuthServerClient } from '@/lib/supabase-server'
import { createServiceClient, type UserRole } from '@/lib/supabase'
import { AdminNav } from '@/app/admin/AdminNav'

interface BriefTemplate {
  id: string
  name: string
  description: string | null
  created_at: string
  brief_template_questions: { id: string }[]
}

export default async function BriefTemplatesPage(): Promise<React.JSX.Element> {
  const supabase = await createAuthServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const role = (user.app_metadata?.role ?? '') as UserRole
  if (!['owner', 'supervisor'].includes(role)) redirect('/admin')

  const client = createServiceClient()
  const { data: templates, error } = await client
    .from('brief_templates')
    .select('id, name, description, created_at, brief_template_questions(id)')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('BriefTemplates list error:', error)
  }

  const rows = (templates as unknown as BriefTemplate[]) ?? []

  return (
    <div className="min-h-screen bg-nex-black text-nex-white">
      <AdminNav role={role} currentPath="/admin/brief-templates" email={user.email ?? ''} />
      <main className="px-4 sm:px-6 py-10 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="font-dm-mono text-xs text-nex-green uppercase tracking-[0.2em] mb-2">CRM</p>
            <h1 className="font-jost font-bold text-3xl text-nex-white">Brief Templates</h1>
          </div>
          <Link
            href="/admin/brief-templates/new"
            className="font-jost font-bold text-sm bg-nex-green text-nex-black px-4 py-2 rounded-lg hover:bg-nex-green/90 transition-colors"
          >
            + New template
          </Link>
        </div>

        {rows.length === 0 ? (
          <div className="bg-nex-dark border border-nex-ink/10 rounded-xl p-10 text-center">
            <p className="font-jost text-sm text-nex-grey">No templates yet. Create your first one.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {rows.map((t) => (
              <Link
                key={t.id}
                href={`/admin/brief-templates/${t.id}`}
                className="block bg-nex-dark border border-nex-ink/10 rounded-xl p-5 hover:border-nex-ink/20 hover:bg-white/[0.02] transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h2 className="font-jost font-semibold text-lg text-nex-white truncate">{t.name}</h2>
                    {t.description && (
                      <p className="font-jost text-sm text-nex-grey mt-1 line-clamp-2">{t.description}</p>
                    )}
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="font-dm-mono text-[10px] uppercase tracking-wider text-nex-green border border-nex-green/30 rounded-full px-2.5 py-0.5 bg-nex-green/5">
                      {t.brief_template_questions?.length ?? 0} question{(t.brief_template_questions?.length ?? 0) !== 1 ? 's' : ''}
                    </span>
                    <p className="font-dm-mono text-[10px] text-nex-grey mt-2">
                      {new Date(t.created_at).toLocaleDateString('es-ES', {
                        day: '2-digit', month: 'short', year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

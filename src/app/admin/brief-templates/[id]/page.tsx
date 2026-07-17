import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createAuthServerClient } from '@/lib/supabase-server'
import { createServiceClient, type UserRole } from '@/lib/supabase'
import { AdminNav } from '@/app/admin/AdminNav'
import { TemplateEditor } from './TemplateEditor'

type Props = { params: Promise<{ id: string }> }

export default async function TemplateDetailPage({ params }: Props): Promise<React.JSX.Element> {
  const { id } = await params

  const supabase = await createAuthServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const role = (user.app_metadata?.role ?? '') as UserRole
  if (!['owner', 'supervisor'].includes(role)) redirect('/admin')

  const client = createServiceClient()
  const { data: template, error } = await client
    .from('brief_templates')
    .select('*, brief_template_questions(id, label, description, field_type, sort_order, required, created_at)')
    .eq('id', id)
    .order('sort_order', { referencedTable: 'brief_template_questions', ascending: true })
    .single()

  if (error || !template) notFound()

  return (
    <div className="min-h-screen bg-nex-black text-nex-white">
      <AdminNav role={role} currentPath="/admin/brief-templates" />
      <main className="px-4 sm:px-6 py-10 max-w-3xl mx-auto">
        <Link
          href="/admin/brief-templates"
          className="inline-flex items-center gap-2 font-dm-mono text-[10px] tracking-[0.2em] uppercase text-nex-grey hover:text-nex-white transition-colors mb-8"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M8 2L4 6l4 4" />
          </svg>
          Back to templates
        </Link>

        <div className="mb-8">
          <p className="font-dm-mono text-xs text-nex-green uppercase tracking-[0.2em] mb-1">Brief Templates</p>
          <h1 className="font-jost font-bold text-2xl text-nex-white">{template.name}</h1>
        </div>

        <TemplateEditor template={template as Parameters<typeof TemplateEditor>[0]['template']} />
      </main>
    </div>
  )
}

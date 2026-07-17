'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function NewTemplatePage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/brief-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), description: description.trim() || undefined }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Failed to create template')
        return
      }
      const created = await res.json()
      router.push(`/admin/brief-templates/${created.id}`)
    } catch {
      setError('Network error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="px-4 sm:px-6 py-10 max-w-xl mx-auto">
      <Link
        href="/admin/brief-templates"
        className="inline-flex items-center gap-2 font-dm-mono text-[10px] tracking-[0.2em] uppercase text-nex-grey hover:text-nex-white transition-colors mb-8"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M8 2L4 6l4 4" />
        </svg>
        Back to templates
      </Link>

      <h1 className="font-jost font-bold text-2xl text-nex-white mb-6">New template</h1>

      <form onSubmit={handleSubmit} className="bg-nex-dark border border-white/10 rounded-xl p-6 space-y-5">
        <div>
          <label className="block font-dm-mono text-[10px] uppercase tracking-wider text-nex-grey mb-2">
            Name <span className="text-red-400">*</span>
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Web corporativa"
            required
            className="w-full bg-nex-black border border-white/10 rounded-lg px-3 py-2 text-sm text-nex-white focus:outline-none focus:border-nex-green/50 transition-colors"
          />
        </div>

        <div>
          <label className="block font-dm-mono text-[10px] uppercase tracking-wider text-nex-grey mb-2">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="When to use this template..."
            rows={3}
            className="w-full bg-nex-black border border-white/10 rounded-lg px-3 py-2 text-sm text-nex-white focus:outline-none focus:border-nex-green/50 transition-colors resize-none"
          />
        </div>

        {error && (
          <p className="font-jost text-sm text-red-400">{error}</p>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving || !name.trim()}
            className="font-jost font-bold text-sm bg-nex-green text-nex-black px-5 py-2 rounded-lg disabled:opacity-40 hover:bg-nex-green/90 transition-colors"
          >
            {saving ? 'Creating…' : 'Create template'}
          </button>
          <Link
            href="/admin/brief-templates"
            className="font-jost text-sm text-nex-grey hover:text-nex-white transition-colors px-3 py-2"
          >
            Cancel
          </Link>
        </div>
      </form>
    </main>
  )
}

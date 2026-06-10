'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLoginPage() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })

      if (!res.ok) {
        setError('Contraseña incorrecta')
        return
      }

      router.push('/admin')
    } catch {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-nex-black flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-nex-dark border border-white/10 rounded-2xl p-8">
        <h1 className="font-jost font-bold text-2xl text-nex-white mb-2">
          nexdevp CRM
        </h1>
        <p className="font-jost text-nex-grey text-sm mb-8">
          Ingresá tu contraseña para continuar.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="password"
              className="block font-dm-mono text-[10px] tracking-[0.2em] uppercase text-nex-grey mb-2"
            >
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-nex-black border border-white/10 rounded-lg px-4 py-3 text-nex-white font-jost text-sm w-full focus:outline-none focus:border-nex-green/50 transition-colors"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="font-jost text-sm text-red-400">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="bg-nex-green text-nex-black font-jost font-bold py-3 px-6 rounded-lg w-full hover:bg-nex-green/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? 'Verificando...' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  )
}

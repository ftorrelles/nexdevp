import type { Metadata } from 'next'
import { DocumentShell } from '@/components/layout/DocumentShell'

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default function AuthLayout({ children }: { children: React.ReactNode }): React.JSX.Element {
  return <DocumentShell lang="es">{children}</DocumentShell>
}

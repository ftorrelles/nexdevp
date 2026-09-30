import type { Metadata } from 'next'
import { CustomCursor } from '@/components/ui/CustomCursor'
import { DocumentShell } from '@/components/layout/DocumentShell'

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default function AdminLayout({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <DocumentShell lang="es">
      <CustomCursor />
      {children}
    </DocumentShell>
  )
}

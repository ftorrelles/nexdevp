import { CustomCursor } from '@/components/ui/CustomCursor'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <CustomCursor />
      {children}
    </>
  )
}

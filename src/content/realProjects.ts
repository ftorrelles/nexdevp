export const REAL_PROJECT_CATEGORIES = ['projects', 'apps', 'websites'] as const
export type RealProjectCategory = (typeof REAL_PROJECT_CATEGORIES)[number]
export type RealProjectId = 'sce' | 'trayecto' | 'vivir' | 'cil' | 'speakpath' | 'collab' | 'amarhte' | 'perezRojas' | 'biupoll'

// Category-tinted glow behind the showcase stage. Literal Tailwind classes so
// the scanner picks them up; intensity varies per category.
export const CATEGORY_GLOW: Record<RealProjectCategory, string> = {
  projects: 'bg-nex-green/15',
  apps: 'bg-nex-green/10',
  websites: 'bg-nex-green/20',
}

interface ProjectImage {
  src: string
  width: number
  height: number
  kind: 'screenshot' | 'redacted' | 'demo' | 'cover'
}

interface ProjectBase {
  id: RealProjectId
  category: RealProjectCategory
  relationship: 'client' | 'product'
  image?: ProjectImage
}

export type RealProject = ProjectBase & (
  | { access: 'private'; url?: never; linkKind?: never }
  | { access: 'public'; url: string; linkKind: 'website' | 'video' }
)

export const REAL_PROJECTS: readonly RealProject[] = [
  { id: 'sce', category: 'projects', relationship: 'client', access: 'private', image: { src: '/portfolio/sce-dashboard.png', width: 1916, height: 1030, kind: 'screenshot' } },
  { id: 'trayecto', category: 'projects', relationship: 'product', access: 'public', url: 'https://trayecto.app/', linkKind: 'website', image: { src: '/portfolio/trayecto.png', width: 1578, height: 883, kind: 'screenshot' } },
  { id: 'vivir', category: 'projects', relationship: 'client', access: 'public', url: 'https://youtube.com/watch?v=KKoggMgaJDw', linkKind: 'video', image: { src: '/portfolio/vivir-chevere-demo.png', width: 1402, height: 1122, kind: 'demo' } },
  { id: 'cil', category: 'apps', relationship: 'product', access: 'public', url: 'https://cambridge-helper-cumorah.vercel.app/', linkKind: 'website', image: { src: '/portfolio/cil.png', width: 720, height: 1600, kind: 'screenshot' } },
  { id: 'speakpath', category: 'apps', relationship: 'product', access: 'public', url: 'https://speakpath-ten.vercel.app/', linkKind: 'website', image: { src: '/portfolio/speakpath.jpg', width: 720, height: 1600, kind: 'screenshot' } },
  { id: 'collab', category: 'apps', relationship: 'client', access: 'private', image: { src: '/portfolio/collab-map-cover.png', width: 572, height: 609, kind: 'cover' } },
  { id: 'amarhte', category: 'websites', relationship: 'client', access: 'public', url: 'https://amarhte.com/', linkKind: 'website', image: { src: '/portfolio/amarhte.png', width: 1885, height: 902, kind: 'screenshot' } },
  { id: 'perezRojas', category: 'websites', relationship: 'client', access: 'public', url: 'https://www.perezrojasabogados.com/en', linkKind: 'website', image: { src: '/portfolio/perez-rojas.png', width: 1898, height: 911, kind: 'screenshot' } },
  { id: 'biupoll', category: 'websites', relationship: 'client', access: 'public', url: 'https://www.biupoll.com.co/', linkKind: 'website', image: { src: '/portfolio/biupoll.jpg', width: 2000, height: 1600, kind: 'screenshot' } },
]

export function getRealProjects(category: RealProjectCategory): readonly RealProject[] {
  return REAL_PROJECTS.filter((project) => project.category === category)
}

export function getProjectIndex(scrollTop: number, stageHeight: number, count: number): number {
  if (stageHeight <= 0 || count <= 0) return 0
  return Math.min(count - 1, Math.max(0, Math.round(scrollTop / stageHeight)))
}

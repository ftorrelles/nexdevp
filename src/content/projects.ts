export type ProjectCategory = 'ai' | 'systems' | 'web'

export interface Project {
  id: string
  name: string
  description: { es: string; en: string }
  category: ProjectCategory
  // Grid placement — explicit spans for the bento layout
  colSpan: 1 | 2 | 3
  rowSpan: 1 | 2
  stack: string[]
  liveUrl?: string
  gradient: string
  accent: string
  year?: string
}

export const PROJECTS: Project[] = [
  {
    id: 'fpy-academy',
    name: 'FPY Academy',
    description: {
      es: 'Plataforma educativa completa con gestión de cursos, alumnos, pagos online y seguimiento de progreso.',
      en: 'Full-featured educational platform with course management, students, online payments, and progress tracking.',
    },
    category: 'systems',
    colSpan: 2,
    rowSpan: 2,
    stack: ['React', 'Node.js', 'PostgreSQL', 'Stripe'],
    liveUrl: 'https://www.fpyacademy.com',
    gradient: 'from-indigo-950 via-nex-black to-nex-black',
    accent: '#6366f1',
    year: '2025',
  },
  {
    id: 'ai-rag-chatbot',
    name: 'AI Chatbot with RAG Pipeline',
    description: {
      es: 'Agente IA de nivel productivo con arquitectura RAG empresarial completa. Desplegado y en producción.',
      en: 'Production-grade AI agent with full enterprise RAG architecture, deployed and live.',
    },
    category: 'ai',
    colSpan: 1,
    rowSpan: 2,
    stack: ['n8n', 'Vertex AI', 'Gemini 2.5', 'Pinecone', 'Supabase', 'Docker', 'Oracle Cloud'],
    liveUrl: 'https://portfolio-ai-2.netlify.app',
    gradient: 'from-emerald-950 via-nex-black to-nex-black',
    accent: '#22b561',
    year: '2026',
  },
  {
    id: 'vivir-chevere',
    name: 'Vivir Chevere',
    description: {
      es: 'Sistema de gestión empresarial completo: inventario, clientes y operaciones.',
      en: 'Complete business management system: inventory, clients, and operations.',
    },
    category: 'systems',
    colSpan: 1,
    rowSpan: 2,
    stack: ['React', 'Node.js', 'MySQL'],
    liveUrl: 'https://youtube.com/watch?v=KKoggMgaJDw',
    gradient: 'from-amber-950 via-nex-black to-nex-black',
    accent: '#f59e0b',
    year: '2024',
  },
  {
    id: 'esta-caca-caracas',
    name: 'Estaca Caracas',
    description: {
      es: 'Landing page con agente de chatbot IA para iglesia cristiana en Venezuela.',
      en: 'Landing page with AI chatbot agent for a Christian church in Venezuela.',
    },
    category: 'ai',
    colSpan: 2,
    rowSpan: 1,
    stack: ['Next.js', 'AI Chatbot'],
    liveUrl: 'https://www.estacacaracas.com/',
    gradient: 'from-purple-950 via-nex-black to-nex-black',
    accent: '#a855f7',
    year: '2025',
  },
  {
    id: 'biupoll',
    name: 'Biupoll',
    description: {
      es: 'Plataforma de investigación de mercado con encuestas en tiempo real.',
      en: 'Market research platform with real-time surveys.',
    },
    category: 'web',
    colSpan: 1,
    rowSpan: 1,
    stack: ['React', 'Node.js'],
    liveUrl: 'https://www.biupoll.com.co/',
    gradient: 'from-cyan-950 via-nex-black to-nex-black',
    accent: '#06b6d4',
    year: '2024',
  },
  {
    id: 'liliana-pardo',
    name: 'Liliana Pardo',
    description: {
      es: 'Plataforma de reservas para psicóloga con agenda online.',
      en: 'Booking platform for psychologist with online scheduling.',
    },
    category: 'web',
    colSpan: 2,
    rowSpan: 1,
    stack: ['React', 'Node.js'],
    liveUrl: 'https://liliana-pardo.netlify.app/',
    gradient: 'from-pink-950 via-nex-black to-nex-black',
    accent: '#ec4899',
    year: '2024',
  },
  {
    id: 'julio-cesar',
    name: 'Julio César',
    description: {
      es: 'Plataforma digital para consultas de terapia online.',
      en: 'Digital platform for online therapy consultations.',
    },
    category: 'web',
    colSpan: 1,
    rowSpan: 1,
    stack: ['React', 'Node.js'],
    liveUrl: 'https://terapuetajuliocesar.netlify.app/',
    gradient: 'from-violet-950 via-nex-black to-nex-black',
    accent: '#8b5cf6',
    year: '2024',
  },
  {
    id: 'lazos-de-amor',
    name: 'Lazos de Amor',
    description: {
      es: 'Sitio web y gestión digital para ONG de impacto social.',
      en: 'Website and digital management for social impact NGO.',
    },
    category: 'web',
    colSpan: 1,
    rowSpan: 1,
    stack: ['React'],
    liveUrl: 'https://lazos-de-amor.netlify.app/',
    gradient: 'from-rose-950 via-nex-black to-nex-black',
    accent: '#f43f5e',
    year: '2024',
  },
  {
    id: 'netbar',
    name: 'NetBar',
    description: {
      es: 'Sitio web para empresa de servicios de internet y planes para el hogar.',
      en: 'Website for internet service provider offering home broadband plans.',
    },
    category: 'web',
    colSpan: 1,
    rowSpan: 1,
    stack: ['HTML', 'CSS', 'JavaScript'],
    liveUrl: 'https://netbar.netlify.app/',
    gradient: 'from-yellow-950 via-nex-black to-nex-black',
    accent: '#eab308',
    year: '2023',
  },
]

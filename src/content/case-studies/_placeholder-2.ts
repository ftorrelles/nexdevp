import type { CaseStudy } from '../types'

export const placeholder2: CaseStudy = {
  id: 'placeholder-2',
  status: 'placeholder',
  client: 'Coming soon',
  industry: {
    es: 'Por confirmar',
    en: 'To be confirmed',
  },
  slugMap: {
    es: 'caso-3',
    en: 'case-3',
  },
  pain: {
    es: [{ type: 'paragraph', text: 'Próximamente.' }],
    en: [{ type: 'paragraph', text: 'Coming soon.' }],
  },
  solution: {
    es: [{ type: 'paragraph', text: 'Próximamente.' }],
    en: [{ type: 'paragraph', text: 'Coming soon.' }],
  },
  body: {
    es: [{ type: 'paragraph', text: 'Próximamente.' }],
    en: [{ type: 'paragraph', text: 'Coming soon.' }],
  },
  metrics: [],
  technologies: [],
  seo: {
    title: {
      es: 'Caso de estudio — nexdevp',
      en: 'Case study — nexdevp',
    },
    description: {
      es: 'Próximamente.',
      en: 'Coming soon.',
    },
  },
}

import type { Service } from './types'

const services: Service[] = [
  {
    id: 'custom-software',
    painHeadline: {
      es: '¿Tus procesos dependen de planillas, herramientas genéricas o soluciones que no se adaptan a tu negocio?',
      en: 'Are your processes dependent on spreadsheets, generic tools, or solutions that don\'t fit your business?',
    },
    whatWeBuilt: {
      es: 'Construimos software a medida — aplicaciones web, PWAs y sistemas internos — diseñados exactamente para los flujos de trabajo de tu equipo.',
      en: 'We build custom software — web applications, PWAs, and internal tools — designed exactly for your team\'s workflows.',
    },
    outcome: {
      es: 'Tu equipo trabaja con herramientas que entienden su contexto, reduciendo fricción y tiempo perdido en tareas manuales.',
      en: 'Your team works with tools that understand their context, reducing friction and time lost to manual tasks.',
    },
    ctaLabel: {
      es: 'Hablemos de tu proyecto',
      en: 'Let\'s talk about your project',
    },
  },
  {
    id: 'ai-automation',
    painHeadline: {
      es: '¿Tu equipo dedica horas a tareas repetitivas que podrían automatizarse con inteligencia artificial?',
      en: 'Is your team spending hours on repetitive tasks that could be automated with artificial intelligence?',
    },
    whatWeBuilt: {
      es: 'Identificamos los cuellos de botella operativos e implementamos automatizaciones con IA que eliminan el trabajo manual sin valor agregado.',
      en: 'We identify operational bottlenecks and implement AI-powered automations that eliminate low-value manual work.',
    },
    outcome: {
      es: 'Menos horas en tareas de bajo valor, más tiempo disponible para trabajo estratégico que sí requiere criterio humano.',
      en: 'Fewer hours on low-value tasks, more time available for strategic work that genuinely requires human judgment.',
    },
    ctaLabel: {
      es: 'Exploremos qué se puede automatizar',
      en: 'Let\'s explore what can be automated',
    },
  },
  {
    id: 'digital-transformation',
    painHeadline: {
      es: '¿Tu empresa sabe que necesita transformarse digitalmente pero no tiene claro por dónde empezar ni qué priorizar?',
      en: 'Does your company know it needs to transform digitally but isn\'t clear on where to start or what to prioritize?',
    },
    whatWeBuilt: {
      es: 'Acompañamos el proceso completo: diagnóstico de procesos, definición de hoja de ruta tecnológica, selección de herramientas y gestión del cambio.',
      en: 'We accompany the full process: process diagnosis, technology roadmap definition, tool selection, and change management.',
    },
    outcome: {
      es: 'Una hoja de ruta clara, prioridades definidas y un equipo alineado para implementar el cambio sin perder el ritmo operativo.',
      en: 'A clear roadmap, defined priorities, and an aligned team to implement change without losing operational momentum.',
    },
    ctaLabel: {
      es: 'Agendar diagnóstico',
      en: 'Book a diagnosis',
    },
  },
  {
    id: 'mvp-prototyping',
    painHeadline: {
      es: '¿Tenés una idea de producto digital pero no querés invertir meses y miles de dólares antes de validarla en el mercado?',
      en: 'Do you have a digital product idea but don\'t want to invest months and thousands of dollars before validating it in the market?',
    },
    whatWeBuilt: {
      es: 'Desarrollamos MVPs funcionales en 4 a 8 semanas: lo suficiente para validar hipótesis reales con usuarios reales, sin construcción prematura.',
      en: 'We develop functional MVPs in 4 to 8 weeks: enough to validate real hypotheses with real users, without premature construction.',
    },
    outcome: {
      es: 'Datos reales de uso antes de comprometerte con una arquitectura completa. Sabés qué construir porque ya lo probaste.',
      en: 'Real usage data before committing to a full architecture. You know what to build because you\'ve already tested it.',
    },
    ctaLabel: {
      es: 'Hablemos de tu idea',
      en: 'Let\'s talk about your idea',
    },
  },
]

export function getServices(): Service[] {
  return services
}

import type { CaseStudy } from '../types'

export const cocinerhosp: CaseStudy = {
  id: 'cocinerhosp',
  status: 'published',
  client: 'CocinerHosp',
  industry: {
    es: 'Gestión hospitalaria',
    en: 'Hospital management',
  },
  slugMap: {
    es: 'cocinerhosp',
    en: 'cocinerhosp',
  },
  pain: {
    es: [
      {
        type: 'paragraph',
        text: 'Seis centros hospitalarios en Tenerife gestionaban la producción diaria de cocina con planillas de Excel y pizarras físicas. Cada mañana, el jefe de cocina tardaba entre 25 y 35 minutos en calcular raciones, ajustar menús por dietas especiales y coordinar con los auxiliares de servicio.',
      },
      {
        type: 'paragraph',
        text: 'La falta de trazabilidad generaba desperdicio sistemático: sin registro histórico de consumo real, se cocinaba por exceso para evitar la escasez. El desperdicio alimentario superaba el 18% de la producción mensual, con un impacto directo en costos operativos y sostenibilidad.',
      },
      {
        type: 'list',
        items: [
          'Cálculo manual de raciones: 25–35 min diarios por centro',
          'Sin historial de consumo real para ajustar previsiones',
          'Desperdicio alimentario superior al 18% mensual',
          'Coordinación por verbal y pizarra entre cocina y servicio',
          'Sin visibilidad centralizada entre los 6 centros',
        ],
      },
    ],
    en: [
      {
        type: 'paragraph',
        text: 'Six hospital centers in Tenerife managed daily kitchen production with Excel spreadsheets and physical whiteboards. Every morning, the head chef spent 25 to 35 minutes calculating portions, adjusting menus for special diets, and coordinating with service staff.',
      },
      {
        type: 'paragraph',
        text: 'The lack of traceability generated systematic waste: without a historical record of actual consumption, food was cooked in excess to avoid shortages. Food waste exceeded 18% of monthly production, with a direct impact on operational costs and sustainability.',
      },
      {
        type: 'list',
        items: [
          'Manual portion calculation: 25–35 min daily per center',
          'No consumption history to adjust forecasts',
          'Food waste exceeding 18% monthly',
          'Verbal and whiteboard coordination between kitchen and service',
          'No centralized visibility across the 6 centers',
        ],
      },
    ],
  },
  solution: {
    es: [
      {
        type: 'paragraph',
        text: 'Diseñamos e implementamos una PWA (Progressive Web App) mobile-first que los cocineros y auxiliares usan directamente desde sus teléfonos y tablets, sin necesidad de instalar nada.',
      },
      {
        type: 'heading',
        level: 3,
        text: 'Funcionalidades clave',
      },
      {
        type: 'list',
        items: [
          'Cálculo automático de raciones basado en pacientes activos y tipo de dieta',
          'Registro de producción real y sobrantes al cierre de cada servicio',
          'Historial de consumo para ajuste progresivo de previsiones',
          'Sincronización en tiempo real entre los 6 centros',
          'Interfaz offline-first para zonas sin cobertura dentro del hospital',
        ],
      },
      {
        type: 'paragraph',
        text: 'El sistema reemplazó por completo los procesos manuales sin requerir hardware adicional. La adopción fue inmediata: el equipo de cocina comenzó a operar con la app en la primera semana.',
      },
    ],
    en: [
      {
        type: 'paragraph',
        text: 'We designed and implemented a mobile-first PWA (Progressive Web App) that chefs and service staff use directly from their phones and tablets, with no installation required.',
      },
      {
        type: 'heading',
        level: 3,
        text: 'Key features',
      },
      {
        type: 'list',
        items: [
          'Automatic portion calculation based on active patients and diet type',
          'Real production and leftover logging at the close of each service',
          'Consumption history for progressive forecast adjustment',
          'Real-time sync across all 6 centers',
          'Offline-first interface for areas without connectivity inside the hospital',
        ],
      },
      {
        type: 'paragraph',
        text: 'The system fully replaced manual processes without requiring additional hardware. Adoption was immediate: the kitchen team began operating with the app in the first week.',
      },
    ],
  },
  body: {
    es: [
      {
        type: 'heading',
        level: 2,
        text: 'Impacto en operaciones',
      },
      {
        type: 'paragraph',
        text: 'A los 60 días de implementación, el tiempo de cálculo diario de producción bajó de 30 minutos a 2 minutos por centro. El desperdicio alimentario se redujo en un 30%, resultado directo del registro de sobrantes y el ajuste progresivo de previsiones.',
      },
      {
        type: 'quote',
        text: 'Ahora entro a la cocina y ya sé exactamente cuánto hay que cocinar. No hay discusiones, no hay cálculos en servilletas.',
      },
      {
        type: 'paragraph',
        text: 'La dirección de operaciones del grupo hospitalario obtuvo por primera vez visibilidad unificada del consumo real en los seis centros, permitiendo decisiones de compra basadas en datos históricos.',
      },
    ],
    en: [
      {
        type: 'heading',
        level: 2,
        text: 'Operational impact',
      },
      {
        type: 'paragraph',
        text: 'Within 60 days of deployment, daily production calculation time dropped from 30 minutes to 2 minutes per center. Food waste was reduced by 30%, a direct result of leftover logging and progressive forecast adjustment.',
      },
      {
        type: 'quote',
        text: 'Now I walk into the kitchen already knowing exactly how much needs to be cooked. No arguments, no napkin math.',
      },
      {
        type: 'paragraph',
        text: 'For the first time, the hospital group\'s operations management gained unified visibility into actual consumption across all six centers, enabling purchasing decisions based on historical data.',
      },
    ],
  },
  metrics: [
    {
      value: '30%',
      label: {
        es: 'menos comida desperdiciada',
        en: 'less food wasted',
      },
    },
    {
      value: '30min→2min',
      label: {
        es: 'cálculo diario de producción',
        en: 'daily production calculation',
      },
    },
  ],
  technologies: ['Next.js', 'PWA', 'TypeScript', 'Supabase'],
  seo: {
    title: {
      es: 'CocinerHosp: gestión de cocina hospitalaria con PWA — nexdevp',
      en: 'CocinerHosp: hospital kitchen management with PWA — nexdevp',
    },
    description: {
      es: 'Cómo nexdevp redujo el desperdicio alimentario en un 30% y el tiempo de cálculo diario de 30 minutos a 2 minutos en 6 centros hospitalarios en Tenerife.',
      en: 'How nexdevp reduced food waste by 30% and daily calculation time from 30 minutes to 2 minutes across 6 hospital centers in Tenerife.',
    },
  },
}

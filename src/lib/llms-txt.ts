import { getDefaultSeo } from '@/lib/seo'
import { getSitePages, type SitePage } from '@/lib/site-pages'
import { BOOKING_URL, WHATSAPP_NUMBER } from '@/lib/constants'
import type { Locale } from '@/content/types'
import es from '../../messages/es.json'
import en from '../../messages/en.json'

const SUMMARY: Record<Locale, string> = {
  en: 'nexdevp is a custom software consultancy. It builds internal management systems, AI automations and agents for sales and operations, and websites. It works remotely for companies in Latin America, Spain and the US, and the first consultation is free.',
  es: 'nexdevp es una consultora de software a medida. Desarrolla sistemas internos de gestión, automatizaciones y agentes de IA para ventas y operaciones, y sitios web. Trabaja de forma remota para empresas de Latinoamérica, España y Estados Unidos, y la primera consulta es gratuita.',
}

const SECTION_TITLE: Record<Locale, string> = { en: 'English', es: 'Español' }

const STATIC_LABEL: Record<Locale, Record<'home' | 'careers', string>> = {
  en: { home: 'Home', careers: 'Careers' },
  es: { home: 'Inicio', careers: 'Trabaja con nosotros' },
}

const CAREERS_DESCRIPTION: Record<Locale, string> = {
  en: en.careers.metaDescription,
  es: es.careers.metaDescription,
}

function describePage(page: SitePage): { label: string; description: string } {
  if (page.kind === 'case' && page.caseStudy) {
    return {
      label: page.caseStudy.seo.title[page.locale],
      description: page.caseStudy.seo.description[page.locale],
    }
  }
  if (page.kind === 'careers') {
    return { label: STATIC_LABEL[page.locale].careers, description: CAREERS_DESCRIPTION[page.locale] }
  }
  return { label: STATIC_LABEL[page.locale].home, description: getDefaultSeo(page.locale).description }
}

export function buildLlmsTxt(): string {
  const pages = getSitePages()
  const lines: string[] = ['# nexdevp', '', `> ${SUMMARY.en}`, '', `> ${SUMMARY.es}`, '']

  for (const locale of ['en', 'es'] as Locale[]) {
    lines.push(`## ${SECTION_TITLE[locale]}`, '')
    for (const page of pages.filter((p) => p.locale === locale)) {
      const { label, description } = describePage(page)
      lines.push(`- [${label}](${page.url}): ${description}`)
    }
    lines.push('')
  }

  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER.replace(/\D/g, '')}`
  lines.push(
    '## Contact',
    '',
    `- [WhatsApp](${whatsappUrl}): ${WHATSAPP_NUMBER}`,
    `- [Book a free call / Agendar una llamada gratis](${BOOKING_URL})`,
    '',
  )

  return lines.join('\n')
}

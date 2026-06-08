import type { CaseStudy, Locale } from '../types'
import { cocinerhosp } from './cocinerhosp'
import { placeholder1 } from './_placeholder-1'
import { placeholder2 } from './_placeholder-2'

const allCases: CaseStudy[] = [cocinerhosp, placeholder1, placeholder2]

export function getPublishedCases(): CaseStudy[] {
  return allCases.filter((c) => c.status === 'published')
}

export function getCaseBySlug(slug: string, locale: Locale): CaseStudy | undefined {
  return allCases.find((c) => c.status === 'published' && c.slugMap[locale] === slug)
}

export function getPublishedSlugsForLocale(locale: Locale): string[] {
  return getPublishedCases().map((c) => c.slugMap[locale])
}

export type { CaseStudy }

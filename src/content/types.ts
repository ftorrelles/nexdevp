export type Locale = 'es' | 'en'
export type Localized<T> = Record<Locale, T>
export type RichBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'heading'; level: 2 | 3; text: string }
  | { type: 'list'; items: string[] }
  | { type: 'quote'; text: string }
export type RichText = RichBlock[]
export interface Metric { value: string; label: Localized<string> }
export interface CaseStudy {
  id: string
  status: 'published' | 'placeholder'
  client: string
  industry: Localized<string>
  slugMap: Record<Locale, string>
  pain: Localized<RichText>
  solution: Localized<RichText>
  body: Localized<RichText>
  metrics: Metric[]
  technologies: string[]
  seo: { title: Localized<string>; description: Localized<string> }
}
export interface Service {
  id: string
  painHeadline: Localized<string>
  whatWeBuilt: Localized<string>
  outcome: Localized<string>
  ctaLabel: Localized<string>
}
export function pick<T>(localized: Localized<T>, locale: Locale): T {
  return localized[locale]
}

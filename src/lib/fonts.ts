import { Cormorant_Garamond, DM_Mono, Jost } from 'next/font/google'

// Only the families/weights/styles referenced by Tailwind classes in src/ are
// loaded. Jost (body) and DM Mono (labels) are used above the fold on the
// landing and stay preloaded. Cormorant Garamond is only used by the case
// detail page, so it is available but not preloaded.

export const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400'],
  style: ['normal'],
  display: 'swap',
  preload: false,
  variable: '--font-cormorant',
})

export const dmMono = DM_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  style: ['normal'],
  display: 'swap',
  variable: '--font-dm-mono',
})

export const jost = Jost({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  display: 'swap',
  variable: '--font-jost',
})

export const fontVariables = `${cormorant.variable} ${dmMono.variable} ${jost.variable}`

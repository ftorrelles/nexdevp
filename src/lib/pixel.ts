/**
 * Meta Pixel — helpers de eventos de conversión
 * Pixel ID: 1018345797219731
 *
 * Uso:
 *   import { pixelEvent } from '@/lib/pixel'
 *   pixelEvent('Lead')
 *   pixelEvent('Schedule')
 */

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fbq?: (...args: any[]) => void
  }
}

export type PixelEvent = 'Lead' | 'Schedule' | 'PageView' | 'Contact' | 'ViewContent'

/**
 * Dispara un evento estándar de Meta Pixel.
 * Es seguro llamarlo en SSR — solo actúa si fbq existe en window.
 * Until fbevents.js loads, `window.fbq` is the queueing stub installed by
 * MetaPixel; the library flushes the queue on load, so no event is dropped.
 */
export function pixelEvent(event: PixelEvent, params?: Record<string, unknown>): void {
  if (typeof window === 'undefined' || !window.fbq) return
  window.fbq('track', event, params)
}

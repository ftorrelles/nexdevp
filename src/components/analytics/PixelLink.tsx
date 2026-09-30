'use client'

import type { ComponentPropsWithoutRef } from 'react'
import { pixelEvent, type PixelEvent } from '@/lib/pixel'

interface PixelLinkProps extends ComponentPropsWithoutRef<'a'> {
  event: PixelEvent
}

// Anchor that fires a pixel event on click. Lets server components (e.g. the
// footer) track a link without becoming client components themselves.
export function PixelLink({ event, onClick, ...rest }: PixelLinkProps): React.JSX.Element {
  return (
    <a
      {...rest}
      onClick={(e) => {
        pixelEvent(event)
        onClick?.(e)
      }}
    />
  )
}

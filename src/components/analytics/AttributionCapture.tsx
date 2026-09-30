'use client'

import { useEffect } from 'react'
import { captureAttribution } from '@/lib/attribution-storage'

// Reads the landing URL/referrer on the client only, so the pages stay static.
export function AttributionCapture(): null {
  useEffect(() => {
    captureAttribution()
  }, [])

  return null
}

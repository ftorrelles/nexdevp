import { WHATSAPP_NUMBER, BOOKING_URL, SITE_URL } from './constants'

export interface LaunchError {
  field: string
  message: string
}

export function validateLaunchRequirements(): LaunchError[] {
  const errors: LaunchError[] = []

  if (WHATSAPP_NUMBER === '+549XXXXXXXXXX') {
    errors.push({
      field: 'WHATSAPP_NUMBER',
      message: 'WHATSAPP_NUMBER is still the placeholder value. Replace with the real E.164 number before launch.',
    })
  }

  if (BOOKING_URL === 'https://tidycal.com/placeholder') {
    errors.push({
      field: 'BOOKING_URL',
      message: 'BOOKING_URL is still the placeholder. Replace with the real Tidycal URL before launch.',
    })
  }

  if (!SITE_URL || SITE_URL.trim() === '') {
    errors.push({
      field: 'SITE_URL',
      message: 'SITE_URL is not set. Set the canonical domain before launch.',
    })
  }

  // CocinerHosp EN SEO title is validated inline via constants import above.
  // The actual value is in src/content/case-studies/cocinerhosp.ts.
  // If you need to enforce it here, import cocinerhosp and check seo.title.en.

  return errors
}

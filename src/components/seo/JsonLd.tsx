import { serializeJsonLd } from '@/lib/json-ld'

interface JsonLdProps {
  data: unknown
}

export function JsonLd({ data }: JsonLdProps): React.JSX.Element {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  )
}

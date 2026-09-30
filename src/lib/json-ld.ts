// Characters that could close the <script> element or be read as markup by an
// HTML parser, plus the two line separators that break older JS engines.
const UNSAFE_CHARS = /[<>&\u2028\u2029]/g

function toUnicodeEscape(char: string): string {
  return `\\u${char.charCodeAt(0).toString(16).padStart(4, '0')}`
}

// JSON.stringify for embedding inside <script type="application/ld+json">.
// The output is still valid JSON and parses back to the same value.
export function serializeJsonLd(data: unknown): string {
  return (JSON.stringify(data) ?? 'null').replace(UNSAFE_CHARS, toUnicodeEscape)
}

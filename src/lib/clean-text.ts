// Shared text hygiene for untrusted strings that end up in Postgres.
// Postgres rejects NUL (\u0000) in text/jsonb and lone UTF-16 surrogates in jsonb,
// so a hostile value would otherwise turn into a 500 and a lost lead.

const CONTROL_CHARS = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g
const CONTROL_CHARS_NO_NEWLINES = /[\u0000-\u001f\u007f]/g
// A valid surrogate pair (length 2) is kept; any other surrogate half is dropped.
const SURROGATES = /[\ud800-\udbff][\udc00-\udfff]|[\ud800-\udfff]/g

function dropLoneSurrogates(value: string): string {
  return value.replace(SURROGATES, (match) => (match.length === 2 ? match : ''))
}

/**
 * Removes control characters and lone surrogates, trims, then caps the length.
 * Newlines and tabs are kept only when `multiline` is true.
 */
export function cleanText(value: string, max: number, multiline = false): string {
  const stripped = dropLoneSurrogates(
    value.replace(multiline ? CONTROL_CHARS : CONTROL_CHARS_NO_NEWLINES, '')
  ).trim()
  // Cutting at `max` can split a surrogate pair; drop any orphan half it leaves.
  return dropLoneSurrogates(stripped.slice(0, max)).trim()
}

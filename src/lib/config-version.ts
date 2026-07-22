// Server-side helpers for the monotonic catalog/pricing version counters.
// Each quote freezes the version it was built against; bumping a version marks
// "everything quoted before this is on the old config".

import type { SupabaseClient } from '@supabase/supabase-js'

export interface ConfigVersions {
  catalog_version: number
  pricing_version: number
}

const DEFAULT_VERSIONS: ConfigVersions = { catalog_version: 1, pricing_version: 1 }

export async function getConfigVersions(client: SupabaseClient): Promise<ConfigVersions> {
  const { data, error } = await client
    .from('config_versions')
    .select('catalog_version, pricing_version')
    .eq('id', 1)
    .maybeSingle()

  if (error || !data) return DEFAULT_VERSIONS
  return {
    catalog_version: data.catalog_version ?? 1,
    pricing_version: data.pricing_version ?? 1,
  }
}

/** Increments the given counter so future quotes record a newer version. */
export async function bumpConfigVersion(
  client: SupabaseClient,
  kind: 'catalog' | 'pricing',
): Promise<void> {
  const column = kind === 'catalog' ? 'catalog_version' : 'pricing_version'
  const current = await getConfigVersions(client)
  const next = (kind === 'catalog' ? current.catalog_version : current.pricing_version) + 1

  const { error } = await client
    .from('config_versions')
    .update({ [column]: next, updated_at: new Date().toISOString() })
    .eq('id', 1)

  if (error) console.error(`Failed to bump ${column}:`, error)
}

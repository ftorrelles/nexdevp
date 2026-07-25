import { NextRequest, NextResponse } from 'next/server'
import { createAuthServerClient } from '@/lib/supabase-server'
import { createServiceClient } from '@/lib/supabase'
import type { QuoteSize, QuoteCatalogItem } from '@/lib/supabase'

interface CatalogRow {
  id:          string
  name:        string
  description: string | null
  category:    string
  size:        QuoteSize
  base_hours:  number | null
  complexity:  string | null
  sort_order:  number
}

/**
 * Resolves a catalog row into a quote line. Hours come from the catalog default
 * unless the product overrides them: client polish is 12h on a custom app but
 * only 6h on a landing, and both point at the same catalog row.
 */
function toItem(row: CatalogRow, hoursOverride: number | null, sortOrder: number): QuoteCatalogItem {
  return {
    id:          row.id,
    name:        row.name,
    description: row.description,
    category:    row.category,
    size:        row.size,
    hours:       hoursOverride ?? row.base_hours ?? 0,
    complexity:  row.complexity,
    sort_order:  sortOrder,
  }
}

// Returns the base template for a tipo+product (base técnica + módulos + cierre),
// the add-ons that are coherent for that product, pricing settings for all
// regions and the size→label map.
export async function GET(req: NextRequest): Promise<NextResponse> {
  const supabase = await createAuthServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  const role = user?.app_metadata?.role
  if (!user || !['owner', 'supervisor', 'vendor'].includes(role)) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const tipo    = searchParams.get('tipo')
  const product = searchParams.get('product')

  const client = createServiceClient()
  const CATALOG_FIELDS = 'id, name, description, category, size, base_hours, complexity, sort_order'

  const [settingsRes, sizesRes, templateRes, addonsRes] = await Promise.all([
    client.from('pricing_settings').select('*').order('region'),
    client.from('quote_size_map').select('*').order('hours'),
    tipo && product
      ? client
          .from('quote_templates')
          .select(`sort_order, hours_override, quote_catalog(${CATALOG_FIELDS})`)
          .eq('tipo', tipo)
          .eq('product', product)
          .order('sort_order')
      : Promise.resolve({ data: [], error: null }),
    product
      ? client
          .from('quote_product_addons')
          .select(`sort_order, hours_override, quote_catalog(${CATALOG_FIELDS})`)
          .eq('product', product)
          .order('sort_order')
      : Promise.resolve({ data: [], error: null }),
  ])

  if (settingsRes.error) {
    console.error('pricing_settings error:', settingsRes.error)
    return NextResponse.json({ error: 'Error al cargar configuración.' }, { status: 500 })
  }

  type JoinRow = {
    sort_order:     number
    hours_override: number | null
    quote_catalog:  CatalogRow | null
  }

  const mapRows = (rows: unknown): QuoteCatalogItem[] =>
    ((rows ?? []) as JoinRow[])
      .filter(r => r.quote_catalog && (r.quote_catalog as CatalogRow & { active?: boolean }).id)
      .map(r => toItem(r.quote_catalog as CatalogRow, r.hours_override, r.sort_order))

  return NextResponse.json({
    settings: settingsRes.data,
    sizes:    sizesRes.data ?? [],
    items:    mapRows(templateRes.data),
    addons:   mapRows(addonsRes.data),
  })
}

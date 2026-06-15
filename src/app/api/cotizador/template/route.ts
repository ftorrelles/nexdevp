import { NextRequest, NextResponse } from 'next/server'
import { createAuthServerClient } from '@/lib/supabase-server'
import { createServiceClient } from '@/lib/supabase'

// Returns catalog items for a given tipo+product template,
// plus pricing settings for all regions and size→hours map.
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

  const [settingsRes, sizesRes, templateRes] = await Promise.all([
    client.from('pricing_settings').select('*').order('region'),
    client.from('quote_size_map').select('*').order('hours'),
    tipo && product
      ? client
          .from('quote_templates')
          .select('sort_order, quote_catalog(id, name, size, sort_order)')
          .eq('tipo', tipo)
          .eq('product', product)
          .order('sort_order')
      : Promise.resolve({ data: [], error: null }),
  ])

  if (settingsRes.error) {
    console.error('pricing_settings error:', settingsRes.error)
    return NextResponse.json({ error: 'Error al cargar configuración.' }, { status: 500 })
  }

  const items = (templateRes.data ?? [])
    .map((t: { sort_order: number; quote_catalog: unknown }) => t.quote_catalog)
    .filter(Boolean)

  return NextResponse.json({
    settings: settingsRes.data,
    sizes:    sizesRes.data ?? [],
    items,
  })
}

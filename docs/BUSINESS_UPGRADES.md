# nexdevp — Business upgrades (versionado · permisos · dashboard)

Implementación incremental y aditiva. **No** reescribe el sistema: añade columnas,
tablas y una capa de permisos centralizada. Los flujos actuales (leads, quotes,
PDF, careers, auth) siguen funcionando.

## 0) Aplicar primero la migración

Ejecutá **una sola vez** en el SQL Editor de Supabase:

```
supabase/2026_business_upgrades.sql
```

Es idempotente (`add column if not exists`, `create table if not exists`). Hace
un backfill que congela `currency` + `total_snapshot` de las quotes existentes.
**El código nuevo asume que esta migración ya corrió.**

---

## 1) Versionado del cotizador (snapshots)

Cuando se guarda una quote, el servidor **congela** todo lo usado para calcular el
precio. Las lecturas (PDF, dashboard) usan el snapshot, nunca la config actual.

- Nuevas columnas en `quotes`: `catalog_version`, `pricing_version`, `currency`,
  `hourly_rate_snapshot`, `pm/qa/cx/maint_percentage_snapshot`,
  `development/pm/qa/contingency_hours_snapshot`, `subtotal_snapshot`,
  `total_snapshot`, `annual_maintenance_snapshot`, `selected_items_snapshot` (jsonb),
  `calculation_snapshot` (jsonb), `approved_by/at`, `sent_at`.
- Nuevas columnas en `quote_items`: `description`, `category`, `calculated_price`,
  `is_custom`, `catalog_version`.
- Tabla `config_versions` (singleton): contadores `catalog_version` / `pricing_version`
  que se incrementan al editar catálogo o pricing → cada quote recuerda contra qué
  versión se calculó.

**Motor central:** [`src/lib/quote-calc.ts`](../src/lib/quote-calc.ts)
- `computeQuoteTotals()` — única fuente de la matemática (cliente + servidor).
- `buildQuoteSnapshot()` — genera todas las columnas de snapshot (autoritativo,
  desde `pricing_settings`, no desde números del cliente).
- `effectiveQuoteView()` — lee la quote priorizando el snapshot, con *fallback* a
  columnas legacy para quotes pre-versionado.

**Reglas aplicadas (servidor):**
- `draft` → recalcula al guardar (`canRecalculateQuote`).
- `sent` / `accepted` / `rejected` → **congelado**, nunca recalcula.
- Pasar a `sent` setea `sent_at` y congela el snapshot.
- Pasar a `accepted` setea `approved_at/by` y genera la comisión.
- El PDF ([pdf/route.ts](../src/app/api/cotizador/quotes/[id]/pdf/route.ts)) usa
  `effectiveQuoteView` → porcentajes, tarifa y total del snapshot.
- El editor muestra un banner "congelado" y deshabilita edición de precio cuando la
  quote no es borrador.

---

## 2) Permisos (roles y controles)

**Fuente única:** [`src/lib/permissions.ts`](../src/lib/permissions.ts) — funciones
puras usables en cliente (ocultar UI) y servidor (enforcement real).

Funciones: `canViewLead`, `canEditLead`, `canDeleteLead`, `canAssignLead`,
`canCreateQuote`, `canViewQuote`, `canEditQuote`, `canRecalculateQuote`,
`canSendQuote`, `canApproveQuote`, `canSetQuoteStatus`, `canModifyQuotePricing`,
`canModifyCatalog`, `canViewCommissions`, `canManageCommissions`,
`canViewBusinessMetrics`, `canViewGlobalMetrics`, `metricsScope`, `canManageUsers`,
`canViewApplicants`.

| Acción | owner | supervisor | vendor |
|---|---|---|---|
| Ver lead | todos | todos | solo propios (`assigned_to` o `created_by`) |
| Crear lead | ✅ | ✅ | ✅ (se auto-asigna a sí mismo) |
| Editar lead | ✅ | ✅ | solo propios |
| Borrar lead | ✅ | ❌ | ❌ |
| Reasignar lead | ✅ | ❌ | ❌ |
| Crear quote | ✅ | ✅ | solo para leads propios / standalone |
| Editar quote | ✅ | ✅ | solo propias **en draft** |
| Aceptar quote | ✅ | ✅ | ❌ |
| Pricing global (tarifas, %) | ✅ | ❌ | ❌ |
| Editar catálogo | ✅ | ✅ | ❌ |
| Ver comisiones | todas | todas | solo propias |
| Métricas | global | global | solo propias (`metricsScope='self'`) |
| Applicants / CVs | ✅ | ✅ | ❌ |

**Enforcement backend** (no solo UI):
- Helper de sesión verificada: [`src/lib/auth-server.ts`](../src/lib/auth-server.ts)
  (`getActor()` lee el rol del JWT verificado, no del cliente).
- Quotes: `GET/PUT/DELETE /api/cotizador/quotes/[id]` validan propiedad vía el lead
  vinculado. Un vendor **no** puede leer/editar/borrar/exportar PDF de quotes ajenas.
- Lista de quotes (`GET /api/cotizador/quotes` y la página SSR `/admin/cotizador`)
  filtran por vendor.
- Leads: `PATCH` valida propiedad; `assigned_to` solo owner; `DELETE` solo owner.
- Selector de leads del cotizador (`/api/cotizador/leads`) filtra por vendor.
- Pricing (`PUT /api/cotizador/settings`) y catálogo gated + bump de versión.
- RLS sigue **activa** en todas las tablas; las nuevas tablas también. El enforcement
  por-vendor vive en la capa API porque las lecturas usan `service_role`.

---

## 3) Dashboard de métricas — `/admin/dashboard`

**Agregaciones:** [`src/lib/metrics.ts`](../src/lib/metrics.ts) ·
**UI:** [`src/app/admin/dashboard/page.tsx`](../src/app/admin/dashboard/page.tsx)

KPIs: leads, quotes generadas, quotes aceptadas, **revenue estimado** (Σ
`total_snapshot` de aceptadas), **comisiones devengadas** (Σ `quote_commissions`),
tiempo medio de respuesta (primer `lead_activities` de contacto − `lead.created_at`),
valor medio de cotización y valor medio aceptada. Más: leads por canal (barras),
conversión por vendedor (conv. lead = aceptadas/leads; win rate = aceptadas/quotes),
últimas ventas cerradas.

- **owner/supervisor** → métricas globales + filtro por vendedor.
- **vendor** → `scope='self'`, solo sus datos.
- Filtros: rango de fechas, vendedor (global), canal, estado de quote.
- Revenue/comisiones **siempre desde snapshots** → cambiar precios actuales no altera
  el histórico. Importes agrupados por divisa (EUR/USD no se mezclan).

### Comisiones — `quote_commissions`
Snapshot inmutable creado al aceptar una quote
([`src/lib/quote-commission.ts`](../src/lib/quote-commission.ts)):
`nexdevp_pool` = 15%, `own_lead` = 20%. `upsert` por `quote_id` (idempotente).
Al salir de `accepted` la comisión se cancela (salvo si ya está `paid`).

### Actividades — `lead_activities`
`POST/GET /api/leads/[id]/activities`. Al cambiar un lead a `contactado` se registra
una actividad `contacted` (primera respuesta para la métrica de tiempo).

---

## Cómo probar manualmente

1. **Quote con tarifa congelada**
   - Configuración → España a 55 €/h. Crear quote para España, enviarla (`sent`).
   - Cambiar España a 65 €/h en Configuración.
   - Abrir la quote vieja / descargar su PDF → sigue mostrando 55 €/h y el total
     original. Crear una quote nueva → usa 65 €/h.

2. **Vendor accediendo a lead/quote ajeno**
   - Con sesión `vendor`, `GET /api/cotizador/quotes/<id_de_otro>` → 403.
   - `/admin/cotizador` y el selector de leads solo muestran lo propio.
   - `PATCH /api/leads/<id>` con `assigned_to` (reasignar) → 403.
   - `PUT /api/cotizador/settings` (cambiar tarifa) → 403.
   - Marcar una quote como `accepted` desde vendor → 403.

3. **Owner ve dashboard global** — `/admin/dashboard` muestra todos los vendedores,
   tabla por vendedor y filtro por vendedor.

4. **Vendor ve dashboard propio** — `/admin/dashboard` (sin filtro de vendedor) solo
   con sus leads/quotes/comisiones.

5. **Comisión al aceptar** — Aceptar una quote con lead vinculado → aparece fila en
   `quote_commissions` (15% pool / 20% lead propio) y suma en "Comisiones devengadas".

## Archivos

**Nuevos:** `supabase/2026_business_upgrades.sql`, `src/lib/permissions.ts`,
`src/lib/auth-server.ts`, `src/lib/quote-calc.ts`, `src/lib/config-version.ts`,
`src/lib/quote-commission.ts`, `src/lib/metrics.ts`,
`src/app/admin/dashboard/page.tsx`, `src/app/api/leads/[id]/activities/route.ts`.

**Modificados:** `src/lib/supabase.ts` (tipos), endpoints de quotes/leads/settings/
catalog, PDF, `QuoteEditor.tsx`, `AdminNav.tsx`, `admin/page.tsx`, `admin/cotizador/page.tsx`.

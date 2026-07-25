import React from 'react'
import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer'

const BRAND  = '#00E472'
const DARK   = '#111111'
const MID    = '#F2F2F2'
const GREY   = '#666666'
const WHITE  = '#FFFFFF'
const LIGHT  = '#F8F8F8'
const BORDER = '#DDDDDD'

const s = StyleSheet.create({
  page:      { backgroundColor: WHITE, color: DARK, fontFamily: 'Helvetica', padding: '40pt 44pt' },
  header:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 },
  tagline:   { fontSize: 8, color: GREY, marginTop: 3, letterSpacing: 2 },
  docLabel:  { fontSize: 8, color: GREY, letterSpacing: 2, textAlign: 'right' },
  docId:     { fontSize: 10, color: DARK, marginTop: 4, textAlign: 'right', fontFamily: 'Helvetica-Bold' },
  docDate:   { fontSize: 8, color: GREY, marginTop: 2, textAlign: 'right' },
  divider:   { borderBottomWidth: 1, borderBottomColor: BORDER, marginBottom: 24 },
  titleText: { fontSize: 18, color: DARK, fontFamily: 'Helvetica-Bold', marginBottom: 6 },
  meta:      { fontSize: 9, color: GREY, letterSpacing: 0.5 },
  sectionHd: { fontSize: 7, color: BRAND, letterSpacing: 2, marginBottom: 8, fontFamily: 'Helvetica-Bold' },
  section:   { marginBottom: 24 },
  tableHdRow:{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: BORDER, paddingBottom: 6, marginBottom: 2 },
  tableRow:  { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#EEEEEE', paddingVertical: 7 },
  colName:   { flex: 1, fontSize: 9, color: DARK },
  colNameHd: { flex: 1, fontSize: 7, color: GREY, letterSpacing: 1 },
  logo:      { width: 120, height: 32, objectFit: 'contain' },
  colHrs:    { width: 50, fontSize: 9, color: DARK, textAlign: 'right', fontFamily: 'Helvetica-Bold' },
  colHrsHd:  { width: 50, fontSize: 7, color: GREY, letterSpacing: 1, textAlign: 'right' },
  partRow:   { flexDirection: 'row', paddingLeft: 14, paddingVertical: 2 },
  partBullet:{ width: 10, fontSize: 8, color: '#999999' },
  partText:  { flex: 1, fontSize: 8, color: '#999999' },
  ohRow:     { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: '#EEEEEE' },
  ohLabel:   { fontSize: 9, color: GREY },
  ohValue:   { fontSize: 9, color: DARK, fontFamily: 'Helvetica-Bold' },
  totalRow:  { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 8 },
  totalLabel:{ fontSize: 10, color: DARK, fontFamily: 'Helvetica-Bold' },
  totalValue:{ fontSize: 10, color: BRAND, fontFamily: 'Helvetica-Bold' },
  cards:     { flexDirection: 'row', gap: 12, marginBottom: 24 },
  cardSec:   { flex: 1, backgroundColor: LIGHT, borderWidth: 1, borderColor: BORDER, borderRadius: 8, padding: 14 },
  cardLabel: { fontSize: 7, color: GREY, letterSpacing: 1.5, marginBottom: 6 },
  cardSecV:  { fontSize: 16, color: DARK, fontFamily: 'Helvetica-Bold' },
  notesBox:  { backgroundColor: LIGHT, borderRadius: 6, padding: 12 },
  notesText: { fontSize: 9, color: GREY, lineHeight: 1.5 },
  footer:    { position: 'absolute', bottom: 28, left: 44, right: 44, flexDirection: 'row', justifyContent: 'space-between' },
  footerL:   { fontSize: 7, color: '#AAAAAA' },
  footerR:   { fontSize: 7, color: '#AAAAAA' },
})

const REGION_LABEL: Record<string, string> = {
  españa: 'España',
  eeuu:   'Estados Unidos',
  latam:  'Latinoamérica',
}

function fmtCurrency(n: number, currency: string) {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency', currency, maximumFractionDigits: 0,
  }).format(n)
}

export interface QuotePDFProps {
  id:               string
  title:            string
  tipo:             string
  product:          string
  region:           string
  hourly_rate:      number
  total_price:      number
  special_discount: number
  maint_month:      number
  notes:            string | null
  created_at:       string | null
  items:            Array<{ name: string; size?: string | null; hours?: number | null; gift?: boolean; parts?: string[] | null }>
  currency:         string
  overhead_pm:      number
  overhead_qa:      number
  overhead_cx:      number
  logoUrl:          string
  // Display options
  showHours:        boolean
  showRate:         boolean
  showMaint:        boolean
}

export function QuotePDF({
  id, title, tipo, product, region, total_price, special_discount, maint_month, hourly_rate,
  notes, created_at, items, currency, overhead_pm, overhead_qa, overhead_cx,
  logoUrl, showHours, showRate, showMaint,
}: QuotePDFProps) {
  const billedItems = items.filter(i => !i.gift)
  const giftItems   = items.filter(i => i.gift)
  const baseHours   = billedItems.reduce((a, i) => a + (i.hours ?? 0), 0)
  const giftHours   = giftItems.reduce((a, i) => a + (i.hours ?? 0), 0)
  const pmHours    = Math.round(baseHours * overhead_pm)
  const qaHours    = Math.round(baseHours * overhead_qa)
  const cxHours    = Math.round(baseHours * overhead_cx)
  const totalHours = baseHours + pmHours + qaHours + cxHours + giftHours

  const date = new Date(created_at ?? Date.now()).toLocaleDateString('es-ES', {
    day: '2-digit', month: 'long', year: 'numeric',
  })

  const fmt = (n: number) => fmtCurrency(n, currency)

  return (
    <Document title={title} author="nexdevp" subject="Propuesta de proyecto">
      <Page size="A4" style={s.page}>

        {/* Header */}
        <View style={s.header}>
          <View>
            <Image style={s.logo} src={logoUrl} />
            <Text style={s.tagline}>INGENIERÍA DE SOFTWARE &amp; IA</Text>
          </View>
          <View>
            <Text style={s.docLabel}>PRESUPUESTO</Text>
            <Text style={s.docId}>#{id.slice(0, 8).toUpperCase()}</Text>
            <Text style={s.docDate}>{date}</Text>
          </View>
        </View>

        <View style={s.divider} />

        {/* Title */}
        <View style={{ marginBottom: 28 }}>
          <Text style={s.titleText}>{title}</Text>
          <Text style={s.meta}>{tipo}  ·  {product}  ·  {REGION_LABEL[region] ?? region}</Text>
        </View>

        {/* Line items */}
        <View style={s.section}>
          <Text style={s.sectionHd}>FASES / FUNCIONALIDADES</Text>
          <View style={s.tableHdRow}>
            <Text style={s.colNameHd}>DESCRIPCIÓN</Text>
            {showHours && <Text style={s.colHrsHd}>HORAS</Text>}
          </View>
          {billedItems.map((item, idx) => (
            <View key={idx}>
              <View style={s.tableRow}>
                <Text style={s.colName}>{item.name}</Text>
                {showHours && <Text style={s.colHrs}>{item.hours ?? 0}h</Text>}
              </View>
              {(item.parts ?? []).length > 0 && item.parts!.map((part, pi) => (
                <View key={pi} style={s.partRow}>
                  <Text style={s.partBullet}>•  </Text>
                  <Text style={s.partText}>{part}</Text>
                </View>
              ))}
            </View>
          ))}
          {giftItems.length > 0 && (
            <>
              <View style={{ ...s.tableRow, marginTop: 6 }}>
                <Text style={{ ...s.colNameHd, color: BRAND }}>INCLUIDO SIN CARGO</Text>
                {showHours && <Text style={s.colHrsHd} />}
              </View>
              {giftItems.map((item, idx) => (
                <View key={`g${idx}`} style={{ ...s.tableRow, opacity: 0.8 }}>
                  <Text style={{ ...s.colName, color: BRAND }}>{item.name}</Text>
                  {showHours && <Text style={{ ...s.colHrs, color: BRAND }}>Incluido</Text>}
                </View>
              ))}
            </>
          )}
        </View>

        {/* Overhead — only when showHours is true */}
        {showHours && (
          <View style={s.section}>
            <Text style={s.sectionHd}>DESGLOSE DE HORAS</Text>
            {[
              { label: 'Subtotal funcionalidades',                                val: `${baseHours}h` },
              { label: `Gestión de proyecto (${Math.round(overhead_pm * 100)}%)`, val: `${pmHours}h`  },
              { label: `Testing / QA (${Math.round(overhead_qa * 100)}%)`,        val: `${qaHours}h`  },
              { label: `Contingencia (${Math.round(overhead_cx * 100)}%)`,        val: `${cxHours}h`  },
            ].map(row => (
              <View key={row.label} style={s.ohRow}>
                <Text style={s.ohLabel}>{row.label}</Text>
                <Text style={s.ohValue}>{row.val}</Text>
              </View>
            ))}
            {giftHours > 0 && (
              <View style={s.ohRow}>
                <Text style={{ ...s.ohLabel, color: BRAND }}>Funcionalidades de regalo</Text>
                <Text style={{ ...s.ohValue, color: BRAND }}>{giftHours}h</Text>
              </View>
            )}
            <View style={s.totalRow}>
              <Text style={s.totalLabel}>Total horas del proyecto</Text>
              <Text style={s.totalValue}>{totalHours}h</Text>
            </View>
          </View>
        )}

        {/* Invoice-style price summary */}
        <View style={{ ...s.section, borderWidth: 1, borderColor: BORDER, borderRadius: 8, padding: 16 }}>
          <Text style={{ ...s.sectionHd, marginBottom: 12 }}>RESUMEN DE INVERSIÓN</Text>

          <View style={s.ohRow}>
            <Text style={s.ohLabel}>Precio base calculado</Text>
            <Text style={s.ohValue}>{fmt(total_price + special_discount)}</Text>
          </View>

          {special_discount > 0 && (
            <View style={s.ohRow}>
              <Text style={{ ...s.ohLabel, color: BRAND }}>Descuento aplicado</Text>
              <Text style={{ ...s.ohValue, color: BRAND }}>- {fmt(special_discount)}</Text>
            </View>
          )}

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: BORDER, marginTop: 6, paddingTop: 10 }}>
            <Text style={{ fontSize: 12, color: DARK, fontFamily: 'Helvetica-Bold' }}>INVERSIÓN TOTAL</Text>
            <Text style={{ fontSize: 14, color: BRAND, fontFamily: 'Helvetica-Bold' }}>{fmt(total_price)}</Text>
          </View>
        </View>

        {/* Secondary info row */}
        {(showMaint || showRate) && (
          <View style={{ ...s.cards, marginBottom: 24 }}>
            {showMaint && (
              <View style={s.cardSec}>
                <Text style={s.cardLabel}>MANTENIMIENTO / MES</Text>
                <Text style={s.cardSecV}>{fmt(maint_month)}</Text>
              </View>
            )}
            {showRate && (
              <View style={s.cardSec}>
                <Text style={s.cardLabel}>TARIFA HORA</Text>
                <Text style={s.cardSecV}>{fmt(hourly_rate)}/h</Text>
              </View>
            )}
          </View>
        )}

        {/* Notes */}
        {notes && (
          <View style={s.section}>
            <Text style={s.sectionHd}>NOTAS</Text>
            <View style={s.notesBox}>
              <Text style={s.notesText}>{notes}</Text>
            </View>
          </View>
        )}

        {/* Footer */}
        <View style={s.footer} fixed>
          <Text style={s.footerL}>nexdevp — Ingeniería de Software &amp; IA</Text>
          <Text style={s.footerR}>Este documento es una estimación referencial.</Text>
        </View>

      </Page>
    </Document>
  )
}

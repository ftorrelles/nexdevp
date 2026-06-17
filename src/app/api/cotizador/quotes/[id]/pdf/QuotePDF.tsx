import React from 'react'
import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer'

const BRAND = '#00E472'
const DARK  = '#1A1A1A'
const MID   = '#2A2A2A'
const GREY  = '#888888'
const WHITE = '#FFFFFF'

const s = StyleSheet.create({
  page:      { backgroundColor: DARK, color: WHITE, fontFamily: 'Helvetica', padding: '40pt 44pt' },
  header:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 },
  brand:     { fontSize: 20, color: BRAND, fontFamily: 'Helvetica-Bold', letterSpacing: 1 },
  tagline:   { fontSize: 8, color: GREY, marginTop: 3, letterSpacing: 2 },
  docLabel:  { fontSize: 8, color: GREY, letterSpacing: 2, textAlign: 'right' },
  docId:     { fontSize: 10, color: WHITE, marginTop: 4, textAlign: 'right', fontFamily: 'Helvetica-Bold' },
  docDate:   { fontSize: 8, color: GREY, marginTop: 2, textAlign: 'right' },
  divider:   { borderBottomWidth: 1, borderBottomColor: '#333333', marginBottom: 24 },
  titleText: { fontSize: 18, color: WHITE, fontFamily: 'Helvetica-Bold', marginBottom: 6 },
  meta:      { fontSize: 9, color: GREY, letterSpacing: 0.5 },
  sectionHd: { fontSize: 7, color: BRAND, letterSpacing: 2, marginBottom: 8, fontFamily: 'Helvetica-Bold' },
  section:   { marginBottom: 24 },
  tableHdRow:{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#333333', paddingBottom: 6, marginBottom: 2 },
  tableRow:  { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#2D2D2D', paddingVertical: 7 },
  colName:   { flex: 1, fontSize: 9, color: WHITE },
  colNameHd: { flex: 1, fontSize: 7, color: GREY, letterSpacing: 1 },
  logo:      { width: 120, height: 32, objectFit: 'contain' },
  colHrs:    { width: 40, fontSize: 9, color: WHITE, textAlign: 'right', fontFamily: 'Helvetica-Bold' },
  colHrsHd:  { width: 40, fontSize: 7, color: GREY, letterSpacing: 1, textAlign: 'right' },
  ohRow:     { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: '#222222' },
  ohLabel:   { fontSize: 9, color: GREY },
  ohValue:   { fontSize: 9, color: WHITE, fontFamily: 'Helvetica-Bold' },
  totalRow:  { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 8 },
  totalLabel:{ fontSize: 10, color: WHITE, fontFamily: 'Helvetica-Bold' },
  totalValue:{ fontSize: 10, color: BRAND, fontFamily: 'Helvetica-Bold' },
  cards:     { flexDirection: 'row', gap: 12, marginBottom: 24 },
  cardMain:  { flex: 1, backgroundColor: '#1E1E1E', borderWidth: 1, borderColor: '#333333', borderRadius: 8, padding: 14 },
  cardSec:   { flex: 1, backgroundColor: MID, borderWidth: 1, borderColor: '#333333', borderRadius: 8, padding: 14 },
  cardLabel: { fontSize: 7, color: GREY, letterSpacing: 1.5, marginBottom: 6 },
  cardMainV: { fontSize: 20, color: BRAND, fontFamily: 'Helvetica-Bold' },
  cardSecV:  { fontSize: 16, color: WHITE, fontFamily: 'Helvetica-Bold' },
  notesBox:  { backgroundColor: MID, borderRadius: 6, padding: 12 },
  notesText: { fontSize: 9, color: GREY, lineHeight: 1.5 },
  footer:    { position: 'absolute', bottom: 28, left: 44, right: 44, flexDirection: 'row', justifyContent: 'space-between' },
  footerL:   { fontSize: 7, color: '#555555' },
  footerR:   { fontSize: 7, color: '#555555' },
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
  id:          string
  title:       string
  tipo:        string
  product:     string
  region:      string
  hourly_rate: number
  total_price: number
  maint_month: number
  notes:       string | null
  created_at:  string | null
  items:       Array<{ name: string; size?: string | null; hours?: number | null }>
  currency:    string
  overhead_pm: number
  overhead_qa: number
  overhead_cx: number
  logoUrl:     string
  // Display options
  showHours:   boolean
  showRate:    boolean
}

export function QuotePDF({
  id, title, tipo, product, region, total_price, maint_month, hourly_rate,
  notes, created_at, items, currency, overhead_pm, overhead_qa, overhead_cx,
  logoUrl, showHours, showRate,
}: QuotePDFProps) {
  const baseHours  = items.reduce((a, i) => a + (i.hours ?? 0), 0)
  const pmHours    = Math.round(baseHours * overhead_pm)
  const qaHours    = Math.round(baseHours * overhead_qa)
  const cxHours    = Math.round(baseHours * overhead_cx)
  const totalHours = baseHours + pmHours + qaHours + cxHours

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
          {items.map((item, idx) => (
            <View key={idx} style={s.tableRow}>
              <Text style={s.colName}>{item.name}</Text>
              {showHours && <Text style={s.colHrs}>{item.hours ?? 0}h</Text>}
            </View>
          ))}
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
            <View style={s.totalRow}>
              <Text style={s.totalLabel}>Total horas estimadas</Text>
              <Text style={s.totalValue}>{totalHours}h</Text>
            </View>
          </View>
        )}

        {/* Price cards */}
        <View style={s.cards}>
          <View style={s.cardMain}>
            <Text style={s.cardLabel}>INVERSIÓN DEL PROYECTO</Text>
            <Text style={s.cardMainV}>{fmt(total_price)}</Text>
          </View>
          <View style={s.cardSec}>
            <Text style={s.cardLabel}>MANTENIMIENTO / MES</Text>
            <Text style={s.cardSecV}>{fmt(maint_month)}</Text>
          </View>
          {showRate && (
            <View style={s.cardSec}>
              <Text style={s.cardLabel}>TARIFA HORA</Text>
              <Text style={s.cardSecV}>{fmt(hourly_rate)}/h</Text>
            </View>
          )}
        </View>

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

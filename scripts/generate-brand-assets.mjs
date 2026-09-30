// Generates the raster brand assets from public/brand/logo-dark.svg.
//
// logo-dark.svg wraps two base64 PNGs (a grayscale mask and the colour art)
// inside an SVG mask, which makes it ~700 KB. Rendering it once with sharp
// (librsvg) applies that mask and yields a clean transparent-background raster
// that is then resized to the sizes the site actually needs.
//
// Usage: node scripts/generate-brand-assets.mjs
// Requires `sharp` (already present in node_modules through Next.js).

import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const SOURCE_SVG = join(root, 'public', 'brand', 'logo-dark.svg')

// Brand tokens (src/styles/globals.css): nex-black and nex-green.
const BRAND_BLACK = '#191a1b'
const BRAND_GREEN = '#22b561'

// The SVG is 500x500 at 72 dpi; 288 dpi renders it at 2000x2000.
const master = await sharp(SOURCE_SVG, { density: 288 }).png().toBuffer()

async function squarePng(size, { background } = {}) {
  let pipeline = sharp(master).resize(size, size, { kernel: 'lanczos3' })
  if (background) pipeline = pipeline.flatten({ background })
  return pipeline.png({ compressionLevel: 9, palette: false }).toBuffer()
}

async function write(relativePath, buffer) {
  const target = join(root, relativePath)
  await mkdir(dirname(target), { recursive: true })
  await writeFile(target, buffer)
  console.log(`${relativePath}  ${buffer.length} bytes`)
}

// Navbar (40px) and footer (52px) logo, up to 3x density. Transparent.
await write('public/brand/logo-mark.png', await squarePng(192))

// Favicon, Apple touch icon (iOS paints transparency black, so flatten on the
// brand background) and PWA icons referenced by src/app/manifest.ts.
await write('src/app/icon.png', await squarePng(64))
await write('src/app/apple-icon.png', await squarePng(180, { background: BRAND_BLACK }))
await write('public/brand/icon-192.png', await squarePng(192))
await write('public/brand/icon-512.png', await squarePng(512))

// Open Graph / Twitter card, 1200x630, one per locale (copy is XML-escaped).
const OG_COPY = {
  es: { lines: ['Software a medida y', 'automatización con IA'] },
  en: { lines: ['Custom software &amp;', 'AI automation for business'] },
}

for (const [locale, { lines }] of Object.entries(OG_COPY)) {
  const logo = await squarePng(300)
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
      <defs>
        <radialGradient id="glow" cx="0.85" cy="0.1" r="0.7">
          <stop offset="0" stop-color="${BRAND_GREEN}" stop-opacity="0.18"/>
          <stop offset="1" stop-color="${BRAND_GREEN}" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="1200" height="630" fill="${BRAND_BLACK}"/>
      <rect width="1200" height="630" fill="url(#glow)"/>
      <text x="470" y="290" font-family="Jost, 'Segoe UI', Arial, sans-serif" font-size="120" font-weight="700" fill="#ffffff">nexdevp</text>
      <text x="472" y="370" font-family="Jost, 'Segoe UI', Arial, sans-serif" font-size="46" fill="${BRAND_GREEN}">${lines[0]}</text>
      <text x="472" y="430" font-family="Jost, 'Segoe UI', Arial, sans-serif" font-size="46" fill="${BRAND_GREEN}">${lines[1]}</text>
      <text x="472" y="530" font-family="Jost, 'Segoe UI', Arial, sans-serif" font-size="28" fill="#8a8c8b">www.nexdevp.com</text>
    </svg>`
  const card = await sharp(Buffer.from(svg))
    .composite([{ input: logo, left: 110, top: 165 }])
    .png({ compressionLevel: 9 })
    .toBuffer()
  await write(`public/og/og-${locale}.png`, card)
}

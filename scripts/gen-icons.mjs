// Genererer PNG-ikoner fra farvevifte-motivet (samme som public/favicon.svg).
// Kør: npm i --no-save sharp && node scripts/gen-icons.mjs
// Producerer favicon-32, apple-touch-icon, pwa-192/512 og maskable (padded).
import sharp from 'sharp'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PUB = join(__dirname, '..', 'public')

// Fan-deck-motiv (uden ydre <svg>) — genbruges til normal + maskable.
const FAN = `
  <g stroke="#213746" stroke-width="3.5">
    <g transform="rotate(42 38 85)"><rect x="24" y="20" width="28" height="65" rx="7" fill="#B1C9E8"/></g>
    <g transform="rotate(28 38 85)"><rect x="24" y="20" width="28" height="65" rx="7" fill="#7BB8E2"/></g>
    <g transform="rotate(12 38 85)"><rect x="24" y="20" width="28" height="65" rx="7" fill="#3f9ed3"/></g>
    <g transform="rotate(-5 38 85)"><rect x="24" y="20" width="28" height="65" rx="7" fill="#2384b8"/></g>
  </g>
  <g transform="rotate(-5 38 85)"><circle cx="38" cy="75" r="4.5" fill="#213746"/></g>`

// Standard (afrundet firkant, gennemsigtige hjørner)
const svgAny = (px) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${px}" height="${px}">` +
  `<rect x="2" y="2" width="96" height="96" rx="24" fill="#213746"/>${FAN}</svg>`

// Maskable: fuld navy bleed (ingen afrundede hjørner) + motiv skaleret ned i sikker zone
const svgMaskable = (px) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${px}" height="${px}">` +
  `<rect x="0" y="0" width="100" height="100" fill="#213746"/>` +
  `<g transform="translate(50 50) scale(0.78) translate(-50 -50)">${FAN}</g></svg>`

const targets = [
  { file: 'favicon-32.png', svg: svgAny(32), size: 32 },
  { file: 'apple-touch-icon.png', svg: svgAny(180), size: 180 },
  { file: 'pwa-192x192.png', svg: svgAny(192), size: 192 },
  { file: 'pwa-512x512.png', svg: svgAny(512), size: 512 },
  { file: 'pwa-maskable-512x512.png', svg: svgMaskable(512), size: 512 },
]

for (const t of targets) {
  await sharp(Buffer.from(t.svg)).resize(t.size, t.size).png().toFile(join(PUB, t.file))
  console.log('skrev', t.file, `(${t.size}x${t.size})`)
}
console.log('Færdig.')

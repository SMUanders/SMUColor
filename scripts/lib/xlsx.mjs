// Minimal, dependency-fri xlsx-læser til import.
// Læser sharedStrings + et ark og returnerer rækker som {rowNum, cells:{colIndex:value}}.
// Bruger Node's indbyggede zlib til at pakke .xlsx (zip) ud — ingen npm-deps.
import { readFileSync } from 'node:fs'
import { inflateRawSync } from 'node:zlib'

// --- Enkel ZIP-udpakning (kun det vi har brug for) ---
function readZipEntries(buf) {
  const entries = new Map()
  // Find End Of Central Directory
  let eocd = buf.length - 22
  while (eocd >= 0 && buf.readUInt32LE(eocd) !== 0x06054b50) eocd--
  if (eocd < 0) throw new Error('Ugyldig zip: EOCD ikke fundet')
  const cdCount = buf.readUInt16LE(eocd + 10)
  let ptr = buf.readUInt32LE(eocd + 16)
  for (let i = 0; i < cdCount; i++) {
    if (buf.readUInt32LE(ptr) !== 0x02014b50) throw new Error('Ugyldig central directory')
    const method = buf.readUInt16LE(ptr + 10)
    const compSize = buf.readUInt32LE(ptr + 20)
    const nameLen = buf.readUInt16LE(ptr + 28)
    const extraLen = buf.readUInt16LE(ptr + 30)
    const commentLen = buf.readUInt16LE(ptr + 32)
    const localOff = buf.readUInt32LE(ptr + 42)
    const name = buf.toString('utf8', ptr + 46, ptr + 46 + nameLen)
    // Læs local header for at finde data-offset
    const lNameLen = buf.readUInt16LE(localOff + 26)
    const lExtraLen = buf.readUInt16LE(localOff + 28)
    const dataStart = localOff + 30 + lNameLen + lExtraLen
    const comp = buf.subarray(dataStart, dataStart + compSize)
    const data = method === 0 ? comp : inflateRawSync(comp)
    entries.set(name, data)
    ptr += 46 + nameLen + extraLen + commentLen
  }
  return entries
}

function decodeXml(s) {
  return s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n))
    .replace(/&amp;/g, '&')
}

function colToNum(col) {
  let n = 0
  for (const ch of col) n = n * 26 + (ch.charCodeAt(0) - 64)
  return n
}

export function openWorkbook(path) {
  const buf = readFileSync(path)
  const entries = readZipEntries(buf)

  // Shared strings
  const ssXml = entries.has('xl/sharedStrings.xml')
    ? entries.get('xl/sharedStrings.xml').toString('utf8')
    : ''
  const strings = []
  const siRe = /<si>([\s\S]*?)<\/si>/g
  let m
  while ((m = siRe.exec(ssXml))) {
    const tRe = /<t[^>]*>([\s\S]*?)<\/t>/g
    let t
    let txt = ''
    while ((t = tRe.exec(m[1]))) txt += t[1]
    strings.push(decodeXml(txt))
  }

  // Workbook: navn -> rId
  const wbXml = entries.get('xl/workbook.xml').toString('utf8')
  const relsXml = entries.get('xl/_rels/workbook.xml.rels').toString('utf8')
  const relMap = new Map()
  const relRe = /<Relationship[^>]*Id="([^"]+)"[^>]*Target="([^"]+)"[^>]*\/>/g
  let rr
  while ((rr = relRe.exec(relsXml))) relMap.set(rr[1], rr[2].replace(/^\/?xl\//, ''))
  const sheetRe = /<sheet[^>]*name="([^"]+)"[^>]*r:id="([^"]+)"[^>]*\/>/g
  const sheetByName = new Map()
  let sm
  while ((sm = sheetRe.exec(wbXml))) {
    const target = relMap.get(sm[2])
    sheetByName.set(decodeXml(sm[1]), target)
  }

  function readSheet(name) {
    const target = sheetByName.get(name)
    if (!target) throw new Error(`Ark ikke fundet: ${name}`)
    const xml = entries.get(`xl/${target}`).toString('utf8')
    const rows = []
    const rowRe = /<row[^>]*r="(\d+)"[^>]*>([\s\S]*?)<\/row>/g
    let r
    while ((r = rowRe.exec(xml))) {
      const cells = {}
      const cellRe = /<c[^>]*r="([A-Z]+)\d+"([^>]*)>([\s\S]*?)<\/c>/g
      let c
      while ((c = cellRe.exec(r[2]))) {
        const col = colToNum(c[1])
        const type = (c[2].match(/t="([^"]+)"/) || [])[1] || 'n'
        const vM = c[3].match(/<v>([\s\S]*?)<\/v>/)
        let val = ''
        if (type === 's' && vM) val = strings[+vM[1]]
        else if (type === 'inlineStr') {
          const im = c[3].match(/<t[^>]*>([\s\S]*?)<\/t>/)
          val = im ? decodeXml(im[1]) : ''
        } else if (vM) val = vM[1]
        if (val !== '' && val != null) cells[col] = String(val).trim()
      }
      rows.push({ rowNum: +r[1], cells })
    }
    return rows
  }

  return { sheetNames: [...sheetByName.keys()], readSheet }
}

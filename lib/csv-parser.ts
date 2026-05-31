/** CSV parser — handles UTF-8 BOM and quoted fields with newlines/commas */
export function parseCSV(raw: string): string[][] {
  if (raw.charCodeAt(0) === 0xfeff) raw = raw.slice(1) // strip BOM

  const rows: string[][] = []
  let pos = 0
  const n = raw.length

  while (pos < n) {
    const row: string[] = []

    while (pos < n) {
      let field = ''

      if (raw[pos] === '"') {
        pos++ // skip opening "
        while (pos < n) {
          if (raw[pos] === '"' && raw[pos + 1] === '"') {
            field += '"'
            pos += 2
          } else if (raw[pos] === '"') {
            pos++ // skip closing "
            break
          } else {
            field += raw[pos++]
          }
        }
      } else {
        while (pos < n && raw[pos] !== ',' && raw[pos] !== '\r' && raw[pos] !== '\n') {
          field += raw[pos++]
        }
      }

      row.push(field)
      if (pos < n && raw[pos] === ',') pos++
      else break
    }

    if (pos < n && raw[pos] === '\r') pos++
    if (pos < n && raw[pos] === '\n') pos++

    if (row.some((f) => f.trim() !== '')) rows.push(row)
  }

  return rows
}

export interface RawCard {
  front: string
  back: string
  comment: string
  frontLang: string
  backLang: string
}

export function csvToRawCards(rows: string[][]): RawCard[] {
  if (!rows.length) return []
  const first = (rows[0][0] ?? '').toLowerCase().trim()
  const data =
    first === 'fronttext' || first === 'front' || first === 'question' ? rows.slice(1) : rows

  return data
    .filter((r) => r[0]?.trim())
    .map((r) => ({
      front:    (r[0] ?? '').trim(),
      back:     (r[1] ?? '').trim(),
      comment:  (r[2] ?? '').trim(),
      frontLang:(r[3] ?? '').trim(),
      backLang: (r[4] ?? '').trim(),
    }))
}

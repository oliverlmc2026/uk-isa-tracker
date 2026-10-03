/** Parses a pounds-and-pence string into integer pence; null if not a positive amount with ≤2 decimals. */
export function parsePounds(input: string): number | null {
  const match = /^£?\s*(\d+)(?:\.(\d{1,2}))?$/.exec(input.trim().replace(/,/g, ''))
  if (!match) return null
  const pence = Number(match[1]) * 100 + Number((match[2] ?? '').padEnd(2, '0'))
  return pence > 0 ? pence : null
}

export function formatPounds(pence: number): string {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(pence / 100)
}

/** Whole pounds with no pence, for axis labels. */
export function formatPoundsWhole(pence: number): string {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(pence / 100)
}

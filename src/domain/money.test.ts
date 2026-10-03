import { describe, expect, it } from 'vitest'
import { formatPounds, parsePounds } from './money'

describe('parsePounds', () => {
  it('parses pounds and pence into integer pence', () => {
    expect(parsePounds('100')).toBe(10000)
    expect(parsePounds('12.5')).toBe(1250)
    expect(parsePounds('£1,234.56')).toBe(123456)
    expect(parsePounds('0.07')).toBe(7)
  })
  it('rejects zero, negatives, junk and sub-penny precision', () => {
    for (const bad of ['', '0', '0.00', '-5', 'abc', '1.234', '1.', '1e3']) {
      expect(parsePounds(bad)).toBeNull()
    }
  })
})

describe('formatPounds', () => {
  it('formats pence as GBP', () => {
    expect(formatPounds(2_000_000)).toBe('£20,000.00')
    expect(formatPounds(5)).toBe('£0.05')
  })
})

import { describe, expect, it } from 'vitest'
import { DEFAULT_WARNING_THRESHOLD, validateWarningThreshold } from './settings'

describe('validateWarningThreshold', () => {
  it('defaults to 90', () => {
    expect(DEFAULT_WARNING_THRESHOLD).toBe(90)
  })
  it('accepts whole percentages from 1 to 100', () => {
    expect(validateWarningThreshold('75')).toEqual({ ok: true, value: 75 })
    expect(validateWarningThreshold(' 1 ')).toEqual({ ok: true, value: 1 })
    expect(validateWarningThreshold('100%')).toEqual({ ok: true, value: 100 })
  })
  it('rejects empty, non-numeric, fractional and out-of-range input', () => {
    for (const bad of ['', 'abc', '0', '101', '-5', '90.5']) {
      expect(validateWarningThreshold(bad).ok).toBe(false)
    }
  })
})

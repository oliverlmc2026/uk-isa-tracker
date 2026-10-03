import { afterEach, describe, expect, it, vi } from 'vitest'
import { newId } from './id'

describe('newId', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('uses crypto.randomUUID when it is available', () => {
    vi.stubGlobal('crypto', { randomUUID: () => 'uuid-from-crypto' })
    expect(newId()).toBe('uuid-from-crypto')
  })

  it('still returns an id in an insecure context where randomUUID is missing', () => {
    vi.stubGlobal('crypto', {})
    expect(newId()).toMatch(/^[a-z0-9]+-[a-z0-9]+$/)
  })

  it('still returns an id when crypto itself is missing', () => {
    vi.stubGlobal('crypto', undefined)
    expect(newId()).toMatch(/^[a-z0-9]+-[a-z0-9]+$/)
  })

  it('gives distinct ids on the fallback path', () => {
    vi.stubGlobal('crypto', {})
    const ids = new Set(Array.from({ length: 1000 }, newId))
    expect(ids.size).toBe(1000)
  })
})

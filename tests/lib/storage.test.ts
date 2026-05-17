// tests/lib/storage.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { loadStorage, saveStorage, StorageData } from '@/lib/storage'
import { DEFAULT_PREFERENCES, emptyWeekPlan } from '@/lib/types'

const baseData = (): StorageData => ({
  current: emptyWeekPlan(),
  history: [],
  prefs: DEFAULT_PREFERENCES,
  apiKey: '',
  model: 'anthropic/claude-haiku-4.5',
})

describe('saveStorage / loadStorage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('round-trips data through localStorage', () => {
    const data = baseData()
    saveStorage(data)
    const loaded = loadStorage()
    expect(loaded.prefs.dietType).toBe('omnivore')
    expect(loaded.model).toBe('anthropic/claude-haiku-4.5')
  })

  it('returns defaults when localStorage is empty', () => {
    const loaded = loadStorage()
    expect(loaded.history).toEqual([])
    expect(loaded.prefs.familySize).toBe(4)
  })

  it('merges partial data (missing keys get defaults)', () => {
    localStorage.setItem('mmp.apiKey', JSON.stringify('my-key'))
    const loaded = loadStorage()
    expect(loaded.apiKey).toBe('my-key')
    expect(loaded.prefs.dietType).toBe('omnivore')
  })
})

describe('storage quota fallback', () => {
  it('does not throw when localStorage.setItem throws QuotaExceededError', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('QuotaExceededError')
    })
    expect(() => saveStorage(baseData())).not.toThrow()
  })
})

// lib/storage.ts
import { DEFAULT_PREFERENCES, emptyWeekPlan, Preferences, WeekPlan } from '@/lib/types'

export interface StorageData {
  current: WeekPlan
  history: WeekPlan[]
  prefs: Preferences
  apiKey: string
  model: string
  apifyToken: string
}

const KEYS = {
  current: 'mmp.current',
  history: 'mmp.history',
  prefs: 'mmp.prefs',
  apiKey: 'mmp.apiKey',
  model: 'mmp.model',
  apifyToken: 'mmp.apifyToken',
} as const

function safeGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (raw === null) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function safeSet(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // QuotaExceededError or localStorage disabled
  }
}

export function isStorageAvailable(): boolean {
  try {
    const test = '__mmp_test__'
    localStorage.setItem(test, '1')
    localStorage.removeItem(test)
    return true
  } catch {
    return false
  }
}

export function loadStorage(): StorageData {
  return {
    current: safeGet<WeekPlan>(KEYS.current, emptyWeekPlan()),
    history: safeGet<WeekPlan[]>(KEYS.history, []),
    prefs: safeGet<Preferences>(KEYS.prefs, DEFAULT_PREFERENCES),
    apiKey: safeGet<string>(KEYS.apiKey, ''),
    model: safeGet<string>(KEYS.model, 'anthropic/claude-haiku-4.5'),
    apifyToken: safeGet<string>(KEYS.apifyToken, ''),
  }
}

export function saveStorage(data: StorageData): void {
  safeSet(KEYS.current, data.current)
  safeSet(KEYS.history, data.history)
  safeSet(KEYS.prefs, data.prefs)
  safeSet(KEYS.apiKey, data.apiKey)
  safeSet(KEYS.model, data.model)
  safeSet(KEYS.apifyToken, data.apifyToken)
}

export function saveField<K extends keyof StorageData>(key: K, value: StorageData[K]): void {
  safeSet(KEYS[key], value)
}

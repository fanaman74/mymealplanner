// lib/planner-context.tsx
'use client'

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { emptyWeekPlan, DEFAULT_PREFERENCES, Meal, Preferences, Weekday, WEEKDAYS, WeekPlan } from '@/lib/types'
import { hfToMeal, buildHFParams } from '@/lib/hellofresh'
import { isStorageAvailable, loadStorage, saveStorage, StorageData } from '@/lib/storage'

interface PlannerState extends StorageData {
  dayLoading: Record<Weekday, boolean>
  weekLoading: boolean
  storageAvailable: boolean
}

interface PlannerActions {
  setMeal: (day: Weekday, meal: Meal) => void
  clearMeal: (day: Weekday) => void
  clearAll: () => void
  saveSnapshot: () => void
  loadWeek: (plan: WeekPlan) => void
  setPrefs: (prefs: Preferences) => void
  setApiKey: (key: string) => void
  setModel: (model: string) => void
  setApifyToken: (token: string) => void
  randomizeMeal: (day: Weekday) => Promise<void>
  randomizeWeek: () => Promise<void>
}

export type PlannerContextValue = PlannerState & PlannerActions & {
  onError: (msg: string, retryFn?: () => void) => void
  openSettings: () => void
}

const PlannerContext = createContext<PlannerContextValue | null>(null)

export function usePlanner(): PlannerContextValue {
  const ctx = useContext(PlannerContext)
  if (!ctx) throw new Error('usePlanner must be used inside PlannerProvider')
  return ctx
}

interface PlannerProviderProps {
  children: React.ReactNode
  onError: (msg: string, retryFn?: () => void) => void
  openSettings: () => void
}

export function PlannerProvider({ children, onError, openSettings }: PlannerProviderProps) {
  const [state, setState] = useState<PlannerState>(() => {
    const storageAvailable = isStorageAvailable()
    const persisted = storageAvailable ? loadStorage() : {
      current: emptyWeekPlan(),
      history: [],
      prefs: DEFAULT_PREFERENCES,
      apiKey: '',
      model: 'anthropic/claude-haiku-4.5',
      apifyToken: '',
    }
    return {
      ...persisted,
      dayLoading: Object.fromEntries(WEEKDAYS.map(d => [d, false])) as Record<Weekday, boolean>,
      weekLoading: false,
      storageAvailable,
    }
  })

  const prevRef = useRef(state)
  useEffect(() => {
    if (!state.storageAvailable) return
    const prev = prevRef.current
    if (
      state.current !== prev.current ||
      state.history !== prev.history ||
      state.prefs !== prev.prefs ||
      state.apiKey !== prev.apiKey ||
      state.model !== prev.model ||
      state.apifyToken !== prev.apifyToken
    ) {
      saveStorage({ current: state.current, history: state.history, prefs: state.prefs, apiKey: state.apiKey, model: state.model, apifyToken: state.apifyToken })
    }
    prevRef.current = state
  }, [state])

  const setMeal = useCallback((day: Weekday, meal: Meal) => {
    setState(s => ({ ...s, current: { ...s.current, days: { ...s.current.days, [day]: meal } } }))
  }, [])

  const clearMeal = useCallback((day: Weekday) => {
    setState(s => ({ ...s, current: { ...s.current, days: { ...s.current.days, [day]: null } } }))
  }, [])

  const clearAll = useCallback(() => {
    setState(s => ({ ...s, current: emptyWeekPlan() }))
  }, [])

  const saveSnapshot = useCallback(() => {
    setState(s => {
      const snapshot: WeekPlan = {
        ...s.current,
        label: `Week of ${new Date().toLocaleDateString('en-BE')}`,
      }
      const history = [snapshot, ...s.history].slice(0, 20)
      return { ...s, history }
    })
  }, [])

  const loadWeek = useCallback((plan: WeekPlan) => {
    setState(s => ({ ...s, current: plan }))
  }, [])

  const setPrefs = useCallback((prefs: Preferences) => {
    setState(s => ({ ...s, prefs }))
  }, [])

  const setApiKey = useCallback((apiKey: string) => {
    setState(s => ({ ...s, apiKey }))
  }, [])

  const setModel = useCallback((model: string) => {
    setState(s => ({ ...s, model }))
  }, [])

  const setApifyToken = useCallback((apifyToken: string) => {
    setState(s => ({ ...s, apifyToken }))
  }, [])

  async function fetchHFMeals(prefs: Preferences): Promise<Meal[]> {
    const params = buildHFParams({ dietType: prefs.dietType, cuisines: prefs.cuisines })
    const res = await fetch(`/api/hellofresh-meals?${params}`)
    if (!res.ok) throw new Error('HF fetch failed')
    const data = await res.json() as { meals: import('@/app/api/hellofresh-meals/route').HFMeal[] }
    return data.meals.map(hfToMeal)
  }

  const randomizeMeal = useCallback(async (day: Weekday) => {
    const avoid = new Set(
      WEEKDAYS.filter(d => d !== day && state.current.days[d] !== null)
        .map(d => state.current.days[d]!.name.toLowerCase())
    )
    setState(s => ({ ...s, dayLoading: { ...s.dayLoading, [day]: true } }))
    try {
      const meals = await fetchHFMeals(state.prefs)
      const candidates = meals.filter(m => !avoid.has(m.name.toLowerCase()))
      const pick = candidates[Math.floor(Math.random() * candidates.length)]
      if (pick) setMeal(day, { ...pick, id: crypto.randomUUID() })
      else onError('No matching HelloFresh meals found for your preferences.')
    } catch {
      onError('Failed to fetch HelloFresh meals — check your connection.')
    } finally {
      setState(s => ({ ...s, dayLoading: { ...s.dayLoading, [day]: false } }))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.prefs, state.current.days, onError, setMeal])

  const randomizeWeek = useCallback(async () => {
    setState(s => ({ ...s, weekLoading: true }))
    try {
      const meals = await fetchHFMeals(state.prefs)
      // Shuffle and pick 7 unique meals
      const shuffled = [...meals].sort(() => Math.random() - 0.5)
      const picked: Meal[] = []
      const seen = new Set<string>()
      for (const m of shuffled) {
        if (!seen.has(m.name.toLowerCase())) {
          seen.add(m.name.toLowerCase())
          picked.push({ ...m, id: crypto.randomUUID() })
          if (picked.length === 7) break
        }
      }
      // Pad with remaining shuffled meals (cycling) if fewer than 7 unique
      let padIdx = 0
      while (picked.length < 7) {
        picked.push({ ...shuffled[padIdx % shuffled.length], id: crypto.randomUUID() })
        padIdx++
      }
      const days = Object.fromEntries(WEEKDAYS.map((d, i) => [d, picked[i]])) as Record<Weekday, Meal>
      setState(s => ({ ...s, current: { ...s.current, days } }))
    } catch {
      onError('Failed to fetch HelloFresh meals — check your connection.')
    } finally {
      setState(s => ({ ...s, weekLoading: false }))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.prefs, onError])

  const value: PlannerContextValue = {
    ...state,
    setMeal, clearMeal, clearAll, saveSnapshot, loadWeek,
    setPrefs, setApiKey, setModel, setApifyToken,
    randomizeMeal, randomizeWeek,
    onError, openSettings,
  }

  return <PlannerContext.Provider value={value}>{children}</PlannerContext.Provider>
}

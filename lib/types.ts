// lib/types.ts

export type Weekday = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun'

export const WEEKDAYS: Weekday[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']

export const WEEKDAY_LABELS: Record<Weekday, string> = {
  mon: 'Monday',
  tue: 'Tuesday',
  wed: 'Wednesday',
  thu: 'Thursday',
  fri: 'Friday',
  sat: 'Saturday',
  sun: 'Sunday',
}

export type Unit = 'g' | 'kg' | 'ml' | 'l' | 'pcs' | 'tbsp' | 'tsp' | 'cup'

export const UNITS: Unit[] = ['g', 'kg', 'ml', 'l', 'pcs', 'tbsp', 'tsp', 'cup']

export interface Ingredient {
  name: string
  quantity: number
  unit: Unit
}

export interface Meal {
  id: string
  name: string
  ingredients: Ingredient[]
  prepTime?: string
  cuisine?: string
  imageUrl?: string
  steps?: string[]
}

export type DietType = 'omnivore' | 'vegetarian' | 'pescatarian' | 'vegan'

export interface Preferences {
  dietType: DietType
  cuisines: string[]
  dislikes: string[]
  allergies: string[]
  weeklyBudget?: number
  familySize: number
  notes: string
}

export const DEFAULT_PREFERENCES: Preferences = {
  dietType: 'omnivore',
  cuisines: ['Belgian', 'Italian', 'Asian'],
  dislikes: [],
  allergies: [],
  weeklyBudget: undefined,
  familySize: 4,
  notes: '',
}

export interface WeekPlan {
  id: string
  createdAt: string
  label?: string
  days: Record<Weekday, Meal | null>
}

export function emptyWeekPlan(): WeekPlan {
  return {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    days: {
      mon: null, tue: null, wed: null, thu: null,
      fri: null, sat: null, sun: null,
    },
  }
}

export interface ShoppingListItem {
  name: string
  quantity: number
  unit: Unit
}

export interface ShoppingListCategory {
  name: string
  items: ShoppingListItem[]
}

export interface ShoppingList {
  categories: ShoppingListCategory[]
  generatedAt: string
}

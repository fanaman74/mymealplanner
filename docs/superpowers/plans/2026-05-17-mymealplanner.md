# MyMealPlanner Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Next.js dinner-meal planner for a Belgian family of 4 that generates weekly meals via OpenRouter LLM, lets users edit them, and produces a grouped/deduplicated shopping list with export and print.

**Architecture:** Single Next.js 15 App Router page (`/`) with client state in React context mirrored to localStorage. Two thin API routes proxy OpenRouter server-side. All business logic (ingredient normalization, unit merging, categorization) lives in pure `lib/` functions with full Vitest test coverage.

**Tech Stack:** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, Zod, Vitest, React Testing Library, lucide-react.

---

## File Map

| File | Responsibility |
|------|---------------|
| `lib/types.ts` | All shared TypeScript types |
| `lib/storage.ts` | localStorage read/write with in-memory fallback |
| `lib/ingredients.ts` | Normalize names, merge units, categorize, build ShoppingList |
| `lib/prompts.ts` | Build system + user prompts for OpenRouter |
| `lib/schemas.ts` | Zod schemas for LLM response validation |
| `lib/planner-context.tsx` | React context + `usePlanner` hook + async actions |
| `app/api/generate-meal/route.ts` | Proxy: 1 meal from OpenRouter |
| `app/api/generate-week/route.ts` | Proxy: 7 meals from OpenRouter |
| `app/layout.tsx` | Root layout, wraps with PlannerProvider |
| `app/page.tsx` | Main planner page |
| `app/print/page.tsx` | Print-friendly plan + shopping list |
| `app/globals.css` | Tailwind base + print CSS |
| `components/WeekGrid.tsx` | 7-column responsive grid |
| `components/MealCard.tsx` | Single day dinner slot |
| `components/EditMealModal.tsx` | Edit name + ingredients |
| `components/PreferencesPanel.tsx` | Slide-over prefs editor |
| `components/ShoppingListModal.tsx` | Aggregated list + export actions |
| `components/HistoryDrawer.tsx` | Past week list + load action |
| `components/SettingsModal.tsx` | API key + model picker |
| `components/Toast.tsx` | Lightweight toast stack |
| `tests/lib/ingredients.test.ts` | Unit tests for ingredients.ts |
| `tests/lib/storage.test.ts` | Unit tests for storage.ts |
| `tests/lib/prompts.test.ts` | Unit tests for prompts.ts |
| `tests/components/MealCard.test.tsx` | RTL tests for MealCard |
| `tests/components/EditMealModal.test.tsx` | RTL tests for EditMealModal |
| `tests/components/ShoppingListModal.test.tsx` | RTL tests for ShoppingListModal |
| `tests/setup.ts` | @testing-library/jest-dom import |

---

## Task 1: Scaffold Next.js project

**Files:**
- Create: `package.json`, `next.config.ts`, `tsconfig.json`, `tailwind.config.ts`, `app/layout.tsx`, `app/globals.css`, `app/page.tsx`

- [ ] **Step 1: Read Next.js docs (required — AGENTS.md)**

```bash
ls node_modules/next/dist/docs/ 2>/dev/null || echo "run after scaffold"
```

After scaffold, run: `cat node_modules/next/dist/docs/01-app/01-getting-started/01-installation.md | head -100`

- [ ] **Step 2: Scaffold into existing directory**

```bash
cd /Users/fredanaman/Documents/claudecode/mymealplanner
npx create-next-app@latest . --typescript --tailwind --eslint --app --no-src-dir --import-alias "@/*"
```

When prompted:
- "Would you like to use Turbopack?" → Yes
- "An existing package.json was found" / existing files warning → accept/yes

- [ ] **Step 3: Install additional deps**

```bash
cd /Users/fredanaman/Documents/claudecode/mymealplanner
npm install zod lucide-react
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

- [ ] **Step 4: Verify dev server starts**

```bash
cd /Users/fredanaman/Documents/claudecode/mymealplanner
npm run dev &
sleep 5
curl -s http://localhost:3000 | head -20
kill %1
```

Expected: HTML output containing Next.js app shell.

- [ ] **Step 5: Commit**

```bash
cd /Users/fredanaman/Documents/claudecode/mymealplanner
git add -A
git commit -m "chore: scaffold Next.js 15 project with Tailwind + testing deps"
```

---

## Task 2: Vitest setup

**Files:**
- Create: `vitest.config.ts`, `tests/setup.ts`
- Modify: `package.json` (add test script)

- [ ] **Step 1: Create vitest.config.ts**

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
})
```

- [ ] **Step 2: Create tests/setup.ts**

```ts
// tests/setup.ts
import '@testing-library/jest-dom'
```

- [ ] **Step 3: Add test script to package.json**

In `package.json`, add to `"scripts"`:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 4: Verify Vitest runs**

```bash
cd /Users/fredanaman/Documents/claudecode/mymealplanner
npm test
```

Expected: "No test files found" (zero failures).

- [ ] **Step 5: Commit**

```bash
cd /Users/fredanaman/Documents/claudecode/mymealplanner
git add vitest.config.ts tests/setup.ts package.json
git commit -m "chore: configure Vitest with jsdom and React Testing Library"
```

---

## Task 3: Core types

**Files:**
- Create: `lib/types.ts`

- [ ] **Step 1: Create lib/types.ts**

```ts
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
}

export type DietType = 'omnivore' | 'vegetarian' | 'pescatarian' | 'vegan'
export type BudgetTier = 'low' | 'medium' | 'high'

export interface Preferences {
  dietType: DietType
  cuisines: string[]
  dislikes: string[]
  allergies: string[]
  budgetTier: BudgetTier
  familySize: number
  notes: string
}

export const DEFAULT_PREFERENCES: Preferences = {
  dietType: 'omnivore',
  cuisines: ['Belgian', 'Italian', 'Asian'],
  dislikes: [],
  allergies: [],
  budgetTier: 'medium',
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
```

- [ ] **Step 2: Commit**

```bash
cd /Users/fredanaman/Documents/claudecode/mymealplanner
git add lib/types.ts
git commit -m "feat: add core TypeScript types"
```

---

## Task 4: Storage lib (TDD)

**Files:**
- Create: `lib/storage.ts`, `tests/lib/storage.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
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
```

- [ ] **Step 2: Run to verify failure**

```bash
cd /Users/fredanaman/Documents/claudecode/mymealplanner
npm test tests/lib/storage.test.ts
```

Expected: FAIL — "Cannot find module '@/lib/storage'"

- [ ] **Step 3: Implement lib/storage.ts**

```ts
// lib/storage.ts
import { DEFAULT_PREFERENCES, emptyWeekPlan, Preferences, WeekPlan } from '@/lib/types'

export interface StorageData {
  current: WeekPlan
  history: WeekPlan[]
  prefs: Preferences
  apiKey: string
  model: string
}

const KEYS = {
  current: 'mmp.current',
  history: 'mmp.history',
  prefs: 'mmp.prefs',
  apiKey: 'mmp.apiKey',
  model: 'mmp.model',
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
    // QuotaExceededError or localStorage disabled — caller checks isStorageAvailable
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
  }
}

export function saveStorage(data: StorageData): void {
  safeSet(KEYS.current, data.current)
  safeSet(KEYS.history, data.history)
  safeSet(KEYS.prefs, data.prefs)
  safeSet(KEYS.apiKey, data.apiKey)
  safeSet(KEYS.model, data.model)
}

export function saveField<K extends keyof StorageData>(key: K, value: StorageData[K]): void {
  safeSet(KEYS[key], value)
}
```

- [ ] **Step 4: Run tests to verify pass**

```bash
cd /Users/fredanaman/Documents/claudecode/mymealplanner
npm test tests/lib/storage.test.ts
```

Expected: 4 tests PASS.

- [ ] **Step 5: Commit**

```bash
cd /Users/fredanaman/Documents/claudecode/mymealplanner
git add lib/storage.ts tests/lib/storage.test.ts
git commit -m "feat: storage lib with localStorage wrappers and quota fallback"
```

---

## Task 5: Ingredients lib — normalize (TDD)

**Files:**
- Create: `lib/ingredients.ts`, `tests/lib/ingredients.test.ts`

- [ ] **Step 1: Write failing normalization tests**

```ts
// tests/lib/ingredients.test.ts
import { describe, it, expect } from 'vitest'
import { normalizeIngredientName } from '@/lib/ingredients'

describe('normalizeIngredientName', () => {
  it('lowercases and trims', () => {
    expect(normalizeIngredientName('  Chicken Breast  ')).toBe('chicken breast')
  })

  it('stems plural to singular', () => {
    expect(normalizeIngredientName('tomatoes')).toBe('tomato')
    expect(normalizeIngredientName('onions')).toBe('onion')
    expect(normalizeIngredientName('potatoes')).toBe('potato')
    expect(normalizeIngredientName('carrots')).toBe('carrot')
    expect(normalizeIngredientName('mushrooms')).toBe('mushroom')
    expect(normalizeIngredientName('eggs')).toBe('egg')
  })

  it('preserves unknown multi-word names', () => {
    expect(normalizeIngredientName('Olive Oil')).toBe('olive oil')
  })
})
```

- [ ] **Step 2: Run to verify failure**

```bash
cd /Users/fredanaman/Documents/claudecode/mymealplanner
npm test tests/lib/ingredients.test.ts
```

Expected: FAIL — "Cannot find module"

- [ ] **Step 3: Implement normalizeIngredientName in lib/ingredients.ts**

```ts
// lib/ingredients.ts
import { Ingredient, ShoppingList, ShoppingListCategory, ShoppingListItem, Unit, Weekday, WEEKDAYS, WeekPlan } from '@/lib/types'

const STEM_MAP: Record<string, string> = {
  tomatoes: 'tomato',
  onions: 'onion',
  potatoes: 'potato',
  carrots: 'carrot',
  mushrooms: 'mushroom',
  peppers: 'pepper',
  lemons: 'lemon',
  limes: 'lime',
  oranges: 'orange',
  apples: 'apple',
  eggs: 'egg',
  leeks: 'leek',
  zucchinis: 'zucchini',
  courgettes: 'courgette',
  cucumbers: 'cucumber',
  eggplants: 'eggplant',
  aubergines: 'aubergine',
  shallots: 'shallot',
  cloves: 'clove',
  sprouts: 'sprout',
  beans: 'bean',
  peas: 'pea',
  herbs: 'herb',
  olives: 'olive',
  capers: 'caper',
  anchovies: 'anchovy',
  sardines: 'sardine',
  sausages: 'sausage',
  meatballs: 'meatball',
}

export function normalizeIngredientName(raw: string): string {
  const lower = raw.toLowerCase().trim()
  return STEM_MAP[lower] ?? lower
}
```

- [ ] **Step 4: Run tests to verify pass**

```bash
cd /Users/fredanaman/Documents/claudecode/mymealplanner
npm test tests/lib/ingredients.test.ts
```

Expected: all PASS.

- [ ] **Step 5: Commit**

```bash
cd /Users/fredanaman/Documents/claudecode/mymealplanner
git add lib/ingredients.ts tests/lib/ingredients.test.ts
git commit -m "feat: ingredients normalize with stem map"
```

---

## Task 6: Ingredients lib — unit merging + shopping list (TDD)

**Files:**
- Modify: `lib/ingredients.ts`, `tests/lib/ingredients.test.ts`

- [ ] **Step 1: Add failing tests for unit merging and buildShoppingList**

Append to `tests/lib/ingredients.test.ts`:

```ts
import { buildShoppingList } from '@/lib/ingredients'
import { Ingredient, WeekPlan, emptyWeekPlan } from '@/lib/types'

function makePlan(ingredientSets: Ingredient[][]): WeekPlan {
  const plan = emptyWeekPlan()
  const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const
  ingredientSets.forEach((ingredients, i) => {
    if (days[i]) {
      plan.days[days[i]] = {
        id: `meal-${i}`,
        name: `Meal ${i}`,
        ingredients,
      }
    }
  })
  return plan
}

describe('buildShoppingList — unit merging', () => {
  it('sums same ingredient same unit', () => {
    const plan = makePlan([
      [{ name: 'chicken breast', quantity: 300, unit: 'g' }],
      [{ name: 'chicken breast', quantity: 200, unit: 'g' }],
    ])
    const list = buildShoppingList(plan)
    const meat = list.categories.find(c => c.name === 'meat')!
    const item = meat.items.find(i => i.name === 'chicken breast')!
    expect(item.quantity).toBe(500)
    expect(item.unit).toBe('g')
  })

  it('converts g+kg to kg when total >= 1000g', () => {
    const plan = makePlan([
      [{ name: 'potato', quantity: 800, unit: 'g' }],
      [{ name: 'potato', quantity: 400, unit: 'g' }],
    ])
    const list = buildShoppingList(plan)
    const produce = list.categories.find(c => c.name === 'produce')!
    const item = produce.items.find(i => i.name === 'potato')!
    expect(item.quantity).toBeCloseTo(1.2)
    expect(item.unit).toBe('kg')
  })

  it('keeps conflicting unit families as separate items', () => {
    const plan = makePlan([
      [{ name: 'garlic', quantity: 10, unit: 'g' }],
      [{ name: 'garlic', quantity: 3, unit: 'pcs' }],
    ])
    const list = buildShoppingList(plan)
    const allItems = list.categories.flatMap(c => c.items).filter(i => i.name === 'garlic')
    expect(allItems).toHaveLength(2)
  })

  it('skips null meal slots', () => {
    const plan = emptyWeekPlan() // all null
    const list = buildShoppingList(plan)
    expect(list.categories.flatMap(c => c.items)).toHaveLength(0)
  })

  it('normalizes ingredient names before merging', () => {
    const plan = makePlan([
      [{ name: 'Tomatoes', quantity: 200, unit: 'g' }],
      [{ name: 'tomato', quantity: 100, unit: 'g' }],
    ])
    const list = buildShoppingList(plan)
    const produce = list.categories.find(c => c.name === 'produce')!
    const items = produce.items.filter(i => i.name === 'tomato')
    expect(items).toHaveLength(1)
    expect(items[0].quantity).toBe(300)
  })
})

describe('buildShoppingList — categorization', () => {
  it('puts chicken breast in meat', () => {
    const plan = makePlan([[{ name: 'chicken breast', quantity: 400, unit: 'g' }]])
    const list = buildShoppingList(plan)
    const meat = list.categories.find(c => c.name === 'meat')
    expect(meat?.items.find(i => i.name === 'chicken breast')).toBeDefined()
  })

  it('puts unknown ingredient in other', () => {
    const plan = makePlan([[{ name: 'xylitol syrup', quantity: 1, unit: 'pcs' }]])
    const list = buildShoppingList(plan)
    const other = list.categories.find(c => c.name === 'other')
    expect(other?.items.find(i => i.name === 'xylitol syrup')).toBeDefined()
  })
})
```

- [ ] **Step 2: Run to verify failure**

```bash
cd /Users/fredanaman/Documents/claudecode/mymealplanner
npm test tests/lib/ingredients.test.ts
```

Expected: FAIL — "buildShoppingList is not a function"

- [ ] **Step 3: Implement unit merging and buildShoppingList**

Append to `lib/ingredients.ts`:

```ts
type UnitFamily = 'mass' | 'volume' | 'count' | 'spoon' | 'cup'

const UNIT_FAMILY: Record<Unit, UnitFamily> = {
  g: 'mass', kg: 'mass',
  ml: 'volume', l: 'volume',
  pcs: 'count',
  tsp: 'spoon', tbsp: 'spoon',
  cup: 'cup',
}

// All converted to base unit (g, ml, tsp, cup, pcs)
const TO_BASE: Record<Unit, number> = {
  g: 1, kg: 1000,
  ml: 1, l: 1000,
  tsp: 1, tbsp: 3,
  cup: 1,
  pcs: 1,
}

function toBase(qty: number, unit: Unit): number {
  return qty * TO_BASE[unit]
}

function fromBase(baseQty: number, family: UnitFamily): { quantity: number; unit: Unit } {
  if (family === 'mass') {
    return baseQty >= 1000
      ? { quantity: parseFloat((baseQty / 1000).toFixed(2)), unit: 'kg' }
      : { quantity: parseFloat(baseQty.toFixed(0)), unit: 'g' }
  }
  if (family === 'volume') {
    return baseQty >= 1000
      ? { quantity: parseFloat((baseQty / 1000).toFixed(2)), unit: 'l' }
      : { quantity: parseFloat(baseQty.toFixed(0)), unit: 'ml' }
  }
  if (family === 'spoon') {
    return baseQty % 3 === 0 && baseQty >= 3
      ? { quantity: baseQty / 3, unit: 'tbsp' }
      : { quantity: baseQty, unit: 'tsp' }
  }
  return { quantity: baseQty, unit: family === 'cup' ? 'cup' : 'pcs' }
}

const CATEGORY_MAP: Record<string, string> = {
  // produce
  tomato: 'produce', onion: 'produce', potato: 'produce', carrot: 'produce',
  garlic: 'produce', pepper: 'produce', 'bell pepper': 'produce', leek: 'produce',
  spinach: 'produce', lettuce: 'produce', cucumber: 'produce', zucchini: 'produce',
  courgette: 'produce', eggplant: 'produce', aubergine: 'produce', broccoli: 'produce',
  cauliflower: 'produce', mushroom: 'produce', celery: 'produce', shallot: 'produce',
  parsley: 'produce', basil: 'produce', thyme: 'produce', rosemary: 'produce',
  lemon: 'produce', lime: 'produce', orange: 'produce', apple: 'produce',
  'cherry tomato': 'produce', 'green bean': 'produce', asparagus: 'produce',
  // meat
  'chicken breast': 'meat', 'chicken thigh': 'meat', 'chicken leg': 'meat',
  'ground beef': 'meat', 'minced beef': 'meat', beef: 'meat', pork: 'meat',
  lamb: 'meat', bacon: 'meat', sausage: 'meat', ham: 'meat', turkey: 'meat',
  'pork belly': 'meat', 'beef steak': 'meat', veal: 'meat',
  // fish
  salmon: 'fish', tuna: 'fish', shrimp: 'fish', cod: 'fish', tilapia: 'fish',
  herring: 'fish', mackerel: 'fish', anchovy: 'fish', sardine: 'fish',
  // dairy
  milk: 'dairy', cheese: 'dairy', butter: 'dairy', cream: 'dairy',
  yogurt: 'dairy', egg: 'dairy', 'heavy cream': 'dairy', 'sour cream': 'dairy',
  'cream cheese': 'dairy', mozzarella: 'dairy', parmesan: 'dairy', feta: 'dairy',
  // pantry
  flour: 'pantry', sugar: 'pantry', salt: 'pantry', 'olive oil': 'pantry',
  'vegetable oil': 'pantry', 'sunflower oil': 'pantry', 'black pepper': 'pantry',
  'soy sauce': 'pantry', vinegar: 'pantry', 'tomato paste': 'pantry',
  'canned tomato': 'pantry', 'chicken stock': 'pantry', 'beef stock': 'pantry',
  rice: 'pantry', pasta: 'pantry', bread: 'bakery', 'bread crumb': 'pantry',
  'coconut milk': 'pantry', honey: 'pantry', mustard: 'pantry', ketchup: 'pantry',
  mayonnaise: 'pantry', paprika: 'pantry', cumin: 'pantry', coriander: 'pantry',
  oregano: 'pantry', 'bay leaf': 'pantry', nutmeg: 'pantry',
  // frozen
  'frozen pea': 'frozen', 'frozen corn': 'frozen', 'frozen spinach': 'frozen',
  // bakery
  baguette: 'bakery', croissant: 'bakery',
}

const CATEGORY_ORDER = ['produce', 'meat', 'fish', 'dairy', 'pantry', 'bakery', 'frozen', 'other']

function categorize(name: string): string {
  return CATEGORY_MAP[name] ?? 'other'
}

interface GroupKey { name: string; family: UnitFamily }

export function buildShoppingList(plan: WeekPlan): ShoppingList {
  // Flatten
  const all: Ingredient[] = WEEKDAYS
    .map(d => plan.days[d])
    .filter((m): m is NonNullable<typeof m> => m !== null)
    .flatMap(m => m.ingredients)

  // Normalize names
  const normalized = all.map(i => ({ ...i, name: normalizeIngredientName(i.name) }))

  // Group by name + unit family
  const groups = new Map<string, number>()
  for (const ing of normalized) {
    const family = UNIT_FAMILY[ing.unit]
    const key = `${ing.name}|${family}`
    groups.set(key, (groups.get(key) ?? 0) + toBase(ing.quantity, ing.unit))
  }

  // Convert back and build items
  const items: (ShoppingListItem & { category: string })[] = []
  for (const [key, baseTotal] of groups) {
    const [name, family] = key.split('|') as [string, UnitFamily]
    const { quantity, unit } = fromBase(baseTotal, family)
    items.push({ name, quantity, unit, category: categorize(name) })
  }

  // Group by category
  const byCategory = new Map<string, ShoppingListItem[]>()
  for (const { category, ...item } of items) {
    if (!byCategory.has(category)) byCategory.set(category, [])
    byCategory.get(category)!.push(item)
  }

  // Sort items within categories
  for (const items of byCategory.values()) {
    items.sort((a, b) => a.name.localeCompare(b.name))
  }

  // Build ordered categories
  const categories: ShoppingListCategory[] = CATEGORY_ORDER
    .filter(cat => byCategory.has(cat))
    .map(cat => ({ name: cat, items: byCategory.get(cat)! }))

  return { categories, generatedAt: new Date().toISOString() }
}

export function shoppingListToText(list: ShoppingList): string {
  return list.categories
    .map(cat => {
      const header = cat.name.toUpperCase()
      const rows = cat.items.map(i => `  ${i.name}: ${i.quantity} ${i.unit}`).join('\n')
      return `${header}\n${rows}`
    })
    .join('\n\n')
}

export function shoppingListToCsv(list: ShoppingList): string {
  const rows = ['name,quantity,unit,category']
  for (const cat of list.categories) {
    for (const item of cat.items) {
      rows.push(`"${item.name}",${item.quantity},${item.unit},${cat.name}`)
    }
  }
  return rows.join('\n')
}
```

- [ ] **Step 4: Run tests**

```bash
cd /Users/fredanaman/Documents/claudecode/mymealplanner
npm test tests/lib/ingredients.test.ts
```

Expected: all PASS.

- [ ] **Step 5: Commit**

```bash
cd /Users/fredanaman/Documents/claudecode/mymealplanner
git add lib/ingredients.ts tests/lib/ingredients.test.ts
git commit -m "feat: ingredients unit merging, categorization, shopping list builder"
```

---

## Task 7: Prompts lib (TDD)

**Files:**
- Create: `lib/prompts.ts`, `tests/lib/prompts.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
// tests/lib/prompts.test.ts
import { describe, it, expect } from 'vitest'
import { buildSystemPrompt, buildMealUserPrompt, buildWeekUserPrompt } from '@/lib/prompts'
import { DEFAULT_PREFERENCES } from '@/lib/types'

describe('buildSystemPrompt', () => {
  it('mentions Belgium and JSON', () => {
    const p = buildSystemPrompt()
    expect(p).toContain('Belgian')
    expect(p).toContain('JSON')
  })
})

describe('buildMealUserPrompt', () => {
  it('includes diet type from prefs', () => {
    const p = buildMealUserPrompt({ ...DEFAULT_PREFERENCES, dietType: 'vegetarian' }, [])
    expect(p).toContain('vegetarian')
  })

  it('includes avoid list when provided', () => {
    const p = buildMealUserPrompt(DEFAULT_PREFERENCES, ['Spaghetti Bolognese', 'Moules Frites'])
    expect(p).toContain('Spaghetti Bolognese')
    expect(p).toContain('Moules Frites')
  })

  it('includes JSON schema hint', () => {
    const p = buildMealUserPrompt(DEFAULT_PREFERENCES, [])
    expect(p).toContain('"name"')
    expect(p).toContain('"ingredients"')
  })
})

describe('buildWeekUserPrompt', () => {
  it('requests exactly 7 meals', () => {
    const p = buildWeekUserPrompt(DEFAULT_PREFERENCES)
    expect(p).toContain('7')
  })
})
```

- [ ] **Step 2: Run to verify failure**

```bash
cd /Users/fredanaman/Documents/claudecode/mymealplanner
npm test tests/lib/prompts.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Implement lib/prompts.ts**

```ts
// lib/prompts.ts
import { Preferences } from '@/lib/types'

export function buildSystemPrompt(): string {
  return `You are a Belgian/Flemish family dinner meal planner.
Output ONLY strict JSON — no prose, no markdown, no explanation outside the JSON object.
Ingredient names must be lowercase singular (e.g. "tomato" not "Tomatoes").
Quantities must use metric units (g, kg, ml, l) or pcs/tbsp/tsp/cup.
Meals should suit a family cooking at home in Flanders, Belgium.`
}

export function buildMealUserPrompt(prefs: Preferences, avoid: string[]): string {
  const avoidLine = avoid.length > 0
    ? `Do NOT suggest any of these meals (already in this week's plan): ${avoid.join(', ')}.`
    : ''

  return `Generate 1 dinner meal for a family of ${prefs.familySize} people.
Diet: ${prefs.dietType}.
Preferred cuisines: ${prefs.cuisines.join(', ') || 'any'}.
Dislikes: ${prefs.dislikes.join(', ') || 'none'}.
Allergies: ${prefs.allergies.join(', ') || 'none'}.
Budget tier: ${prefs.budgetTier}.
${prefs.notes ? `Extra notes: ${prefs.notes}` : ''}
${avoidLine}

Return JSON matching this schema exactly:
{
  "name": "string — meal name",
  "prepTime": "string — e.g. '30 min'",
  "cuisine": "string — e.g. 'Belgian'",
  "ingredients": [
    { "name": "string", "quantity": number, "unit": "g|kg|ml|l|pcs|tbsp|tsp|cup" }
  ]
}`
}

export function buildWeekUserPrompt(prefs: Preferences): string {
  return `Generate exactly 7 different dinner meals for a family of ${prefs.familySize} people.
Diet: ${prefs.dietType}.
Preferred cuisines: ${prefs.cuisines.join(', ') || 'any'}.
Dislikes: ${prefs.dislikes.join(', ') || 'none'}.
Allergies: ${prefs.allergies.join(', ') || 'none'}.
Budget tier: ${prefs.budgetTier}.
${prefs.notes ? `Extra notes: ${prefs.notes}` : ''}
Vary cuisines and proteins across the 7 meals. No duplicates.

Return JSON matching this schema exactly:
{
  "meals": [
    {
      "name": "string",
      "prepTime": "string",
      "cuisine": "string",
      "ingredients": [
        { "name": "string", "quantity": number, "unit": "g|kg|ml|l|pcs|tbsp|tsp|cup" }
      ]
    }
  ]
}`
}
```

- [ ] **Step 4: Run tests**

```bash
cd /Users/fredanaman/Documents/claudecode/mymealplanner
npm test tests/lib/prompts.test.ts
```

Expected: all PASS.

- [ ] **Step 5: Commit**

```bash
cd /Users/fredanaman/Documents/claudecode/mymealplanner
git add lib/prompts.ts tests/lib/prompts.test.ts
git commit -m "feat: LLM prompt builders for single meal and full week"
```

---

## Task 8: Zod schemas

**Files:**
- Create: `lib/schemas.ts`

- [ ] **Step 1: Create lib/schemas.ts**

```ts
// lib/schemas.ts
import { z } from 'zod'

const unitSchema = z.enum(['g', 'kg', 'ml', 'l', 'pcs', 'tbsp', 'tsp', 'cup'])

const ingredientSchema = z.object({
  name: z.string().min(1),
  quantity: z.number().positive(),
  unit: unitSchema,
})

const mealSchema = z.object({
  name: z.string().min(1),
  prepTime: z.string().optional(),
  cuisine: z.string().optional(),
  ingredients: z.array(ingredientSchema).min(1),
})

export const singleMealResponseSchema = z.object({
  name: z.string().min(1),
  prepTime: z.string().optional(),
  cuisine: z.string().optional(),
  ingredients: z.array(ingredientSchema).min(1),
})

export const weekMealsResponseSchema = z.object({
  meals: z.array(mealSchema).length(7),
})

export type MealResponse = z.infer<typeof singleMealResponseSchema>
export type WeekMealsResponse = z.infer<typeof weekMealsResponseSchema>
```

- [ ] **Step 2: Commit**

```bash
cd /Users/fredanaman/Documents/claudecode/mymealplanner
git add lib/schemas.ts
git commit -m "feat: Zod schemas for OpenRouter LLM response validation"
```

---

## Task 9: API route — generate-meal

**Files:**
- Create: `app/api/generate-meal/route.ts`

- [ ] **Step 1: Read the local Next.js App Router route handler docs**

```bash
cat /Users/fredanaman/Documents/claudecode/mymealplanner/node_modules/next/dist/docs/01-app/03-building-your-application/01-routing/13-route-handlers.md 2>/dev/null | head -80 || echo "check path"
ls /Users/fredanaman/Documents/claudecode/mymealplanner/node_modules/next/dist/docs/ | head -20
```

- [ ] **Step 2: Create app/api/generate-meal/route.ts**

```ts
// app/api/generate-meal/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { buildSystemPrompt, buildMealUserPrompt } from '@/lib/prompts'
import { singleMealResponseSchema } from '@/lib/schemas'
import { Preferences } from '@/lib/types'

interface RequestBody {
  apiKey: string
  model: string
  prefs: Preferences
  avoid: string[]
}

async function callOpenRouter(
  apiKey: string,
  model: string,
  systemPrompt: string,
  userPrompt: string,
): Promise<string> {
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw Object.assign(new Error(text), { status: res.status })
  }

  const data = await res.json()
  return data.choices?.[0]?.message?.content ?? ''
}

export async function POST(req: NextRequest) {
  let body: RequestBody
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { apiKey, model, prefs, avoid } = body
  if (!apiKey) return NextResponse.json({ error: 'Missing apiKey' }, { status: 400 })
  if (!model) return NextResponse.json({ error: 'Missing model' }, { status: 400 })

  const systemPrompt = buildSystemPrompt()
  const userPrompt = buildMealUserPrompt(prefs, avoid ?? [])

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const raw = await callOpenRouter(apiKey, model, systemPrompt, attempt === 0 ? userPrompt : userPrompt + '\n\nIMPORTANT: Return ONLY the JSON object. No other text.')
      const parsed = JSON.parse(raw)
      const validated = singleMealResponseSchema.parse(parsed)
      const meal = { ...validated, id: crypto.randomUUID() }
      return NextResponse.json({ meal })
    } catch (err: unknown) {
      const isStatusError = err instanceof Error && 'status' in err
      if (isStatusError) {
        const status = (err as Error & { status: number }).status
        if (status === 401) return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })
        if (status === 429) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
        return NextResponse.json({ error: 'OpenRouter error' }, { status: 502 })
      }
      // JSON parse or Zod error — retry on attempt 0
      if (attempt === 1) {
        return NextResponse.json({ error: 'LLM returned invalid response' }, { status: 502 })
      }
    }
  }

  return NextResponse.json({ error: 'Unexpected error' }, { status: 500 })
}
```

- [ ] **Step 3: Commit**

```bash
cd /Users/fredanaman/Documents/claudecode/mymealplanner
git add app/api/generate-meal/route.ts
git commit -m "feat: API route /api/generate-meal proxying OpenRouter with Zod validation + retry"
```

---

## Task 10: API route — generate-week

**Files:**
- Create: `app/api/generate-week/route.ts`

- [ ] **Step 1: Create app/api/generate-week/route.ts**

```ts
// app/api/generate-week/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { buildSystemPrompt, buildWeekUserPrompt } from '@/lib/prompts'
import { weekMealsResponseSchema } from '@/lib/schemas'
import { Preferences } from '@/lib/types'

interface RequestBody {
  apiKey: string
  model: string
  prefs: Preferences
}

async function callOpenRouter(apiKey: string, model: string, systemPrompt: string, userPrompt: string): Promise<string> {
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw Object.assign(new Error(text), { status: res.status })
  }

  const data = await res.json()
  return data.choices?.[0]?.message?.content ?? ''
}

export async function POST(req: NextRequest) {
  let body: RequestBody
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { apiKey, model, prefs } = body
  if (!apiKey) return NextResponse.json({ error: 'Missing apiKey' }, { status: 400 })

  const systemPrompt = buildSystemPrompt()
  const userPrompt = buildWeekUserPrompt(prefs)

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const raw = await callOpenRouter(apiKey, model, systemPrompt, attempt === 0 ? userPrompt : userPrompt + '\n\nIMPORTANT: Return ONLY the JSON object with a "meals" array of exactly 7 items.')
      const parsed = JSON.parse(raw)
      const validated = weekMealsResponseSchema.parse(parsed)
      const meals = validated.meals.map(m => ({ ...m, id: crypto.randomUUID() }))
      return NextResponse.json({ meals })
    } catch (err: unknown) {
      const isStatusError = err instanceof Error && 'status' in err
      if (isStatusError) {
        const status = (err as Error & { status: number }).status
        if (status === 401) return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })
        if (status === 429) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
        return NextResponse.json({ error: 'OpenRouter error' }, { status: 502 })
      }
      if (attempt === 1) {
        return NextResponse.json({ error: 'LLM returned invalid response' }, { status: 502 })
      }
    }
  }

  return NextResponse.json({ error: 'Unexpected error' }, { status: 500 })
}
```

- [ ] **Step 2: Commit**

```bash
cd /Users/fredanaman/Documents/claudecode/mymealplanner
git add app/api/generate-week/route.ts
git commit -m "feat: API route /api/generate-week proxying OpenRouter"
```

---

## Task 11: Planner context + usePlanner hook

**Files:**
- Create: `lib/planner-context.tsx`

- [ ] **Step 1: Create lib/planner-context.tsx**

```tsx
// lib/planner-context.tsx
'use client'

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { emptyWeekPlan, DEFAULT_PREFERENCES, Meal, Preferences, Weekday, WEEKDAYS, WeekPlan } from '@/lib/types'
import { isStorageAvailable, loadStorage, saveField, saveStorage, StorageData } from '@/lib/storage'

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
    }
    return {
      ...persisted,
      dayLoading: Object.fromEntries(WEEKDAYS.map(d => [d, false])) as Record<Weekday, boolean>,
      weekLoading: false,
      storageAvailable,
    }
  })

  // Persist on state changes
  const prevRef = useRef(state)
  useEffect(() => {
    if (!state.storageAvailable) return
    const prev = prevRef.current
    if (
      state.current !== prev.current ||
      state.history !== prev.history ||
      state.prefs !== prev.prefs ||
      state.apiKey !== prev.apiKey ||
      state.model !== prev.model
    ) {
      saveStorage({ current: state.current, history: state.history, prefs: state.prefs, apiKey: state.apiKey, model: state.model })
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

  const randomizeMeal = useCallback(async (day: Weekday) => {
    if (!state.apiKey) {
      onError('No API key set — please add your OpenRouter key in Settings.')
      openSettings()
      return
    }
    const avoid = WEEKDAYS
      .filter(d => d !== day && state.current.days[d] !== null)
      .map(d => state.current.days[d]!.name)

    setState(s => ({ ...s, dayLoading: { ...s.dayLoading, [day]: true } }))
    try {
      const res = await fetch('/api/generate-meal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: state.apiKey, model: state.model, prefs: state.prefs, avoid }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (res.status === 401) { onError('Invalid API key.'); openSettings(); return }
        onError(data.error ?? 'Failed to generate meal')
        return
      }
      setMeal(day, data.meal)
    } catch {
      onError('Network error — check your connection.')
    } finally {
      setState(s => ({ ...s, dayLoading: { ...s.dayLoading, [day]: false } }))
    }
  }, [state.apiKey, state.model, state.prefs, state.current.days, onError, openSettings, setMeal])

  const randomizeWeek = useCallback(async () => {
    if (!state.apiKey) {
      onError('No API key set — please add your OpenRouter key in Settings.')
      openSettings()
      return
    }
    setState(s => ({ ...s, weekLoading: true }))
    try {
      const res = await fetch('/api/generate-week', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: state.apiKey, model: state.model, prefs: state.prefs }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (res.status === 401) { onError('Invalid API key.'); openSettings(); return }
        onError(data.error ?? 'Failed to generate week')
        return
      }
      const days = Object.fromEntries(WEEKDAYS.map((d, i) => [d, data.meals[i] ?? null])) as Record<Weekday, Meal | null>
      setState(s => ({ ...s, current: { ...s.current, days } }))
    } catch {
      onError('Network error — check your connection.')
    } finally {
      setState(s => ({ ...s, weekLoading: false }))
    }
  }, [state.apiKey, state.model, state.prefs, onError, openSettings])

  const value: PlannerContextValue = {
    ...state,
    setMeal, clearMeal, clearAll, saveSnapshot, loadWeek,
    setPrefs, setApiKey, setModel,
    randomizeMeal, randomizeWeek,
    onError, openSettings,
  }

  return <PlannerContext.Provider value={value}>{children}</PlannerContext.Provider>
}
```

- [ ] **Step 2: Commit**

```bash
cd /Users/fredanaman/Documents/claudecode/mymealplanner
git add lib/planner-context.tsx
git commit -m "feat: PlannerContext with usePlanner hook, async randomize actions, localStorage sync"
```

---

## Task 12: Toast component

**Files:**
- Create: `components/Toast.tsx`

- [ ] **Step 1: Create components/Toast.tsx**

```tsx
// components/Toast.tsx
'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'

export interface ToastMessage {
  id: string
  message: string
  retryFn?: () => void
}

interface ToastProps {
  toasts: ToastMessage[]
  onDismiss: (id: string) => void
}

export function ToastStack({ toasts, onDismiss }: ToastProps) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map(t => (
        <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  )
}

function ToastItem({ toast, onDismiss }: { toast: ToastMessage; onDismiss: (id: string) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), 5000)
    return () => clearTimeout(timer)
  }, [toast.id, onDismiss])

  return (
    <div className="flex items-center gap-3 rounded-lg bg-gray-900 px-4 py-3 text-white shadow-lg max-w-sm">
      <span className="flex-1 text-sm">{toast.message}</span>
      {toast.retryFn && (
        <button
          onClick={toast.retryFn}
          className="text-xs font-medium text-blue-400 hover:text-blue-300 shrink-0"
        >
          Retry
        </button>
      )}
      <button onClick={() => onDismiss(toast.id)} className="shrink-0 text-gray-400 hover:text-white">
        <X size={14} />
      </button>
    </div>
  )
}

export function useToasts() {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const addToast = (message: string, retryFn?: () => void) => {
    const id = crypto.randomUUID()
    setToasts(prev => [...prev, { id, message, retryFn }])
  }

  const dismissToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }

  return { toasts, addToast, dismissToast }
}
```

- [ ] **Step 2: Commit**

```bash
cd /Users/fredanaman/Documents/claudecode/mymealplanner
git add components/Toast.tsx
git commit -m "feat: Toast component with auto-dismiss, retry action, and useToasts hook"
```

---

## Task 13: SettingsModal

**Files:**
- Create: `components/SettingsModal.tsx`

- [ ] **Step 1: Create components/SettingsModal.tsx**

```tsx
// components/SettingsModal.tsx
'use client'

import { useState } from 'react'
import { X, Eye, EyeOff } from 'lucide-react'
import { usePlanner } from '@/lib/planner-context'

const SUGGESTED_MODELS = [
  'anthropic/claude-haiku-4.5',
  'anthropic/claude-sonnet-4-6',
  'openai/gpt-4o-mini',
  'google/gemini-flash-1.5',
  'mistralai/mistral-7b-instruct',
]

interface SettingsModalProps {
  open: boolean
  onClose: () => void
}

export function SettingsModal({ open, onClose }: SettingsModalProps) {
  const { apiKey, model, setApiKey, setModel } = usePlanner()
  const [localKey, setLocalKey] = useState(apiKey)
  const [localModel, setLocalModel] = useState(model)
  const [showKey, setShowKey] = useState(false)

  if (!open) return null

  function handleSave() {
    setApiKey(localKey.trim())
    setModel(localModel.trim())
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Settings</h2>
          <button onClick={onClose}><X size={20} /></button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              OpenRouter API Key
            </label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={localKey}
                onChange={e => setLocalKey(e.target.value)}
                placeholder="sk-or-..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowKey(v => !v)}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
              >
                {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Your key is stored only in your browser's localStorage.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Model
            </label>
            <input
              type="text"
              value={localModel}
              onChange={e => setLocalModel(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="mt-2 flex flex-wrap gap-1">
              {SUGGESTED_MODELS.map(m => (
                <button
                  key={m}
                  onClick={() => setLocalModel(m)}
                  className={`rounded px-2 py-0.5 text-xs ${
                    localModel === m
                      ? 'bg-blue-100 text-blue-700 font-medium'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {m.split('/')[1]}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
cd /Users/fredanaman/Documents/claudecode/mymealplanner
git add components/SettingsModal.tsx
git commit -m "feat: SettingsModal for OpenRouter API key and model selection"
```

---

## Task 14: PreferencesPanel

**Files:**
- Create: `components/PreferencesPanel.tsx`

- [ ] **Step 1: Create components/PreferencesPanel.tsx**

```tsx
// components/PreferencesPanel.tsx
'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { usePlanner } from '@/lib/planner-context'
import { DEFAULT_PREFERENCES, DietType, BudgetTier, Preferences } from '@/lib/types'

const DIET_OPTIONS: { value: DietType; label: string }[] = [
  { value: 'omnivore', label: 'Omnivore' },
  { value: 'vegetarian', label: 'Vegetarian' },
  { value: 'pescatarian', label: 'Pescatarian' },
  { value: 'vegan', label: 'Vegan' },
]

const BUDGET_OPTIONS: { value: BudgetTier; label: string }[] = [
  { value: 'low', label: 'Budget' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High-end' },
]

const CUISINE_OPTIONS = [
  'Belgian', 'Italian', 'French', 'Spanish', 'Greek', 'Turkish',
  'Asian', 'Japanese', 'Thai', 'Indian', 'Mexican', 'American',
]

interface PrefsPanelProps {
  open: boolean
  onClose: () => void
}

export function PreferencesPanel({ open, onClose }: PrefsPanelProps) {
  const { prefs, setPrefs } = usePlanner()
  const [local, setLocal] = useState<Preferences>(prefs)
  const [dislikeInput, setDislikeInput] = useState(prefs.dislikes.join(', '))
  const [allergyInput, setAllergyInput] = useState(prefs.allergies.join(', '))

  if (!open) return null

  function toggleCuisine(c: string) {
    setLocal(p => ({
      ...p,
      cuisines: p.cuisines.includes(c)
        ? p.cuisines.filter(x => x !== c)
        : [...p.cuisines, c],
    }))
  }

  function handleSave() {
    setPrefs({
      ...local,
      dislikes: dislikeInput.split(',').map(s => s.trim()).filter(Boolean),
      allergies: allergyInput.split(',').map(s => s.trim()).filter(Boolean),
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-sm overflow-y-auto bg-white p-6 shadow-xl h-full">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Preferences</h2>
          <button onClick={onClose}><X size={20} /></button>
        </div>

        <div className="space-y-5">
          {/* Diet */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Diet</p>
            <div className="flex flex-wrap gap-2">
              {DIET_OPTIONS.map(o => (
                <button
                  key={o.value}
                  onClick={() => setLocal(p => ({ ...p, dietType: o.value }))}
                  className={`rounded-full px-3 py-1 text-sm ${
                    local.dietType === o.value
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          {/* Cuisines */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Cuisines</p>
            <div className="flex flex-wrap gap-2">
              {CUISINE_OPTIONS.map(c => (
                <button
                  key={c}
                  onClick={() => toggleCuisine(c)}
                  className={`rounded-full px-3 py-1 text-sm ${
                    local.cuisines.includes(c)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Dislikes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Dislikes</label>
            <input
              type="text"
              value={dislikeInput}
              onChange={e => setDislikeInput(e.target.value)}
              placeholder="mushrooms, eggplant, ..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="mt-1 text-xs text-gray-500">Comma-separated.</p>
          </div>

          {/* Allergies */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Allergies</label>
            <input
              type="text"
              value={allergyInput}
              onChange={e => setAllergyInput(e.target.value)}
              placeholder="nuts, gluten, ..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Budget */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Budget</p>
            <div className="flex gap-2">
              {BUDGET_OPTIONS.map(o => (
                <button
                  key={o.value}
                  onClick={() => setLocal(p => ({ ...p, budgetTier: o.value }))}
                  className={`rounded-full px-3 py-1 text-sm ${
                    local.budgetTier === o.value
                      ? 'bg-amber-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          {/* Family size */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Family size</label>
            <input
              type="number"
              min={1}
              max={12}
              value={local.familySize}
              onChange={e => setLocal(p => ({ ...p, familySize: parseInt(e.target.value) || 4 }))}
              className="w-20 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={local.notes}
              onChange={e => setLocal(p => ({ ...p, notes: e.target.value }))}
              rows={3}
              placeholder="We prefer quick meals on weekdays, ..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="mt-6 flex gap-2">
          <button
            onClick={() => setLocal(DEFAULT_PREFERENCES)}
            className="flex-1 rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 border"
          >
            Reset
          </button>
          <button
            onClick={handleSave}
            className="flex-1 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
cd /Users/fredanaman/Documents/claudecode/mymealplanner
git add components/PreferencesPanel.tsx
git commit -m "feat: PreferencesPanel slide-over with diet, cuisines, dislikes, allergies, budget"
```

---

## Task 15: MealCard component (TDD)

**Files:**
- Create: `components/MealCard.tsx`, `tests/components/MealCard.test.tsx`

- [ ] **Step 1: Write failing tests**

```tsx
// tests/components/MealCard.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MealCard } from '@/components/MealCard'
import { Meal, Weekday } from '@/lib/types'

const mockMeal: Meal = {
  id: 'test-id',
  name: 'Stoofvlees',
  ingredients: [
    { name: 'beef', quantity: 500, unit: 'g' },
    { name: 'onion', quantity: 2, unit: 'pcs' },
  ],
  prepTime: '120 min',
  cuisine: 'Belgian',
}

const defaultProps = {
  day: 'mon' as Weekday,
  meal: null as Meal | null,
  loading: false,
  weekLoading: false,
  onRandomize: vi.fn(),
  onEdit: vi.fn(),
}

describe('MealCard', () => {
  it('shows empty state when no meal', () => {
    render(<MealCard {...defaultProps} />)
    expect(screen.getByText(/no meal/i)).toBeInTheDocument()
  })

  it('shows meal name when meal provided', () => {
    render(<MealCard {...defaultProps} meal={mockMeal} />)
    expect(screen.getByText('Stoofvlees')).toBeInTheDocument()
  })

  it('shows ingredients', () => {
    render(<MealCard {...defaultProps} meal={mockMeal} />)
    expect(screen.getByText(/beef/i)).toBeInTheDocument()
    expect(screen.getByText(/onion/i)).toBeInTheDocument()
  })

  it('calls onRandomize when randomize button clicked', () => {
    const onRandomize = vi.fn()
    render(<MealCard {...defaultProps} onRandomize={onRandomize} />)
    fireEvent.click(screen.getByRole('button', { name: /randomize/i }))
    expect(onRandomize).toHaveBeenCalledWith('mon')
  })

  it('calls onEdit when edit button clicked', () => {
    const onEdit = vi.fn()
    render(<MealCard {...defaultProps} meal={mockMeal} onEdit={onEdit} />)
    fireEvent.click(screen.getByRole('button', { name: /edit/i }))
    expect(onEdit).toHaveBeenCalledWith('mon', mockMeal)
  })

  it('shows loading skeleton when loading', () => {
    render(<MealCard {...defaultProps} loading={true} />)
    expect(screen.getByTestId('meal-skeleton')).toBeInTheDocument()
  })

  it('disables randomize button during weekLoading', () => {
    render(<MealCard {...defaultProps} weekLoading={true} />)
    expect(screen.getByRole('button', { name: /randomize/i })).toBeDisabled()
  })
})
```

- [ ] **Step 2: Run to verify failure**

```bash
cd /Users/fredanaman/Documents/claudecode/mymealplanner
npm test tests/components/MealCard.test.tsx
```

Expected: FAIL.

- [ ] **Step 3: Implement components/MealCard.tsx**

```tsx
// components/MealCard.tsx
'use client'

import { Dices, Pencil } from 'lucide-react'
import { Meal, Weekday, WEEKDAY_LABELS } from '@/lib/types'

interface MealCardProps {
  day: Weekday
  meal: Meal | null
  loading: boolean
  weekLoading: boolean
  onRandomize: (day: Weekday) => void
  onEdit: (day: Weekday, meal: Meal) => void
}

export function MealCard({ day, meal, loading, weekLoading, onRandomize, onEdit }: MealCardProps) {
  const disabled = loading || weekLoading

  return (
    <div className="flex flex-col rounded-xl border border-gray-200 bg-white p-4 shadow-sm min-h-[200px]">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">
        {WEEKDAY_LABELS[day]}
      </p>

      {loading ? (
        <div data-testid="meal-skeleton" className="flex-1 space-y-2 animate-pulse">
          <div className="h-5 rounded bg-gray-200 w-3/4" />
          <div className="h-3 rounded bg-gray-100 w-1/2" />
          <div className="h-3 rounded bg-gray-100 w-2/3" />
          <div className="h-3 rounded bg-gray-100 w-1/2" />
        </div>
      ) : meal ? (
        <div className="flex-1 flex flex-col">
          <h3 className="font-semibold text-gray-900 text-base leading-snug">{meal.name}</h3>
          {(meal.prepTime || meal.cuisine) && (
            <p className="mt-0.5 text-xs text-gray-400">
              {[meal.cuisine, meal.prepTime].filter(Boolean).join(' · ')}
            </p>
          )}
          <ul className="mt-2 flex-1 space-y-0.5">
            {meal.ingredients.slice(0, 5).map((ing, i) => (
              <li key={i} className="text-xs text-gray-600">
                • {ing.quantity} {ing.unit} {ing.name}
              </li>
            ))}
            {meal.ingredients.length > 5 && (
              <li className="text-xs text-gray-400">+{meal.ingredients.length - 5} more</li>
            )}
          </ul>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-gray-400">No meal — click 🎲 to generate</p>
        </div>
      )}

      <div className="mt-3 flex gap-2 pt-3 border-t border-gray-100">
        <button
          aria-label="Randomize"
          onClick={() => onRandomize(day)}
          disabled={disabled}
          className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <Dices size={14} /> Randomize
        </button>
        {meal && (
          <button
            aria-label="Edit"
            onClick={() => onEdit(day, meal)}
            className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <Pencil size={14} /> Edit
          </button>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run tests**

```bash
cd /Users/fredanaman/Documents/claudecode/mymealplanner
npm test tests/components/MealCard.test.tsx
```

Expected: all PASS.

- [ ] **Step 5: Commit**

```bash
cd /Users/fredanaman/Documents/claudecode/mymealplanner
git add components/MealCard.tsx tests/components/MealCard.test.tsx
git commit -m "feat: MealCard component with loading skeleton, ingredient list, randomize/edit"
```

---

## Task 16: EditMealModal (TDD)

**Files:**
- Create: `components/EditMealModal.tsx`, `tests/components/EditMealModal.test.tsx`

- [ ] **Step 1: Write failing tests**

```tsx
// tests/components/EditMealModal.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { EditMealModal } from '@/components/EditMealModal'
import { Meal } from '@/lib/types'

const mockMeal: Meal = {
  id: 'edit-test',
  name: 'Pasta Carbonara',
  ingredients: [
    { name: 'pasta', quantity: 400, unit: 'g' },
    { name: 'egg', quantity: 4, unit: 'pcs' },
  ],
}

describe('EditMealModal', () => {
  it('renders nothing when closed', () => {
    const { container } = render(
      <EditMealModal open={false} meal={mockMeal} onSave={vi.fn()} onClose={vi.fn()} />
    )
    expect(container.firstChild).toBeNull()
  })

  it('shows meal name in input when open', () => {
    render(<EditMealModal open={true} meal={mockMeal} onSave={vi.fn()} onClose={vi.fn()} />)
    expect(screen.getByDisplayValue('Pasta Carbonara')).toBeInTheDocument()
  })

  it('calls onSave with updated meal when saved', () => {
    const onSave = vi.fn()
    render(<EditMealModal open={true} meal={mockMeal} onSave={onSave} onClose={vi.fn()} />)
    const nameInput = screen.getByDisplayValue('Pasta Carbonara')
    fireEvent.change(nameInput, { target: { value: 'Spaghetti Carbonara' } })
    fireEvent.click(screen.getByRole('button', { name: /save/i }))
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Spaghetti Carbonara', id: 'edit-test' })
    )
  })

  it('adds a new ingredient row when Add button clicked', () => {
    render(<EditMealModal open={true} meal={mockMeal} onSave={vi.fn()} onClose={vi.fn()} />)
    const addBtn = screen.getByRole('button', { name: /add ingredient/i })
    fireEvent.click(addBtn)
    // should now have 3 ingredient rows (2 original + 1 new)
    const nameInputs = screen.getAllByPlaceholderText(/ingredient name/i)
    expect(nameInputs).toHaveLength(3)
  })

  it('calls onClose when Cancel clicked', () => {
    const onClose = vi.fn()
    render(<EditMealModal open={true} meal={mockMeal} onSave={vi.fn()} onClose={onClose} />)
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }))
    expect(onClose).toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run to verify failure**

```bash
cd /Users/fredanaman/Documents/claudecode/mymealplanner
npm test tests/components/EditMealModal.test.tsx
```

Expected: FAIL.

- [ ] **Step 3: Implement components/EditMealModal.tsx**

```tsx
// components/EditMealModal.tsx
'use client'

import { useState } from 'react'
import { X, Plus, Trash2 } from 'lucide-react'
import { Ingredient, Meal, Unit, UNITS } from '@/lib/types'

interface EditMealModalProps {
  open: boolean
  meal: Meal | null
  onSave: (meal: Meal) => void
  onClose: () => void
}

interface IngredientRow extends Ingredient {
  key: string
}

export function EditMealModal({ open, meal, onSave, onClose }: EditMealModalProps) {
  const [name, setName] = useState(meal?.name ?? '')
  const [rows, setRows] = useState<IngredientRow[]>(
    (meal?.ingredients ?? []).map((ing, i) => ({ ...ing, key: String(i) }))
  )

  if (!open || !meal) return null

  function addRow() {
    setRows(r => [...r, { key: crypto.randomUUID(), name: '', quantity: 0, unit: 'g' }])
  }

  function removeRow(key: string) {
    setRows(r => r.filter(row => row.key !== key))
  }

  function updateRow(key: string, field: keyof Ingredient, value: string | number) {
    setRows(r => r.map(row => row.key === key ? { ...row, [field]: value } : row))
  }

  function handleSave() {
    const ingredients: Ingredient[] = rows
      .filter(r => r.name.trim())
      .map(({ key, ...ing }) => ({ ...ing, quantity: Number(ing.quantity) }))
    onSave({ ...meal, name: name.trim(), ingredients })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Edit Meal</h2>
          <button onClick={onClose}><X size={20} /></button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Meal name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Ingredients</p>
            <div className="space-y-2">
              {rows.map(row => (
                <div key={row.key} className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={row.name}
                    onChange={e => updateRow(row.key, 'name', e.target.value)}
                    placeholder="ingredient name"
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="number"
                    value={row.quantity}
                    onChange={e => updateRow(row.key, 'quantity', e.target.value)}
                    min={0}
                    className="w-20 rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <select
                    value={row.unit}
                    onChange={e => updateRow(row.key, 'unit', e.target.value as Unit)}
                    className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                  <button
                    onClick={() => removeRow(row.key)}
                    className="text-red-400 hover:text-red-600"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
            <button
              aria-label="Add ingredient"
              onClick={addRow}
              className="mt-2 flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
            >
              <Plus size={14} /> Add ingredient
            </button>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            aria-label="Cancel"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            aria-label="Save"
            onClick={handleSave}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run tests**

```bash
cd /Users/fredanaman/Documents/claudecode/mymealplanner
npm test tests/components/EditMealModal.test.tsx
```

Expected: all PASS.

- [ ] **Step 5: Commit**

```bash
cd /Users/fredanaman/Documents/claudecode/mymealplanner
git add components/EditMealModal.tsx tests/components/EditMealModal.test.tsx
git commit -m "feat: EditMealModal with ingredient row add/remove/edit"
```

---

## Task 17: WeekGrid

**Files:**
- Create: `components/WeekGrid.tsx`

- [ ] **Step 1: Create components/WeekGrid.tsx**

```tsx
// components/WeekGrid.tsx
'use client'

import { useState } from 'react'
import { usePlanner } from '@/lib/planner-context'
import { Meal, Weekday, WEEKDAYS } from '@/lib/types'
import { MealCard } from '@/components/MealCard'
import { EditMealModal } from '@/components/EditMealModal'

export function WeekGrid() {
  const { current, dayLoading, weekLoading, randomizeMeal, setMeal } = usePlanner()
  const [editing, setEditing] = useState<{ day: Weekday; meal: Meal } | null>(null)

  function handleEdit(day: Weekday, meal: Meal) {
    setEditing({ day, meal })
  }

  function handleSave(meal: Meal) {
    if (!editing) return
    setMeal(editing.day, meal)
    setEditing(null)
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
        {WEEKDAYS.map(day => (
          <MealCard
            key={day}
            day={day}
            meal={current.days[day]}
            loading={dayLoading[day]}
            weekLoading={weekLoading}
            onRandomize={randomizeMeal}
            onEdit={handleEdit}
          />
        ))}
      </div>

      <EditMealModal
        open={editing !== null}
        meal={editing?.meal ?? null}
        onSave={handleSave}
        onClose={() => setEditing(null)}
      />
    </>
  )
}
```

- [ ] **Step 2: Commit**

```bash
cd /Users/fredanaman/Documents/claudecode/mymealplanner
git add components/WeekGrid.tsx
git commit -m "feat: WeekGrid 7-column responsive layout wiring MealCard + EditMealModal"
```

---

## Task 18: ShoppingListModal (TDD)

**Files:**
- Create: `components/ShoppingListModal.tsx`, `tests/components/ShoppingListModal.test.tsx`

- [ ] **Step 1: Write failing tests**

```tsx
// tests/components/ShoppingListModal.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ShoppingListModal } from '@/components/ShoppingListModal'
import { ShoppingList } from '@/lib/types'

const mockList: ShoppingList = {
  generatedAt: '2026-05-17T10:00:00Z',
  categories: [
    {
      name: 'produce',
      items: [
        { name: 'tomato', quantity: 300, unit: 'g' },
        { name: 'onion', quantity: 2, unit: 'pcs' },
      ],
    },
    {
      name: 'meat',
      items: [{ name: 'chicken breast', quantity: 1.2, unit: 'kg' }],
    },
  ],
}

describe('ShoppingListModal', () => {
  it('renders nothing when closed', () => {
    const { container } = render(
      <ShoppingListModal open={false} list={mockList} onClose={vi.fn()} />
    )
    expect(container.firstChild).toBeNull()
  })

  it('shows category headers when open', () => {
    render(<ShoppingListModal open={true} list={mockList} onClose={vi.fn()} />)
    expect(screen.getByText(/produce/i)).toBeInTheDocument()
    expect(screen.getByText(/meat/i)).toBeInTheDocument()
  })

  it('shows ingredient names', () => {
    render(<ShoppingListModal open={true} list={mockList} onClose={vi.fn()} />)
    expect(screen.getByText(/tomato/i)).toBeInTheDocument()
    expect(screen.getByText(/chicken breast/i)).toBeInTheDocument()
  })

  it('has Copy, txt, csv, and Print buttons', () => {
    render(<ShoppingListModal open={true} list={mockList} onClose={vi.fn()} />)
    expect(screen.getByRole('button', { name: /copy/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /\.txt/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /\.csv/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /print/i })).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run to verify failure**

```bash
cd /Users/fredanaman/Documents/claudecode/mymealplanner
npm test tests/components/ShoppingListModal.test.tsx
```

Expected: FAIL.

- [ ] **Step 3: Implement components/ShoppingListModal.tsx**

```tsx
// components/ShoppingListModal.tsx
'use client'

import { X, Copy, Download, Printer } from 'lucide-react'
import { ShoppingList } from '@/lib/types'
import { shoppingListToCsv, shoppingListToText } from '@/lib/ingredients'

interface ShoppingListModalProps {
  open: boolean
  list: ShoppingList
  onClose: () => void
}

function downloadFile(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

const CATEGORY_EMOJI: Record<string, string> = {
  produce: '🥦', meat: '🥩', fish: '🐟', dairy: '🥛',
  pantry: '🫙', bakery: '🍞', frozen: '🧊', other: '📦',
}

export function ShoppingListModal({ open, list, onClose }: ShoppingListModalProps) {
  if (!open) return null

  function handleCopy() {
    navigator.clipboard.writeText(shoppingListToText(list))
  }

  function handleDownloadTxt() {
    downloadFile(shoppingListToText(list), 'shopping-list.txt', 'text/plain')
  }

  function handleDownloadCsv() {
    downloadFile(shoppingListToCsv(list), 'shopping-list.csv', 'text/csv')
  }

  function handlePrint() {
    window.open('/print', '_blank')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-xl max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between p-6 pb-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold">Shopping List</h2>
          <button onClick={onClose}><X size={20} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {list.categories.map(cat => (
            <div key={cat.name}>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-2">
                {CATEGORY_EMOJI[cat.name] ?? '📦'} {cat.name}
              </h3>
              <ul className="space-y-1">
                {cat.items.map((item, i) => (
                  <li key={i} className="flex items-baseline gap-2 text-sm text-gray-800">
                    <span className="text-gray-400">•</span>
                    <span className="font-medium">{item.name}</span>
                    <span className="text-gray-500 ml-auto shrink-0">
                      {item.quantity} {item.unit}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex gap-2 p-4 border-t border-gray-100 flex-wrap">
          <button
            aria-label="Copy"
            onClick={handleCopy}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            <Copy size={14} /> Copy
          </button>
          <button
            aria-label=".txt"
            onClick={handleDownloadTxt}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            <Download size={14} /> .txt
          </button>
          <button
            aria-label=".csv"
            onClick={handleDownloadCsv}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            <Download size={14} /> .csv
          </button>
          <button
            aria-label="Print"
            onClick={handlePrint}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            <Printer size={14} /> Print
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run tests**

```bash
cd /Users/fredanaman/Documents/claudecode/mymealplanner
npm test tests/components/ShoppingListModal.test.tsx
```

Expected: all PASS.

- [ ] **Step 5: Commit**

```bash
cd /Users/fredanaman/Documents/claudecode/mymealplanner
git add components/ShoppingListModal.tsx tests/components/ShoppingListModal.test.tsx
git commit -m "feat: ShoppingListModal with category display, copy/download/print actions"
```

---

## Task 19: HistoryDrawer

**Files:**
- Create: `components/HistoryDrawer.tsx`

- [ ] **Step 1: Create components/HistoryDrawer.tsx**

```tsx
// components/HistoryDrawer.tsx
'use client'

import { X, Clock, ArrowDownToLine } from 'lucide-react'
import { usePlanner } from '@/lib/planner-context'
import { WEEKDAYS } from '@/lib/types'

interface HistoryDrawerProps {
  open: boolean
  onClose: () => void
}

export function HistoryDrawer({ open, onClose }: HistoryDrawerProps) {
  const { history, current, loadWeek } = usePlanner()

  if (!open) return null

  function handleLoad(index: number) {
    const hasCurrentMeals = WEEKDAYS.some(d => current.days[d] !== null)
    if (hasCurrentMeals) {
      if (!confirm('Load this week? Your current plan will be replaced.')) return
    }
    loadWeek(history[index])
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-white p-6 shadow-xl h-full overflow-y-auto">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Clock size={18} /> History
          </h2>
          <button onClick={onClose}><X size={20} /></button>
        </div>

        {history.length === 0 ? (
          <p className="text-sm text-gray-400">No saved weeks yet. Use "Save Snapshot" to save the current plan.</p>
        ) : (
          <ul className="space-y-3">
            {history.map((week, i) => {
              const mealCount = WEEKDAYS.filter(d => week.days[d] !== null).length
              return (
                <li key={week.id} className="rounded-xl border border-gray-200 p-4">
                  <p className="font-medium text-sm text-gray-900">
                    {week.label ?? `Week ${i + 1}`}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(week.createdAt).toLocaleDateString('en-BE')} · {mealCount}/7 meals
                  </p>
                  <div className="mt-2 space-y-0.5">
                    {WEEKDAYS.map(d => week.days[d] && (
                      <p key={d} className="text-xs text-gray-600 truncate">
                        {d.slice(0, 3).toUpperCase()}: {week.days[d]!.name}
                      </p>
                    ))}
                  </div>
                  <button
                    onClick={() => handleLoad(i)}
                    className="mt-3 flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100"
                  >
                    <ArrowDownToLine size={12} /> Load this week
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
cd /Users/fredanaman/Documents/claudecode/mymealplanner
git add components/HistoryDrawer.tsx
git commit -m "feat: HistoryDrawer with past week list, meal preview, and load-with-confirm"
```

---

## Task 20: Main page

**Files:**
- Modify: `app/page.tsx`, `app/layout.tsx`

- [ ] **Step 1: Update app/layout.tsx**

Replace the generated `app/layout.tsx` with:

```tsx
// app/layout.tsx
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'MyMealPlanner',
  description: 'Weekly dinner planner for families',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 min-h-screen">{children}</body>
    </html>
  )
}
```

- [ ] **Step 2: Replace app/page.tsx**

```tsx
// app/page.tsx
'use client'

import { useState } from 'react'
import { Dices, Trash2, Save, ListChecks, SlidersHorizontal, History, Settings } from 'lucide-react'
import { PlannerProvider, usePlanner } from '@/lib/planner-context'
import { buildShoppingList } from '@/lib/ingredients'
import { WeekGrid } from '@/components/WeekGrid'
import { ShoppingListModal } from '@/components/ShoppingListModal'
import { PreferencesPanel } from '@/components/PreferencesPanel'
import { HistoryDrawer } from '@/components/HistoryDrawer'
import { SettingsModal } from '@/components/SettingsModal'
import { ToastStack, useToasts } from '@/components/Toast'
import { ShoppingList } from '@/lib/types'

function PlannerApp() {
  const { current, weekLoading, randomizeWeek, clearAll, saveSnapshot, storageAvailable } = usePlanner()
  const [shoppingList, setShoppingList] = useState<ShoppingList | null>(null)
  const [showPrefs, setShowPrefs] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  function handleGenerateList() {
    setShoppingList(buildShoppingList(current))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Storage warning banner */}
      {!storageAvailable && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-sm text-amber-800 text-center">
          Local storage unavailable — your plan won't persist after closing this tab.
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-900">🍲 MyMealPlanner</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPrefs(true)}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100"
          >
            <SlidersHorizontal size={15} /> Prefs
          </button>
          <button
            onClick={() => setShowHistory(true)}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100"
          >
            <History size={15} /> History
          </button>
          <button
            onClick={() => setShowSettings(true)}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100"
          >
            <Settings size={15} /> Settings
          </button>
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-4 py-6">
        {/* Action bar */}
        <div className="mb-4 flex flex-wrap gap-2">
          <button
            onClick={randomizeWeek}
            disabled={weekLoading}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Dices size={15} />
            {weekLoading ? 'Generating…' : 'Randomize Week'}
          </button>
          <button
            onClick={clearAll}
            className="flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
          >
            <Trash2 size={15} /> Clear All
          </button>
          <button
            onClick={saveSnapshot}
            className="flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
          >
            <Save size={15} /> Save Snapshot
          </button>
        </div>

        {/* Week grid */}
        <WeekGrid />

        {/* Shopping list CTA */}
        <div className="mt-8 flex justify-center">
          <button
            onClick={handleGenerateList}
            className="flex items-center gap-2 rounded-xl bg-green-600 px-8 py-3 text-base font-semibold text-white shadow hover:bg-green-700 transition-colors"
          >
            <ListChecks size={18} /> Generate Shopping List
          </button>
        </div>
      </main>

      {/* Modals & drawers */}
      {shoppingList && (
        <ShoppingListModal
          open={true}
          list={shoppingList}
          onClose={() => setShoppingList(null)}
        />
      )}
      <PreferencesPanel open={showPrefs} onClose={() => setShowPrefs(false)} />
      <HistoryDrawer open={showHistory} onClose={() => setShowHistory(false)} />
      <SettingsModal open={showSettings} onClose={() => setShowSettings(false)} />
    </div>
  )
}

export default function Page() {
  const { toasts, addToast, dismissToast } = useToasts()
  const [settingsOpen, setSettingsOpen] = useState(false)

  return (
    <PlannerProvider onError={addToast} openSettings={() => setSettingsOpen(true)}>
      <PlannerApp />
      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </PlannerProvider>
  )
}
```

- [ ] **Step 3: Commit**

```bash
cd /Users/fredanaman/Documents/claudecode/mymealplanner
git add app/page.tsx app/layout.tsx
git commit -m "feat: main page wiring all components, header, action bar, shopping list CTA"
```

---

## Task 21: Print page

**Files:**
- Create: `app/print/page.tsx`
- Modify: `app/globals.css`

- [ ] **Step 1: Add print CSS to app/globals.css**

In `app/globals.css`, add after the existing Tailwind directives:

```css
@media print {
  header,
  .no-print {
    display: none !important;
  }
  body {
    background: white;
  }
}
```

- [ ] **Step 2: Create app/print/page.tsx**

```tsx
// app/print/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { loadStorage } from '@/lib/storage'
import { buildShoppingList } from '@/lib/ingredients'
import { ShoppingList, WeekPlan, WEEKDAYS, WEEKDAY_LABELS } from '@/lib/types'

export default function PrintPage() {
  const [plan, setPlan] = useState<WeekPlan | null>(null)
  const [list, setList] = useState<ShoppingList | null>(null)

  useEffect(() => {
    const { current } = loadStorage()
    setPlan(current)
    setList(buildShoppingList(current))
  }, [])

  if (!plan || !list) return <p className="p-8">Loading…</p>

  return (
    <div className="p-8 max-w-4xl mx-auto font-sans">
      <h1 className="text-2xl font-bold mb-6">🍲 Weekly Dinner Plan</h1>

      {/* Plan table */}
      <section className="mb-8">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr>
              {WEEKDAYS.map(d => (
                <th key={d} className="border border-gray-300 px-2 py-1 text-left font-semibold bg-gray-50">
                  {WEEKDAY_LABELS[d]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              {WEEKDAYS.map(d => {
                const meal = plan.days[d]
                return (
                  <td key={d} className="border border-gray-300 px-2 py-2 align-top text-xs">
                    {meal ? (
                      <>
                        <p className="font-semibold">{meal.name}</p>
                        {meal.prepTime && <p className="text-gray-500">{meal.prepTime}</p>}
                      </>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                )
              })}
            </tr>
          </tbody>
        </table>
      </section>

      {/* Shopping list */}
      <section>
        <h2 className="text-xl font-bold mb-4">Shopping List</h2>
        <div className="columns-2 gap-8">
          {list.categories.map(cat => (
            <div key={cat.name} className="break-inside-avoid mb-4">
              <h3 className="font-semibold uppercase text-xs tracking-wide text-gray-500 mb-1">
                {cat.name}
              </h3>
              <ul>
                {cat.items.map((item, i) => (
                  <li key={i} className="text-sm flex justify-between">
                    <span>{item.name}</span>
                    <span className="text-gray-500">{item.quantity} {item.unit}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <button
        onClick={() => window.print()}
        className="mt-8 rounded-lg bg-gray-900 px-6 py-2 text-sm font-medium text-white hover:bg-gray-700 no-print"
      >
        Print
      </button>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
cd /Users/fredanaman/Documents/claudecode/mymealplanner
git add app/print/page.tsx app/globals.css
git commit -m "feat: print page with week plan table and shopping list in 2-column layout"
```

---

## Task 22: Full test suite run + smoke test

- [ ] **Step 1: Run all tests**

```bash
cd /Users/fredanaman/Documents/claudecode/mymealplanner
npm test
```

Expected: all tests PASS.

- [ ] **Step 2: Smoke test dev server**

```bash
cd /Users/fredanaman/Documents/claudecode/mymealplanner
npm run dev &
sleep 8
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000
```

Expected: `200`

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/print
```

Expected: `200`

```bash
kill %1
```

- [ ] **Step 3: TypeScript check**

```bash
cd /Users/fredanaman/Documents/claudecode/mymealplanner
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Final commit**

```bash
cd /Users/fredanaman/Documents/claudecode/mymealplanner
git add -A
git commit -m "chore: all tests pass, TypeScript clean, smoke test verified"
```

---

## Self-Review Checklist

Spec coverage verified:
- ✅ 7-day dinner planner — WeekGrid + MealCard
- ✅ Per-slot randomize — MealCard randomize button → `randomizeMeal(day)`
- ✅ Full-week randomize — Action bar "Randomize Week" → `randomizeWeek()`
- ✅ Manual edit — EditMealModal triggered from MealCard
- ✅ Preferences panel — PreferencesPanel slide-over, all fields
- ✅ Shopping list aggregation — `buildShoppingList()` in ingredients.ts (TDD)
- ✅ Deduplication + unit merging — Task 6 TDD
- ✅ Export: copy, .txt, .csv — ShoppingListModal
- ✅ Print — `/print` route + `window.open('/print')`
- ✅ localStorage persistence — storage.ts + planner-context.tsx sync
- ✅ Plan history (20 max) — saveSnapshot + HistoryDrawer
- ✅ User-supplied OpenRouter key — SettingsModal, passed per-request
- ✅ Missing key → block + open Settings — planner-context.tsx
- ✅ 401 → "Invalid API key" + open Settings
- ✅ 429/5xx → toast with retry
- ✅ localStorage unavailable → banner + in-memory fallback
- ✅ Zod validation + retry on parse fail — API routes

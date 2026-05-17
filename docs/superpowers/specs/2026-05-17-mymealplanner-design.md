# MyMealPlanner — Design Spec

**Date:** 2026-05-17
**Version:** 1.0 (MVP)
**Target users:** Family of 4 (two adults + 16yo + 20yo), Flanders, Belgium

## 1. Goal

A web app that plans a week of dinners. Users randomize meals (per-slot or full-week) via an LLM, edit them manually, then generate a deduplicated shopping list with export/print options. Everything persists locally in the browser.

## 2. Scope

### In scope (MVP)
- 7-day dinner planner (one meal per day).
- Per-slot randomize + full-week randomize via OpenRouter LLM.
- Manual edit of meal name + ingredients (with quantities/units).
- User-editable preferences panel (diet, cuisines, dislikes, allergies, budget, family size, notes).
- Shopping list: aggregation, deduplication, unit merging, categorization.
- Export: copy to clipboard, download `.txt`, download `.csv`, print.
- localStorage persistence: current plan, preferences, API key, model choice, plan history (last 20 weeks).
- User-supplied OpenRouter API key (settings modal).

### Out of scope (YAGNI)
- Auth, multi-user, cloud sync.
- Apify / supermarket price scraping (deferred to v2).
- Breakfast and lunch (dinner only).
- i18n (English UI; meal names may appear in Dutch/French naturally).
- Recipe instructions, cooking steps, nutrition info.
- Mobile native apps.

## 3. Tech Stack

- **Framework:** Next.js 15 (App Router) + React + TypeScript.
- **Styling:** Tailwind CSS.
- **Icons:** lucide-react.
- **LLM:** OpenRouter, default model `anthropic/claude-haiku-4.5`. User-supplied key.
- **Validation:** Zod for LLM response schemas.
- **Storage:** Browser localStorage.
- **Testing:** Vitest + React Testing Library.

This project's `AGENTS.md` warns the local Next.js may differ from training data — implementers must read `node_modules/next/dist/docs/` before writing Next-specific code.

## 4. Architecture

Single-page app at `/` with thin Next.js API routes proxying OpenRouter. No database. State lives in React, mirrored to localStorage. API key is read from localStorage and passed per-request to the server proxy; the server never stores it.

```
mymealplanner/
├── app/
│   ├── page.tsx                       # Planner UI
│   ├── layout.tsx
│   ├── print/page.tsx                 # Print view
│   └── api/
│       ├── generate-meal/route.ts     # 1 meal
│       └── generate-week/route.ts     # 7 meals
├── components/
│   ├── WeekGrid.tsx
│   ├── MealCard.tsx
│   ├── EditMealModal.tsx
│   ├── PreferencesPanel.tsx
│   ├── ShoppingListModal.tsx
│   ├── HistoryDrawer.tsx
│   └── SettingsModal.tsx
├── lib/
│   ├── storage.ts                     # localStorage wrappers + in-memory fallback
│   ├── openrouter.ts                  # client fetch helpers
│   ├── ingredients.ts                 # normalize, merge units, categorize
│   ├── prompts.ts                     # system + user prompt builders
│   ├── schemas.ts                     # Zod schemas for LLM responses
│   └── types.ts
├── docs/superpowers/specs/
└── tests/
```

## 5. Data Model

```ts
type Weekday = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

type Ingredient = {
  name: string;        // canonical, lowercase singular ("chicken breast")
  quantity: number;
  unit: string;        // "g" | "kg" | "ml" | "l" | "pcs" | "tbsp" | "tsp" | "cup"
};

type Meal = {
  id: string;          // uuid
  name: string;
  ingredients: Ingredient[];
  prepTime?: string;   // e.g. "30 min"
  cuisine?: string;
};

type WeekPlan = {
  id: string;
  createdAt: string;   // ISO
  label?: string;      // e.g. "Week of 2026-05-18"
  days: Record<Weekday, Meal | null>;
};

type Preferences = {
  dietType: "omnivore" | "vegetarian" | "pescatarian" | "vegan";
  cuisines: string[];
  dislikes: string[];
  allergies: string[];
  budgetTier: "low" | "medium" | "high";
  familySize: number;  // default 4
  notes: string;
};

type AppState = {
  current: WeekPlan;
  history: WeekPlan[];   // FIFO, capped at 20
  prefs: Preferences;
  apiKey: string;
  model: string;
};
```

**localStorage keys:** `mmp.current`, `mmp.history`, `mmp.prefs`, `mmp.apiKey`, `mmp.model`.

## 6. LLM Integration

### Server routes

```
POST /api/generate-meal
body: { apiKey, model, prefs, avoid: string[] }
→ 200 { meal: Meal }
→ 4xx/5xx { error: string }

POST /api/generate-week
body: { apiKey, model, prefs }
→ 200 { meals: Meal[] }   // length 7
→ 4xx/5xx { error: string }
```

The `avoid` list contains names of meals already in the current week, so a new single-slot generation doesn't duplicate them.

### Prompt strategy

- **System prompt:** "Belgian/Flemish family dinner planner. Output strict JSON matching the provided schema. Ingredient names lowercase singular. Quantities metric (g, kg, ml, l) or pcs/tbsp/tsp/cup. No prose outside JSON."
- **User prompt:** Serialized `prefs` + `avoid` + JSON schema description + count (1 or 7).
- **OpenRouter call:** `response_format: { type: "json_object" }`.
- **Validation:** Zod parse server-side. On parse fail, retry once with a stricter "JSON ONLY" reminder. Second fail → 502 to client.

### Model

Default `anthropic/claude-haiku-4.5`. User can change in Settings.

## 7. Shopping List Aggregation

Implemented in `lib/ingredients.ts`. Pure functions, fully unit-tested.

1. **Flatten** — collect all `Ingredient[]` from the 7 meals; skip empty slots.
2. **Normalize names** — lowercase, trim, basic stemming via a small static map ("tomatoes"→"tomato", "onions"→"onion", "potatoes"→"potato", etc.).
3. **Unit families** — `mass: {g, kg}`, `volume: {ml, l}`, `count: {pcs}`, `spoon: {tsp, tbsp}`, `cup: {cup}`. Conversions: 1kg=1000g, 1l=1000ml, 1tbsp=3tsp.
4. **Group by canonical name** — sum quantities within a compatible unit family; pick the most human-friendly display unit (e.g., switch to kg if ≥1000g).
5. **Conflicting unit families** for the same canonical name (e.g., "garlic 100g" + "garlic 2 pcs") → keep as separate line items under the same name.
6. **Categorize** — map name → category (`produce`, `meat`, `fish`, `dairy`, `pantry`, `frozen`, `bakery`, `other`) via a static lookup. Unknown ingredients fall into `other`.
7. **Sort** — categories in a fixed display order; items alphabetical within each.

### Output

```ts
type ShoppingListItem = { name: string; qty: number; unit: string };
type ShoppingList = {
  categories: { name: string; items: ShoppingListItem[] }[];
  generatedAt: string;
};
```

### Export

- **Copy clipboard** — plain text, grouped by category with blank-line separators.
- **Download `.txt`** — same format as clipboard.
- **Download `.csv`** — header `name,quantity,unit,category`.
- **Print** — `/print` route renders printable plan + shopping list; CSS `@media print` hides app chrome.

## 8. UI Layout

### Main page

- **Header:** title + buttons [Preferences] [History] [Settings].
- **Action bar:** [Randomize Week] [Clear All] [Save Snapshot].
- **WeekGrid:** 7 columns desktop (Mon→Sun), 2 columns tablet, 1 column mobile-stacked.
- **MealCard (per slot):** day label, meal name (big), prep time + cuisine (small), bullet ingredient list, footer buttons [Randomize 🎲] [Edit ✏️]. Empty state: "No meal — click 🎲 to generate."
- **Footer CTA:** big primary button [Generate Shopping List].

### Modals / drawers

- **EditMealModal** — text input for name; editable ingredient rows (name, qty number, unit dropdown) with add/remove buttons; Save/Cancel.
- **PreferencesPanel** — slide-over right; diet radio, cuisines as multi-select chips, dislikes/allergies as comma-separated chips, budget tier radio, family size number, freeform notes textarea.
- **ShoppingListModal** — categorized list + action row [Copy] [.txt] [.csv] [Print].
- **HistoryDrawer** — list of past weeks (label + date); click to preview; [Load] replaces current week after confirm dialog if current has any meals.
- **SettingsModal** — OpenRouter API key (password input, masked), model text input with sensible default and a small list of suggested options.

### Loading and feedback

- Meal card shows skeleton + spinner while generating.
- Week randomize disables all randomize buttons until done.
- Toast notifications for errors and successes (lightweight in-house component, no external lib).

## 9. Error Handling

- **Missing API key** → block randomize; show toast and open SettingsModal.
- **OpenRouter 401** → "Invalid API key" toast; open Settings.
- **OpenRouter 429 / 5xx** → toast with [Retry] action. No automatic retry except the single JSON-parse retry server-side.
- **LLM invalid JSON** → server retries once with stricter prompt; second failure returns 502 with message.
- **Network offline** → toast "Offline — check connection."
- **localStorage unavailable / quota exceeded** → fall back to in-memory state for the session and show a persistent banner: "Local storage unavailable; your plan won't persist."

## 10. Testing

- **Unit (Vitest):**
  - `lib/ingredients.ts` — normalize, merge within unit family, conflicting units, categorize, sort.
  - `lib/storage.ts` — round-trip read/write, quota-error fallback.
  - `lib/prompts.ts` — output shape with various prefs.
- **Component (React Testing Library):**
  - `MealCard` — renders meal, fires randomize/edit handlers, shows loading state.
  - `ShoppingListModal` — renders categories, copy/download triggers.
  - `EditMealModal` — add/remove ingredient rows, save emits correct shape.
- **API routes:** mock OpenRouter HTTP layer; assert schema validation, retry behavior, error mapping.
- **No E2E in MVP.**

## 11. Open Questions

None at design time. All decisions captured via Q1–Q9 in brainstorming.

## 12. Future Work (post-MVP)

- Apify / supermarket price + availability for Colruyt, Delhaize, Carrefour, AH Belgium.
- Breakfast + lunch slots.
- Recipe step-by-step view.
- Cloud sync (Supabase) for multi-device.
- Nutrition estimates per meal.
- Multi-language UI (NL/FR).

// lib/ingredients.ts
import { Ingredient, ShoppingList, ShoppingListCategory, ShoppingListItem, Unit, WEEKDAYS, WeekPlan } from '@/lib/types'

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

type UnitFamily = 'mass' | 'volume' | 'count' | 'spoon' | 'cup'

const UNIT_FAMILY: Record<Unit, UnitFamily> = {
  g: 'mass', kg: 'mass',
  ml: 'volume', l: 'volume',
  pcs: 'count',
  tsp: 'spoon', tbsp: 'spoon',
  cup: 'cup',
}

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
  tomato: 'produce', onion: 'produce', potato: 'produce', carrot: 'produce',
  garlic: 'produce', pepper: 'produce', 'bell pepper': 'produce', leek: 'produce',
  spinach: 'produce', lettuce: 'produce', cucumber: 'produce', zucchini: 'produce',
  courgette: 'produce', eggplant: 'produce', aubergine: 'produce', broccoli: 'produce',
  cauliflower: 'produce', mushroom: 'produce', celery: 'produce', shallot: 'produce',
  parsley: 'produce', basil: 'produce', thyme: 'produce', rosemary: 'produce',
  lemon: 'produce', lime: 'produce', orange: 'produce', apple: 'produce',
  'cherry tomato': 'produce', 'green bean': 'produce', asparagus: 'produce',
  'chicken breast': 'meat', 'chicken thigh': 'meat', 'chicken leg': 'meat',
  'ground beef': 'meat', 'minced beef': 'meat', beef: 'meat', pork: 'meat',
  lamb: 'meat', bacon: 'meat', sausage: 'meat', ham: 'meat', turkey: 'meat',
  'pork belly': 'meat', 'beef steak': 'meat', veal: 'meat',
  salmon: 'fish', tuna: 'fish', shrimp: 'fish', cod: 'fish', tilapia: 'fish',
  herring: 'fish', mackerel: 'fish', anchovy: 'fish', sardine: 'fish',
  milk: 'dairy', cheese: 'dairy', butter: 'dairy', cream: 'dairy',
  yogurt: 'dairy', egg: 'dairy', 'heavy cream': 'dairy', 'sour cream': 'dairy',
  'cream cheese': 'dairy', mozzarella: 'dairy', parmesan: 'dairy', feta: 'dairy',
  flour: 'pantry', sugar: 'pantry', salt: 'pantry', 'olive oil': 'pantry',
  'vegetable oil': 'pantry', 'sunflower oil': 'pantry', 'black pepper': 'pantry',
  'soy sauce': 'pantry', vinegar: 'pantry', 'tomato paste': 'pantry',
  'canned tomato': 'pantry', 'chicken stock': 'pantry', 'beef stock': 'pantry',
  rice: 'pantry', pasta: 'pantry', 'bread crumb': 'pantry',
  'coconut milk': 'pantry', honey: 'pantry', mustard: 'pantry', ketchup: 'pantry',
  mayonnaise: 'pantry', paprika: 'pantry', cumin: 'pantry', coriander: 'pantry',
  oregano: 'pantry', 'bay leaf': 'pantry', nutmeg: 'pantry',
  'frozen pea': 'frozen', 'frozen corn': 'frozen', 'frozen spinach': 'frozen',
  baguette: 'bakery', croissant: 'bakery', bread: 'bakery',
}

const CATEGORY_ORDER = ['produce', 'meat', 'fish', 'dairy', 'pantry', 'bakery', 'frozen', 'other']

function categorize(name: string): string {
  return CATEGORY_MAP[name] ?? 'other'
}

export function buildShoppingList(plan: WeekPlan): ShoppingList {
  const all: Ingredient[] = WEEKDAYS
    .map(d => plan.days[d])
    .filter((m): m is NonNullable<typeof m> => m !== null)
    .flatMap(m => m.ingredients)

  const normalized = all.map(i => ({ ...i, name: normalizeIngredientName(i.name) }))

  const groups = new Map<string, number>()
  for (const ing of normalized) {
    const family = UNIT_FAMILY[ing.unit]
    const key = `${ing.name}|${family}`
    groups.set(key, (groups.get(key) ?? 0) + toBase(ing.quantity, ing.unit))
  }

  const items: (ShoppingListItem & { category: string })[] = []
  for (const [key, baseTotal] of groups) {
    const [name, family] = key.split('|') as [string, UnitFamily]
    const { quantity, unit } = fromBase(baseTotal, family)
    items.push({ name, quantity, unit, category: categorize(name) })
  }

  const byCategory = new Map<string, ShoppingListItem[]>()
  for (const { category, ...item } of items) {
    if (!byCategory.has(category)) byCategory.set(category, [])
    byCategory.get(category)!.push(item)
  }

  for (const items of byCategory.values()) {
    items.sort((a, b) => a.name.localeCompare(b.name))
  }

  const categories: ShoppingListCategory[] = CATEGORY_ORDER
    .filter(cat => byCategory.has(cat))
    .map(cat => ({ name: cat, items: byCategory.get(cat)! }))

  return { categories, generatedAt: new Date().toISOString() }
}

const CATEGORY_EMOJI: Record<string, string> = {
  produce: '🥦', meat: '🥩', fish: '🐟', dairy: '🥛',
  pantry: '🫙', bakery: '🍞', frozen: '🧊', other: '📦',
}

export function shoppingListToText(list: ShoppingList): string {
  const date = new Date().toLocaleDateString('en-BE', { year: 'numeric', month: 'long', day: 'numeric' })
  const line = '═'.repeat(40)
  const thin = '─'.repeat(40)
  const header = [
    line,
    '  🥗 MyMealPlanner — Shopping List',
    `  ${date}`,
    line,
  ].join('\n')

  const body = list.categories
    .filter(c => c.items.length > 0)
    .map(cat => {
      const emoji = CATEGORY_EMOJI[cat.name] ?? '📦'
      const catHeader = `\n${emoji}  ${cat.name.toUpperCase()}\n${thin}`
      const rows = cat.items.map(i => `  □  ${i.name.padEnd(28)} ${i.quantity} ${i.unit}`).join('\n')
      return `${catHeader}\n${rows}`
    })
    .join('\n')

  return `${header}\n${body}\n\n${line}`
}

export function shoppingListToCsv(list: ShoppingList): string {
  // UTF-8 BOM for Excel compatibility
  const BOM = '﻿'
  const rows = ['Category,Item,Quantity,Unit']
  for (const cat of list.categories) {
    for (const item of cat.items) {
      rows.push(`"${cat.name}","${item.name}",${item.quantity},"${item.unit}"`)
    }
  }
  return BOM + rows.join('\n')
}

const CAT_BG: Record<string, string> = {
  produce: '#E8F5E9', meat: '#FFF3E0', fish: '#E3F2FD', dairy: '#F3E5F5',
  pantry: '#FFF8E1', bakery: '#FBE9E7', frozen: '#E1F5FE', other: '#F5F5F5',
}
const CAT_BORDER: Record<string, string> = {
  produce: '#4CAF50', meat: '#FF9800', fish: '#2196F3', dairy: '#9C27B0',
  pantry: '#FFC107', bakery: '#FF5722', frozen: '#03A9F4', other: '#9E9E9E',
}

export function shoppingListToHtml(list: ShoppingList, weekPlan?: import('@/lib/types').WeekPlan): string {
  const date = new Date().toLocaleDateString('en-BE', { year: 'numeric', month: 'long', day: 'numeric' })

  const planSection = weekPlan ? (() => {
    const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const
    const labels: Record<string, string> = { mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat', sun: 'Sun' }
    const cells = days.map(d => {
      const meal = weekPlan.days[d]
      return `<td style="padding:10px;border:1px solid #D8E8D8;vertical-align:top;font-size:13px;background:${days.indexOf(d) % 2 === 0 ? '#F8FAF8' : '#fff'}">
        ${meal ? `<strong style="color:#1D2F2A">${meal.name}</strong>${meal.prepTime ? `<br><span style="color:#888;font-size:11px">⏱ ${meal.prepTime}</span>` : ''}` : '<span style="color:#ccc">—</span>'}
      </td>`
    }).join('')
    const headers = days.map(d => `<th style="padding:8px 10px;background:#1D2F2A;color:#fff;font-size:11px;text-transform:uppercase;letter-spacing:0.06em;border-right:1px solid #2B4A3D">${labels[d]}</th>`).join('')
    return `
      <h2 style="margin:0 0 12px;font-size:14px;font-weight:800;text-transform:uppercase;letter-spacing:0.06em;color:#1D2F2A">
        🍽 This Week's Dinners
      </h2>
      <table style="width:100%;border-collapse:collapse;margin-bottom:32px">
        <thead><tr>${headers}</tr></thead>
        <tbody><tr>${cells}</tr></tbody>
      </table>`
  })() : ''

  const categoryCards = list.categories
    .filter(c => c.items.length > 0)
    .map(cat => {
      const bg = CAT_BG[cat.name] ?? '#F5F5F5'
      const border = CAT_BORDER[cat.name] ?? '#9E9E9E'
      const emoji = CATEGORY_EMOJI[cat.name] ?? '📦'
      const rows = cat.items.map((item, i) => `
        <tr style="border-bottom:${i < cat.items.length - 1 ? `1px solid ${border}33` : 'none'}">
          <td style="padding:5px 0;font-size:12px;color:#1D2F2A">
            <span style="display:inline-block;width:13px;height:13px;border:1.5px solid ${border};border-radius:2px;margin-right:8px;vertical-align:middle"></span>
            ${item.name}
          </td>
          <td style="padding:5px 0;font-size:11px;color:#666;text-align:right;white-space:nowrap">${item.quantity} ${item.unit}</td>
        </tr>`).join('')
      return `
        <div style="background:${bg};border:2px solid ${border};border-radius:10px;padding:12px 14px;break-inside:avoid">
          <h3 style="margin:0 0 8px;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.08em;color:${border}">${emoji} ${cat.name}</h3>
          <table style="width:100%;border-collapse:collapse">${rows}</table>
        </div>`
    }).join('')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>MyMealPlanner — Shopping List</title>
</head>
<body style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f0f4f0">
  <div style="max-width:860px;margin:0 auto;padding:28px 20px">

    <!-- Header -->
    <div style="background:#41A05F;border-radius:16px;padding:20px 28px;margin-bottom:28px;display:flex;justify-content:space-between;align-items:center">
      <div>
        <h1 style="margin:0;color:#fff;font-size:24px;font-weight:800">🥗 MyMealPlanner</h1>
        <p style="margin:4px 0 0;color:rgba(255,255,255,0.8);font-size:13px">Weekly Plan &amp; Shopping List</p>
      </div>
      <div style="text-align:right">
        <p style="margin:0;color:rgba(255,255,255,0.7);font-size:12px">Generated</p>
        <p style="margin:2px 0 0;color:#fff;font-size:13px;font-weight:600">${date}</p>
      </div>
    </div>

    <!-- Week plan -->
    ${planSection}

    <!-- Shopping list heading -->
    <h2 style="margin:0 0 16px;font-size:14px;font-weight:800;text-transform:uppercase;letter-spacing:0.06em;color:#1D2F2A">
      🛒 Shopping List
    </h2>

    <!-- Category grid -->
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px">
      ${categoryCards}
    </div>

    <p style="margin-top:28px;font-size:11px;color:#aaa;text-align:center">Generated by MyMealPlanner</p>
  </div>
</body>
</html>`
}

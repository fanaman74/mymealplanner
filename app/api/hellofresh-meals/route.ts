import { NextRequest, NextResponse } from 'next/server'

export interface HFMeal {
  id: string
  name: string
  description: string
  imageUrl: string
  prepTime: number // minutes
  difficulty: string
  cuisines: string[]
  tags: string[]
  ingredients: { name: string; amount: number; unit: string }[]
  servings: number
}

function parseIsoDuration(iso: string): number {
  if (!iso) return 30
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?/)
  if (!match) return 30
  const hours = parseInt(match[1] ?? '0', 10)
  const minutes = parseInt(match[2] ?? '0', 10)
  return hours * 60 + minutes
}

const MOCK_MEALS: HFMeal[] = [
  {
    id: 'mock-1',
    name: 'Poulet Rôti aux Herbes de Provence',
    description:
      'Tender roasted chicken with fragrant Provençal herbs, served with golden roasted potatoes and a light pan jus.',
    imageUrl:
      'https://img.hellofresh.com/hellofresh_s3/image/upload/f_auto,fl_lossy,q_auto,w_500/hellofresh_website/us/cms-content/2022/03/14113923/HF220221_R_W10_US_PD_6702-low-0.jpg',
    prepTime: 40,
    difficulty: 'Easy',
    cuisines: ['French'],
    tags: ['Family Friendly', 'Classic'],
    ingredients: [
      { name: 'Chicken thighs', amount: 4, unit: 'pieces' },
      { name: 'Potatoes', amount: 500, unit: 'g' },
      { name: 'Herbes de Provence', amount: 2, unit: 'tbsp' },
      { name: 'Olive oil', amount: 3, unit: 'tbsp' },
      { name: 'Garlic', amount: 4, unit: 'cloves' },
    ],
    servings: 2,
  },
  {
    id: 'mock-2',
    name: 'Spaghetti Carbonara Classique',
    description:
      'The Roman classic done right — silky egg-and-Pecorino sauce, crispy guanciale, and freshly cracked black pepper.',
    imageUrl:
      'https://img.hellofresh.com/hellofresh_s3/image/upload/f_auto,fl_lossy,q_auto,w_500/hellofresh_website/us/cms-content/2022/05/17115707/HF_APR22_R_W20_US_PD_7306-High-Res.jpg',
    prepTime: 25,
    difficulty: 'Medium',
    cuisines: ['Italian'],
    tags: ['Quick', 'Comfort Food'],
    ingredients: [
      { name: 'Spaghetti', amount: 200, unit: 'g' },
      { name: 'Pancetta', amount: 150, unit: 'g' },
      { name: 'Eggs', amount: 3, unit: 'pieces' },
      { name: 'Pecorino Romano', amount: 60, unit: 'g' },
      { name: 'Black pepper', amount: 1, unit: 'tsp' },
    ],
    servings: 2,
  },
  {
    id: 'mock-3',
    name: 'Waterzooi de Poulet Gantois',
    description:
      "Belgium's beloved Ghent-style chicken stew with vegetables in a rich creamy broth — pure comfort in a bowl.",
    imageUrl:
      'https://img.hellofresh.com/hellofresh_s3/image/upload/f_auto,fl_lossy,q_auto,w_500/hellofresh_website/us/cms-content/2022/01/25155950/HF_JAN22_R_W05_US_PD_6553-High-Res.jpg',
    prepTime: 45,
    difficulty: 'Medium',
    cuisines: ['Belgian'],
    tags: ['Traditional', 'Hearty'],
    ingredients: [
      { name: 'Chicken pieces', amount: 600, unit: 'g' },
      { name: 'Carrots', amount: 2, unit: 'pieces' },
      { name: 'Leeks', amount: 2, unit: 'pieces' },
      { name: 'Cream', amount: 200, unit: 'ml' },
      { name: 'Potatoes', amount: 400, unit: 'g' },
      { name: 'Celery', amount: 2, unit: 'stalks' },
    ],
    servings: 4,
  },
  {
    id: 'mock-4',
    name: 'Moules-Frites Belges',
    description:
      'Classic Belgian mussels steamed in white wine, shallots, and parsley — served with crispy golden fries.',
    imageUrl:
      'https://img.hellofresh.com/hellofresh_s3/image/upload/f_auto,fl_lossy,q_auto,w_500/hellofresh_website/us/cms-content/2022/08/22135251/HF_AUG22_R_W34_US_PD_8065-High-Res.jpg',
    prepTime: 30,
    difficulty: 'Easy',
    cuisines: ['Belgian'],
    tags: ['Seafood', 'Classic'],
    ingredients: [
      { name: 'Mussels', amount: 1, unit: 'kg' },
      { name: 'Shallots', amount: 3, unit: 'pieces' },
      { name: 'White wine', amount: 150, unit: 'ml' },
      { name: 'Parsley', amount: 1, unit: 'bunch' },
      { name: 'Fries', amount: 400, unit: 'g' },
    ],
    servings: 2,
  },
  {
    id: 'mock-5',
    name: 'Risotto ai Funghi Porcini',
    description:
      'Creamy Arborio rice slowly cooked with dried porcini mushrooms, white wine, Parmesan, and a touch of truffle.',
    imageUrl:
      'https://img.hellofresh.com/hellofresh_s3/image/upload/f_auto,fl_lossy,q_auto,w_500/hellofresh_website/us/cms-content/2022/10/17160614/HF_OCT22_R_W43_US_PD_8826-High-Res.jpg',
    prepTime: 35,
    difficulty: 'Medium',
    cuisines: ['Italian'],
    tags: ['Vegetarian', 'Comfort Food'],
    ingredients: [
      { name: 'Arborio rice', amount: 300, unit: 'g' },
      { name: 'Porcini mushrooms', amount: 30, unit: 'g' },
      { name: 'Parmesan', amount: 80, unit: 'g' },
      { name: 'White wine', amount: 100, unit: 'ml' },
      { name: 'Vegetable stock', amount: 1, unit: 'L' },
      { name: 'Shallots', amount: 2, unit: 'pieces' },
    ],
    servings: 2,
  },
  {
    id: 'mock-6',
    name: 'Stoemp aux Carottes et Lardons',
    description:
      "Classic Belgian mashed potato and carrot stoemp with smoky bacon lardons — the ultimate winter comfort food.",
    imageUrl:
      'https://img.hellofresh.com/hellofresh_s3/image/upload/f_auto,fl_lossy,q_auto,w_500/hellofresh_website/us/cms-content/2022/02/14153308/HF_FEB22_R_W08_US_PD_6740-High-Res.jpg',
    prepTime: 35,
    difficulty: 'Easy',
    cuisines: ['Belgian'],
    tags: ['Traditional', 'Family Friendly'],
    ingredients: [
      { name: 'Potatoes', amount: 600, unit: 'g' },
      { name: 'Carrots', amount: 300, unit: 'g' },
      { name: 'Lardons', amount: 150, unit: 'g' },
      { name: 'Butter', amount: 50, unit: 'g' },
      { name: 'Milk', amount: 100, unit: 'ml' },
    ],
    servings: 2,
  },
]

function mapHFItem(item: Record<string, unknown>): HFMeal {
  const imageBase =
    'https://img.hellofresh.com/hellofresh_s3/image/upload/f_auto,fl_lossy,q_auto,w_500/'
  const imagePath = (item.imagePath as string) ?? ''
  const imageUrl = imagePath.startsWith('http') ? imagePath : `${imageBase}${imagePath}`

  const cuisines = Array.isArray(item.cuisines)
    ? (item.cuisines as Array<{ name: string }>).map((c) => c.name).filter(Boolean)
    : []

  const tags = Array.isArray(item.tags)
    ? (item.tags as Array<{ name: string }>).map((t) => t.name).filter(Boolean)
    : []

  const ingredients = Array.isArray(item.ingredients)
    ? (item.ingredients as Array<Record<string, unknown>>).map((ing) => ({
        name: String(ing.name ?? ing.ingredient ?? ''),
        amount: Number(ing.amount ?? 0),
        unit: String(ing.unit ?? ''),
      }))
    : []

  const yields = Array.isArray(item.yields)
    ? (item.yields as Array<{ yields: number }>)
    : []
  const servings = yields.length > 0 ? (yields[0].yields ?? 2) : 2

  return {
    id: String(item.id ?? item._id ?? Math.random()),
    name: String(item.name ?? ''),
    description: String(item.description ?? item.headline ?? ''),
    imageUrl,
    prepTime: parseIsoDuration(String(item.prepTime ?? 'PT30M')),
    difficulty: String(item.difficulty ?? 'Medium'),
    cuisines,
    tags,
    ingredients,
    servings: Number(servings),
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const skip = searchParams.get('skip') ?? '0'
  const take = searchParams.get('take') ?? '20'

  const locales = ['en-BE', 'nl-BE']
  let meals: HFMeal[] = []

  for (const locale of locales) {
    try {
      const url = `https://www.hellofresh.com/gw/recipes/recipes/search?locale=${locale}&country=BE&take=${take}&skip=${skip}`
      const res = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (compatible; MealPlanner/1.0)',
        },
        next: { revalidate: 300 },
      })

      if (!res.ok) continue

      const data = await res.json() as Record<string, unknown>
      const items = Array.isArray(data.items)
        ? (data.items as Array<Record<string, unknown>>)
        : Array.isArray((data as Record<string, unknown[]>).recipes)
          ? ((data as Record<string, unknown[]>).recipes as Array<Record<string, unknown>>)
          : []

      if (items.length > 0) {
        meals = items.map(mapHFItem)
        break
      }
    } catch {
      // try next locale
    }
  }

  if (meals.length === 0) {
    meals = MOCK_MEALS
  }

  return NextResponse.json({ meals })
}

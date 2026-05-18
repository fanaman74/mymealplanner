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
  steps?: string[]
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
  // ── French ──────────────────────────────────────────────────────
  { id: 'm-fr-1', name: 'Poulet Rôti aux Herbes de Provence', description: 'Roasted chicken with Provençal herbs and golden potatoes.', imageUrl: '', prepTime: 40, difficulty: 'Easy', cuisines: ['French'], tags: ['Family Friendly', 'Classic'],
    ingredients: [{ name: 'chicken thighs', amount: 4, unit: 'pcs' }, { name: 'potatoes', amount: 500, unit: 'g' }, { name: 'herbes de provence', amount: 2, unit: 'tbsp' }, { name: 'olive oil', amount: 3, unit: 'tbsp' }, { name: 'garlic', amount: 4, unit: 'pcs' }], servings: 4 },
  { id: 'm-fr-2', name: 'Boeuf Bourguignon', description: 'Slow-braised beef in Burgundy wine with mushrooms, pearl onions and lardons.', imageUrl: '', prepTime: 90, difficulty: 'Medium', cuisines: ['French'], tags: ['Hearty', 'Classic'],
    ingredients: [{ name: 'beef chuck', amount: 800, unit: 'g' }, { name: 'red wine', amount: 500, unit: 'ml' }, { name: 'mushrooms', amount: 200, unit: 'g' }, { name: 'pearl onions', amount: 150, unit: 'g' }, { name: 'lardons', amount: 100, unit: 'g' }], servings: 4 },
  // ── Italian ──────────────────────────────────────────────────────
  { id: 'm-it-1', name: 'Spaghetti Carbonara', description: 'Silky egg-and-Pecorino sauce with crispy pancetta and black pepper.', imageUrl: '', prepTime: 25, difficulty: 'Medium', cuisines: ['Italian'], tags: ['Quick', 'Comfort Food'],
    ingredients: [{ name: 'spaghetti', amount: 200, unit: 'g' }, { name: 'pancetta', amount: 150, unit: 'g' }, { name: 'eggs', amount: 3, unit: 'pcs' }, { name: 'pecorino romano', amount: 60, unit: 'g' }, { name: 'black pepper', amount: 1, unit: 'tsp' }], servings: 2 },
  { id: 'm-it-2', name: 'Lasagne al Forno', description: 'Layers of fresh pasta, rich meat ragù, and béchamel baked golden.', imageUrl: '', prepTime: 70, difficulty: 'Medium', cuisines: ['Italian'], tags: ['Family Friendly', 'Comfort Food'],
    ingredients: [{ name: 'lasagne sheets', amount: 250, unit: 'g' }, { name: 'ground beef', amount: 400, unit: 'g' }, { name: 'tomato sauce', amount: 400, unit: 'ml' }, { name: 'béchamel sauce', amount: 300, unit: 'ml' }, { name: 'parmesan', amount: 80, unit: 'g' }], servings: 4 },
  { id: 'm-it-3', name: 'Risotto ai Funghi Porcini', description: 'Creamy Arborio rice with porcini mushrooms, white wine, and Parmesan.', imageUrl: '', prepTime: 35, difficulty: 'Medium', cuisines: ['Italian'], tags: ['Vegetarian', 'Comfort Food'],
    ingredients: [{ name: 'arborio rice', amount: 300, unit: 'g' }, { name: 'porcini mushrooms', amount: 30, unit: 'g' }, { name: 'parmesan', amount: 80, unit: 'g' }, { name: 'white wine', amount: 100, unit: 'ml' }, { name: 'vegetable stock', amount: 1, unit: 'l' }], servings: 2 },
  // ── Belgian ──────────────────────────────────────────────────────
  { id: 'm-be-1', name: 'Waterzooi de Poulet Gantois', description: "Ghent-style chicken stew in a rich creamy vegetable broth.", imageUrl: '', prepTime: 45, difficulty: 'Medium', cuisines: ['Belgian'], tags: ['Traditional', 'Hearty'],
    ingredients: [{ name: 'chicken pieces', amount: 600, unit: 'g' }, { name: 'carrots', amount: 2, unit: 'pcs' }, { name: 'leeks', amount: 2, unit: 'pcs' }, { name: 'cream', amount: 200, unit: 'ml' }, { name: 'potatoes', amount: 400, unit: 'g' }], servings: 4 },
  { id: 'm-be-2', name: 'Moules-Frites Belges', description: 'Mussels steamed in white wine with shallots, served with golden fries.', imageUrl: '', prepTime: 30, difficulty: 'Easy', cuisines: ['Belgian'], tags: ['Seafood', 'Pescatarian', 'Classic'],
    ingredients: [{ name: 'mussels', amount: 1, unit: 'kg' }, { name: 'shallots', amount: 3, unit: 'pcs' }, { name: 'white wine', amount: 150, unit: 'ml' }, { name: 'parsley', amount: 1, unit: 'pcs' }, { name: 'fries', amount: 400, unit: 'g' }], servings: 2 },
  // ── Spanish ──────────────────────────────────────────────────────
  { id: 'm-es-1', name: 'Paella Valenciana', description: 'Saffron-infused rice with chicken, chorizo, and shellfish from Valencia.', imageUrl: '', prepTime: 55, difficulty: 'Medium', cuisines: ['Spanish'], tags: ['Family Friendly', 'Seafood', 'Pescatarian'],
    ingredients: [{ name: 'paella rice', amount: 300, unit: 'g' }, { name: 'chicken thighs', amount: 400, unit: 'g' }, { name: 'prawns', amount: 200, unit: 'g' }, { name: 'saffron', amount: 1, unit: 'tsp' }, { name: 'paprika', amount: 2, unit: 'tsp' }], servings: 4 },
  { id: 'm-es-2', name: 'Tortilla Española', description: 'Classic Spanish potato and egg omelette — simple, golden, perfect.', imageUrl: '', prepTime: 35, difficulty: 'Easy', cuisines: ['Spanish'], tags: ['Vegetarian', 'Quick'],
    ingredients: [{ name: 'eggs', amount: 6, unit: 'pcs' }, { name: 'potatoes', amount: 500, unit: 'g' }, { name: 'onion', amount: 1, unit: 'pcs' }, { name: 'olive oil', amount: 4, unit: 'tbsp' }, { name: 'salt', amount: 1, unit: 'tsp' }], servings: 4 },
  // ── Greek ────────────────────────────────────────────────────────
  { id: 'm-gr-1', name: 'Moussaka', description: 'Layers of spiced lamb mince, aubergine, and creamy béchamel.', imageUrl: '', prepTime: 75, difficulty: 'Hard', cuisines: ['Greek'], tags: ['Hearty', 'Classic'],
    ingredients: [{ name: 'ground lamb', amount: 500, unit: 'g' }, { name: 'aubergine', amount: 2, unit: 'pcs' }, { name: 'tomato sauce', amount: 300, unit: 'ml' }, { name: 'béchamel', amount: 300, unit: 'ml' }, { name: 'cinnamon', amount: 1, unit: 'tsp' }], servings: 4 },
  { id: 'm-gr-2', name: 'Chicken Souvlaki', description: 'Grilled chicken skewers with tzatziki, pita, and a fresh Greek salad.', imageUrl: '', prepTime: 30, difficulty: 'Easy', cuisines: ['Greek'], tags: ['Quick', 'Grilled'],
    ingredients: [{ name: 'chicken breast', amount: 600, unit: 'g' }, { name: 'lemon', amount: 2, unit: 'pcs' }, { name: 'oregano', amount: 2, unit: 'tsp' }, { name: 'tzatziki', amount: 200, unit: 'g' }, { name: 'pita bread', amount: 4, unit: 'pcs' }], servings: 4 },
  // ── Turkish ──────────────────────────────────────────────────────
  { id: 'm-tr-1', name: 'Köfte & Bulgur Pilav', description: 'Spiced lamb meatballs over fluffy bulgur wheat with roasted tomatoes.', imageUrl: '', prepTime: 35, difficulty: 'Easy', cuisines: ['Turkish'], tags: ['Family Friendly'],
    ingredients: [{ name: 'ground lamb', amount: 400, unit: 'g' }, { name: 'bulgur wheat', amount: 200, unit: 'g' }, { name: 'cumin', amount: 2, unit: 'tsp' }, { name: 'paprika', amount: 1, unit: 'tsp' }, { name: 'tomatoes', amount: 3, unit: 'pcs' }], servings: 4 },
  { id: 'm-tr-2', name: 'İmam Bayıldı', description: 'Braised aubergines stuffed with caramelised onions, tomatoes and herbs.', imageUrl: '', prepTime: 50, difficulty: 'Medium', cuisines: ['Turkish'], tags: ['Vegetarian', 'Vegan'],
    ingredients: [{ name: 'aubergine', amount: 3, unit: 'pcs' }, { name: 'onion', amount: 2, unit: 'pcs' }, { name: 'tomatoes', amount: 4, unit: 'pcs' }, { name: 'garlic', amount: 4, unit: 'pcs' }, { name: 'olive oil', amount: 5, unit: 'tbsp' }], servings: 4 },
  // ── Asian ────────────────────────────────────────────────────────
  { id: 'm-as-1', name: 'Beef & Broccoli Stir-fry', description: 'Tender beef strips and crisp broccoli in a savory oyster sauce glaze.', imageUrl: '', prepTime: 25, difficulty: 'Easy', cuisines: ['Asian'], tags: ['Quick', 'Family Friendly'],
    ingredients: [{ name: 'beef sirloin', amount: 400, unit: 'g' }, { name: 'broccoli', amount: 300, unit: 'g' }, { name: 'oyster sauce', amount: 3, unit: 'tbsp' }, { name: 'soy sauce', amount: 2, unit: 'tbsp' }, { name: 'jasmine rice', amount: 200, unit: 'g' }], servings: 2 },
  { id: 'm-as-2', name: 'Vegetable Fried Rice', description: 'Wok-fried rice with egg, vegetables, and a splash of soy and sesame.', imageUrl: '', prepTime: 20, difficulty: 'Easy', cuisines: ['Asian'], tags: ['Vegetarian', 'Quick'],
    ingredients: [{ name: 'cooked rice', amount: 400, unit: 'g' }, { name: 'eggs', amount: 3, unit: 'pcs' }, { name: 'mixed vegetables', amount: 250, unit: 'g' }, { name: 'soy sauce', amount: 3, unit: 'tbsp' }, { name: 'sesame oil', amount: 1, unit: 'tbsp' }], servings: 2 },
  // ── Japanese ─────────────────────────────────────────────────────
  { id: 'm-jp-1', name: 'Teriyaki Salmon', description: 'Glazed salmon with homemade teriyaki sauce, steamed rice, and edamame.', imageUrl: '', prepTime: 25, difficulty: 'Easy', cuisines: ['Japanese'], tags: ['Pescatarian', 'Quick'],
    ingredients: [{ name: 'salmon fillet', amount: 4, unit: 'pcs' }, { name: 'soy sauce', amount: 3, unit: 'tbsp' }, { name: 'mirin', amount: 2, unit: 'tbsp' }, { name: 'honey', amount: 1, unit: 'tbsp' }, { name: 'jasmine rice', amount: 200, unit: 'g' }], servings: 2 },
  { id: 'm-jp-2', name: 'Tonkotsu Ramen', description: 'Rich pork bone broth with chashu pork, soft-boiled egg, and noodles.', imageUrl: '', prepTime: 40, difficulty: 'Medium', cuisines: ['Japanese'], tags: ['Hearty', 'Comfort Food'],
    ingredients: [{ name: 'ramen noodles', amount: 200, unit: 'g' }, { name: 'pork belly', amount: 300, unit: 'g' }, { name: 'soy sauce', amount: 3, unit: 'tbsp' }, { name: 'eggs', amount: 2, unit: 'pcs' }, { name: 'spring onion', amount: 3, unit: 'pcs' }], servings: 2 },
  // ── Thai ─────────────────────────────────────────────────────────
  { id: 'm-th-1', name: 'Pad Thai', description: 'Stir-fried rice noodles with shrimp, egg, bean sprouts and peanuts.', imageUrl: '', prepTime: 30, difficulty: 'Medium', cuisines: ['Thai'], tags: ['Quick', 'Pescatarian'],
    ingredients: [{ name: 'rice noodles', amount: 200, unit: 'g' }, { name: 'shrimp', amount: 200, unit: 'g' }, { name: 'eggs', amount: 2, unit: 'pcs' }, { name: 'fish sauce', amount: 2, unit: 'tbsp' }, { name: 'peanuts', amount: 50, unit: 'g' }], servings: 2 },
  { id: 'm-th-2', name: 'Green Curry with Tofu', description: 'Fragrant coconut green curry with tofu, courgette and Thai basil.', imageUrl: '', prepTime: 30, difficulty: 'Easy', cuisines: ['Thai'], tags: ['Vegetarian', 'Vegan'],
    ingredients: [{ name: 'firm tofu', amount: 300, unit: 'g' }, { name: 'coconut milk', amount: 400, unit: 'ml' }, { name: 'green curry paste', amount: 2, unit: 'tbsp' }, { name: 'courgette', amount: 1, unit: 'pcs' }, { name: 'thai basil', amount: 1, unit: 'pcs' }], servings: 2 },
  // ── Indian ───────────────────────────────────────────────────────
  { id: 'm-in-1', name: 'Butter Chicken', description: 'Tender chicken in a velvety tomato-cream sauce with warming spices.', imageUrl: '', prepTime: 40, difficulty: 'Easy', cuisines: ['Indian'], tags: ['Family Friendly', 'Comfort Food'],
    ingredients: [{ name: 'chicken breast', amount: 600, unit: 'g' }, { name: 'tomato purée', amount: 400, unit: 'ml' }, { name: 'cream', amount: 150, unit: 'ml' }, { name: 'garam masala', amount: 2, unit: 'tsp' }, { name: 'basmati rice', amount: 200, unit: 'g' }], servings: 4 },
  { id: 'm-in-2', name: 'Dal Tadka', description: 'Yellow lentils tempered with cumin, garlic, and chilli — served with naan.', imageUrl: '', prepTime: 35, difficulty: 'Easy', cuisines: ['Indian'], tags: ['Vegetarian', 'Vegan'],
    ingredients: [{ name: 'yellow lentils', amount: 250, unit: 'g' }, { name: 'cumin seeds', amount: 1, unit: 'tsp' }, { name: 'garlic', amount: 4, unit: 'pcs' }, { name: 'turmeric', amount: 1, unit: 'tsp' }, { name: 'naan bread', amount: 4, unit: 'pcs' }], servings: 4 },
  // ── Mexican ──────────────────────────────────────────────────────
  { id: 'm-mx-1', name: 'Tacos al Pastor', description: 'Marinated pork with pineapple, cilantro and salsa in soft corn tortillas.', imageUrl: '', prepTime: 35, difficulty: 'Easy', cuisines: ['Mexican'], tags: ['Quick', 'Family Friendly'],
    ingredients: [{ name: 'pork shoulder', amount: 500, unit: 'g' }, { name: 'corn tortillas', amount: 8, unit: 'pcs' }, { name: 'pineapple', amount: 150, unit: 'g' }, { name: 'chipotle paste', amount: 2, unit: 'tbsp' }, { name: 'cilantro', amount: 1, unit: 'pcs' }], servings: 4 },
  { id: 'm-mx-2', name: 'Black Bean Enchiladas', description: 'Soft tortillas stuffed with spiced black beans and smothered in salsa.', imageUrl: '', prepTime: 40, difficulty: 'Easy', cuisines: ['Mexican'], tags: ['Vegetarian', 'Vegan'],
    ingredients: [{ name: 'black beans', amount: 400, unit: 'g' }, { name: 'flour tortillas', amount: 8, unit: 'pcs' }, { name: 'enchilada sauce', amount: 400, unit: 'ml' }, { name: 'cumin', amount: 2, unit: 'tsp' }, { name: 'avocado', amount: 2, unit: 'pcs' }], servings: 4 },
  // ── American ─────────────────────────────────────────────────────
  { id: 'm-us-1', name: 'Classic Smash Burger', description: 'Double smash patties with American cheese, pickles, and special sauce.', imageUrl: '', prepTime: 20, difficulty: 'Easy', cuisines: ['American'], tags: ['Quick', 'Family Friendly'],
    ingredients: [{ name: 'ground beef', amount: 400, unit: 'g' }, { name: 'burger buns', amount: 4, unit: 'pcs' }, { name: 'american cheese', amount: 4, unit: 'pcs' }, { name: 'pickles', amount: 8, unit: 'pcs' }, { name: 'mustard', amount: 2, unit: 'tbsp' }], servings: 4 },
  { id: 'm-us-2', name: 'BBQ Baby Back Ribs', description: 'Slow-cooked pork ribs glazed with smoky BBQ sauce and served with slaw.', imageUrl: '', prepTime: 120, difficulty: 'Medium', cuisines: ['American'], tags: ['Hearty', 'Family Friendly'],
    ingredients: [{ name: 'pork ribs', amount: 1, unit: 'kg' }, { name: 'bbq sauce', amount: 300, unit: 'ml' }, { name: 'brown sugar', amount: 2, unit: 'tbsp' }, { name: 'smoked paprika', amount: 2, unit: 'tsp' }, { name: 'coleslaw mix', amount: 300, unit: 'g' }], servings: 4 },
  // ── Ghanaian ─────────────────────────────────────────────────────
  { id: 'm-gh-1', name: 'Jollof Rice with Chicken', description: 'West African one-pot rice cooked in spiced tomato sauce with grilled chicken.', imageUrl: '', prepTime: 60, difficulty: 'Medium', cuisines: ['Ghanaian'], tags: ['Family Friendly', 'Hearty'],
    ingredients: [{ name: 'long grain rice', amount: 400, unit: 'g' }, { name: 'chicken pieces', amount: 600, unit: 'g' }, { name: 'tomato purée', amount: 200, unit: 'ml' }, { name: 'scotch bonnet', amount: 1, unit: 'pcs' }, { name: 'onion', amount: 2, unit: 'pcs' }], servings: 4 },
  { id: 'm-gh-2', name: 'Groundnut Soup', description: 'Rich peanut-based soup with chicken or tofu, served over fufu or rice.', imageUrl: '', prepTime: 50, difficulty: 'Medium', cuisines: ['Ghanaian'], tags: ['Hearty', 'Family Friendly'],
    ingredients: [{ name: 'groundnut paste', amount: 200, unit: 'g' }, { name: 'chicken thighs', amount: 500, unit: 'g' }, { name: 'tomatoes', amount: 3, unit: 'pcs' }, { name: 'ginger', amount: 2, unit: 'tsp' }, { name: 'rice', amount: 300, unit: 'g' }], servings: 4 },
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

  const steps = Array.isArray(item.steps)
    ? (item.steps as Array<Record<string, unknown>>)
        .sort((a, b) => Number(a.index ?? 0) - Number(b.index ?? 0))
        .map(s => String(s.instructions ?? s.description ?? ''))
        .filter(Boolean)
    : undefined

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
    steps,
  }
}

// Map our diet types to HF tag slugs
const DIET_TAG: Record<string, string> = {
  vegetarian: 'vegetarian',
  vegan: 'vegan',
  pescatarian: 'pescatarian',
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const skip = searchParams.get('skip') ?? '0'
  const take = searchParams.get('take') ?? '20'
  const dietType = searchParams.get('dietType') ?? ''
  const cuisines = searchParams.getAll('cuisines')

  const locales = ['en-BE', 'nl-BE']
  let meals: HFMeal[] = []

  for (const locale of locales) {
    try {
      const params = new URLSearchParams({ locale, country: 'BE', take, skip })
      if (DIET_TAG[dietType]) params.append('tags[]', DIET_TAG[dietType])
      for (const c of cuisines) params.append('cuisines[]', c.toLowerCase())

      const url = `https://www.hellofresh.com/gw/recipes/recipes/search?${params}`
      const res = await fetch(url, {
        headers: { Accept: 'application/json', 'User-Agent': 'Mozilla/5.0 (compatible; MealPlanner/1.0)' },
        next: { revalidate: 300 },
      })
      if (!res.ok) continue
      const data = await res.json() as Record<string, unknown>
      const items = Array.isArray(data.items)
        ? (data.items as Array<Record<string, unknown>>)
        : Array.isArray((data as Record<string, unknown[]>).recipes)
          ? ((data as Record<string, unknown[]>).recipes as Array<Record<string, unknown>>)
          : []
      if (items.length > 0) { meals = items.map(mapHFItem); break }
    } catch { /* try next locale */ }
  }

  // Client-side filter mock meals by diet/cuisine when API unavailable
  if (meals.length === 0) {
    const filtered = MOCK_MEALS.filter(m => {
      if (dietType === 'vegetarian' && !m.tags.some(t => /vegetarian/i.test(t))) return false
      if (dietType === 'vegan' && !m.tags.some(t => /vegan/i.test(t))) return false
      if (dietType === 'pescatarian' && !m.tags.some(t => /seafood|fish|pescatarian/i.test(t))) return false
      if (cuisines.length > 0 && !cuisines.some(c => m.cuisines.some(mc => mc.toLowerCase() === c.toLowerCase()))) return false
      return true
    })
    // Need at least 7 unique meals — fall back to full set if filtered too few
    meals = filtered.length >= 7 ? filtered : MOCK_MEALS
  }

  return NextResponse.json({ meals })
}

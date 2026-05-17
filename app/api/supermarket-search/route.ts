// app/api/supermarket-search/route.ts
import { NextRequest, NextResponse } from 'next/server'

export type StoreName = 'colruyt' | 'delhaize' | 'carrefour' | 'ah'

export interface PriceResult {
  name: string
  price: number
  pricePerUnit?: string
  url: string
  store: StoreName
}

export interface ItemSearchResult {
  item: string
  colruyt?: PriceResult
  delhaize?: PriceResult
  carrefour?: PriceResult
  ah?: PriceResult
  colruytSearchUrl: string
  delhaizeSearchUrl: string
  carrefourSearchUrl: string
  ahSearchUrl: string
  aldiSearchUrl: string
  lidlSearchUrl: string
}

// ── Colruyt ────────────────────────────────────────────────────────────────
interface ColruytProduct {
  name?: string; description?: string
  price?: { basicPrice?: number; price?: number }
  measuringUnitPrice?: { price?: number; measuringUnit?: string }
}

async function searchColruyt(item: string): Promise<PriceResult | undefined> {
  try {
    const enc = encodeURIComponent(item)
    const res = await fetch(
      `https://ecg-proxy.colruyt.be/co3be/v2/nl/products?searchText=${enc}&pageSize=3`,
      { headers: { Accept: 'application/json', 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(8000) }
    )
    if (!res.ok) return undefined
    const data = await res.json() as { products?: ColruytProduct[] }
    const p = data.products?.[0]
    if (!p) return undefined
    const price = p.price?.basicPrice ?? p.price?.price
    if (!price) return undefined
    return {
      name: p.name ?? item, price,
      pricePerUnit: p.measuringUnitPrice
        ? `€${p.measuringUnitPrice.price?.toFixed(2)}/${p.measuringUnitPrice.measuringUnit}`
        : undefined,
      url: `https://www.colruyt.be/nl/zoeken?searchTerm=${enc}`,
      store: 'colruyt',
    }
  } catch { return undefined }
}

// ── Delhaize ───────────────────────────────────────────────────────────────
async function searchDelhaize(item: string): Promise<PriceResult | undefined> {
  try {
    const enc = encodeURIComponent(item)
    const res = await fetch(
      `https://www.delhaize.be/api/2.0/products?query=${enc}&pageSize=3`,
      { headers: { Accept: 'application/json', 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(8000) }
    )
    if (!res.ok) return undefined
    const data = await res.json() as { products?: { name?: string; price?: { value?: number }; url?: string }[] }
    const p = data.products?.[0]
    if (!p) return undefined
    const price = p.price?.value
    if (!price) return undefined
    return {
      name: p.name ?? item, price,
      url: p.url ? `https://www.delhaize.be${p.url}` : `https://www.delhaize.be/nl-BE/search?q=${enc}`,
      store: 'delhaize',
    }
  } catch { return undefined }
}

// ── Carrefour ──────────────────────────────────────────────────────────────
async function searchCarrefour(item: string): Promise<PriceResult | undefined> {
  try {
    const enc = encodeURIComponent(item)
    const res = await fetch(
      `https://www.carrefour.be/api/products?lang=nl&sortBy=relevance&noProducts=3&query=${enc}`,
      { headers: { Accept: 'application/json', 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(8000) }
    )
    if (!res.ok) return undefined
    const data = await res.json() as { hits?: { name?: string; price?: { value?: number; current?: number }; url?: string }[] }
    const p = data.hits?.[0]
    if (!p) return undefined
    const price = p.price?.current ?? p.price?.value
    if (!price) return undefined
    return {
      name: p.name ?? item, price,
      url: p.url ? `https://www.carrefour.be${p.url}` : `https://www.carrefour.be/nl/zoeken?q=${enc}`,
      store: 'carrefour',
    }
  } catch { return undefined }
}

// ── AH Belgium (Apify) ─────────────────────────────────────────────────────
async function searchAHBelgium(item: string, apifyToken: string): Promise<PriceResult | undefined> {
  try {
    const enc = encodeURIComponent(item)
    const res = await fetch(
      `https://api.apify.com/v2/acts/apify~rag-web-browser/run-sync-get-dataset-items?token=${apifyToken}&timeout=25`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: `${item} prijs site:ah.be/producten`, maxResults: 1, outputFormats: ['markdown'] }),
        signal: AbortSignal.timeout(30000),
      }
    )
    if (!res.ok) return undefined
    const data = await res.json()
    const content: string = data?.[0]?.markdown ?? data?.[0]?.text ?? ''
    const priceMatch = content.match(/€\s*(\d+[,.]?\d*)/)?.[1]
    const price = priceMatch ? parseFloat(priceMatch.replace(',', '.')) : undefined
    if (!price) return undefined
    return {
      name: content.match(/^#+\s*(.+)/m)?.[1]?.trim() ?? item,
      price,
      url: `https://www.ah.be/zoeken?query=${enc}`,
      store: 'ah',
    }
  } catch { return undefined }
}

// ── Route ──────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const { items, apifyToken = '' } = await req.json() as { items: string[]; apifyToken?: string }
    if (!items?.length) return NextResponse.json({ error: 'items array required' }, { status: 400 })

    const results: ItemSearchResult[] = await Promise.all(
      items.slice(0, 20).map(async (item): Promise<ItemSearchResult> => {
        const enc = encodeURIComponent(item)
        const [colruyt, delhaize, carrefour, ah] = await Promise.all([
          searchColruyt(item),
          searchDelhaize(item),
          searchCarrefour(item),
          apifyToken ? searchAHBelgium(item, apifyToken) : Promise.resolve(undefined),
        ])
        return {
          item, colruyt, delhaize, carrefour, ah,
          colruytSearchUrl:   `https://www.colruyt.be/nl/zoeken?searchTerm=${enc}`,
          delhaizeSearchUrl:  `https://www.delhaize.be/nl-BE/search?q=${enc}`,
          carrefourSearchUrl: `https://www.carrefour.be/nl/zoeken?q=${enc}`,
          ahSearchUrl:        `https://www.ah.be/zoeken?query=${enc}`,
          aldiSearchUrl:      `https://www.aldi.be/nl/producten.html?q=${enc}`,
          lidlSearchUrl:      `https://www.lidl.be/q/nl-BE?q=${enc}`,
        }
      })
    )

    return NextResponse.json({ results })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

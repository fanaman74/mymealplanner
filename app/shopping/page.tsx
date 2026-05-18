'use client'

import { useEffect, useState, useCallback } from 'react'
import { loadStorage } from '@/lib/storage'
import { buildShoppingList } from '@/lib/ingredients'
import { ShoppingList, ShoppingListItem } from '@/lib/types'
import type { ItemSearchResult, StoreName } from '@/app/api/supermarket-search/route'

// ── Design tokens (matches app palette) ─────────────────────────────────────
const GREEN   = '#41A05F'
const DARK    = '#1D2F2A'
const MIST    = '#D8E8D8'
const CREAM   = '#F4F6F3'
const SAFFRON = '#FC9F37'
const TOMATO  = '#C73E2E'

// ── Store metadata ───────────────────────────────────────────────────────────
const STORES: { key: StoreName; label: string; color: string; logo: string }[] = [
  { key: 'colruyt',   label: 'Colruyt',   color: '#E30613', logo: '🛒' },
  { key: 'delhaize',  label: 'Delhaize',  color: '#E4002B', logo: '🦁' },
  { key: 'carrefour', label: 'Carrefour', color: '#0066CC', logo: '🔵' },
  { key: 'ah',        label: 'AH',        color: '#00AEEF', logo: '🧡' },
]

const STORE_LABELS: Record<StoreName, string> = {
  colruyt: 'Colruyt', delhaize: 'Delhaize', carrefour: 'Carrefour', ah: 'Albert Heijn',
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function cheapestStore(result: ItemSearchResult): { store: StoreName; price: number } | null {
  let best: { store: StoreName; price: number } | null = null
  for (const s of STORES) {
    const p = result[s.key]?.price
    if (p !== undefined && (best === null || p < best.price)) {
      best = { store: s.key, price: p }
    }
  }
  return best
}

function storeTotal(results: ItemSearchResult[], store: StoreName): number {
  let total = 0
  let covered = 0
  for (const r of results) {
    const p = r[store]?.price
    if (p !== undefined) { total += p; covered++ }
  }
  return covered > 0 ? total : -1
}

function cheapestBasket(results: ItemSearchResult[]): StoreName | null {
  let best: { store: StoreName; total: number } | null = null
  for (const s of STORES) {
    const total = storeTotal(results, s.key)
    if (total >= 0 && (best === null || total < best.total)) {
      best = { store: s.key, total }
    }
  }
  return best?.store ?? null
}

// ── Component ────────────────────────────────────────────────────────────────
export default function ShoppingPage() {
  const [list, setList] = useState<ShoppingList | null>(null)
  const [apifyToken, setApifyToken] = useState('')
  const [results, setResults] = useState<ItemSearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  const [searched, setSearched] = useState(false)

  useEffect(() => {
    const { current, apifyToken: tok } = loadStorage()
    setList(buildShoppingList(current))
    setApifyToken(tok)
  }, [])

  const allItems: ShoppingListItem[] = list?.categories.flatMap(c => c.items) ?? []

  const handleCompare = useCallback(async () => {
    if (!allItems.length) return
    setLoading(true)
    setError('')
    setResults([])
    setProgress(0)
    setSearched(true)

    const BATCH = 5
    const names = allItems.map(i => i.name)
    const all: ItemSearchResult[] = []

    for (let i = 0; i < names.length; i += BATCH) {
      const batch = names.slice(i, i + BATCH)
      try {
        const res = await fetch('/api/supermarket-search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: batch, apifyToken }),
        })
        const data = await res.json() as { results?: ItemSearchResult[]; error?: string }
        if (data.results) {
          all.push(...data.results)
          setResults([...all])
        }
      } catch { /* continue with next batch */ }
      setProgress(Math.min(i + BATCH, names.length))
    }

    setLoading(false)
  }, [allItems, apifyToken])

  const best = results.length ? cheapestBasket(results) : null

  if (!list) {
    return <div style={{ padding: 40, fontFamily: 'system-ui', color: DARK }}>Loading…</div>
  }

  return (
    <div style={{ minHeight: '100vh', background: CREAM, fontFamily: 'system-ui, -apple-system, sans-serif' }}>

      {/* Header */}
      <header style={{
        background: '#fff', borderBottom: `2px solid ${GREEN}`,
        padding: '0 24px', height: 60,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: '0 2px 12px rgba(29,47,42,0.08)',
        position: 'sticky', top: 0, zIndex: 30,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <a href="/" style={{ color: DARK, textDecoration: 'none', fontSize: 13, opacity: 0.6 }}>← Back</a>
          <span style={{ opacity: 0.3 }}>|</span>
          <h1 style={{
            margin: 0, fontSize: 18, fontWeight: 700,
            fontFamily: "'Instrument Serif', serif", fontStyle: 'italic', color: DARK,
          }}>
            Shopping List &amp; Price Compare
          </h1>
        </div>
        <button
          onClick={handleCompare}
          disabled={loading || !allItems.length}
          style={{
            padding: '9px 22px', borderRadius: 999, border: 'none',
            background: loading ? '#aaa' : GREEN,
            color: '#fff', fontSize: 13, fontWeight: 700,
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', gap: 8,
            transition: 'background 0.15s',
          }}
        >
          {loading ? `Searching… (${progress}/${allItems.length})` : '🔍 Compare prices'}
        </button>
      </header>

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 20px 60px' }}>

        {/* Summary banner (after search) */}
        {best && !loading && (
          <div style={{
            marginBottom: 24, padding: '16px 24px', borderRadius: 14,
            background: GREEN, color: '#fff',
            display: 'flex', alignItems: 'center', gap: 16,
            boxShadow: '0 4px 16px rgba(65,160,95,0.3)',
          }}>
            <span style={{ fontSize: 28 }}>🏆</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>
                Cheapest basket: {STORE_LABELS[best]}
              </div>
              <div style={{ opacity: 0.85, fontSize: 13, marginTop: 2 }}>
                Total: €{storeTotal(results, best).toFixed(2)} for {results.filter(r => r[best!]?.price !== undefined).length} / {allItems.length} items found
              </div>
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 20 }}>
              {STORES.map(s => {
                const total = storeTotal(results, s.key)
                return total >= 0 ? (
                  <div key={s.key} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 11, opacity: 0.75, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
                    <div style={{
                      fontSize: 16, fontWeight: 700,
                      color: s.key === best ? SAFFRON : '#fff',
                    }}>€{total.toFixed(2)}</div>
                  </div>
                ) : null
              })}
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{
            marginBottom: 20, padding: '12px 18px', borderRadius: 10,
            background: '#FEF2F2', border: '1px solid #FECACA', color: TOMATO, fontSize: 13,
          }}>
            {error}
          </div>
        )}

        {/* Progress bar while loading */}
        {loading && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ height: 4, background: MIST, borderRadius: 2, overflow: 'hidden' }}>
              <div style={{
                height: '100%', background: GREEN, borderRadius: 2,
                width: `${allItems.length ? (progress / allItems.length) * 100 : 0}%`,
                transition: 'width 0.3s',
              }} />
            </div>
            <div style={{ fontSize: 12, color: '#666', marginTop: 6 }}>
              Searching {STORES.map(s => s.label).join(', ')}…
            </div>
          </div>
        )}

        {/* Main table */}
        {searched && results.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: DARK, color: '#fff' }}>
                  <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                    Item
                  </th>
                  <th style={{ padding: '10px 14px', textAlign: 'center', fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', opacity: 0.6 }}>
                    Qty
                  </th>
                  {STORES.map(s => (
                    <th key={s.key} style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 600, fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                      {s.logo} {s.label}
                    </th>
                  ))}
                  <th style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 600, fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', background: GREEN }}>
                    ✓ Cheapest
                  </th>
                </tr>
              </thead>
              <tbody>
                {allItems.map((item, i) => {
                  const result = results.find(r => r.item === item.name)
                  const best = result ? cheapestStore(result) : null
                  return (
                    <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : CREAM, borderBottom: `1px solid ${MIST}` }}>
                      <td style={{ padding: '10px 14px', fontWeight: 500, color: DARK, textTransform: 'capitalize' }}>
                        {item.name}
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'center', color: '#666', fontSize: 12 }}>
                        {item.quantity} {item.unit}
                      </td>
                      {STORES.map(s => {
                        const p = result?.[s.key]
                        const isCheapest = best?.store === s.key
                        return (
                          <td key={s.key} style={{ padding: '10px 14px', textAlign: 'center' }}>
                            {p ? (
                              <a
                                href={result?.[`${s.key}SearchUrl` as keyof ItemSearchResult] as string ?? '#'}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  display: 'inline-block',
                                  padding: '3px 10px', borderRadius: 6,
                                  background: isCheapest ? GREEN : 'transparent',
                                  color: isCheapest ? '#fff' : DARK,
                                  fontWeight: isCheapest ? 700 : 400,
                                  textDecoration: 'none',
                                  fontSize: 13,
                                }}
                              >
                                €{p.price.toFixed(2)}
                                {p.pricePerUnit && (
                                  <span style={{ display: 'block', fontSize: 10, opacity: 0.75 }}>{p.pricePerUnit}</span>
                                )}
                              </a>
                            ) : (
                              result ? (
                                <a
                                  href={result[`${s.key}SearchUrl` as keyof ItemSearchResult] as string ?? '#'}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{ color: '#bbb', fontSize: 11, textDecoration: 'none' }}
                                >
                                  search →
                                </a>
                              ) : (
                                <span style={{ color: '#ddd', fontSize: 11 }}>—</span>
                              )
                            )}
                          </td>
                        )
                      })}
                      <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                        {best ? (
                          <span style={{
                            padding: '3px 10px', borderRadius: 999,
                            background: SAFFRON + '33', color: DARK,
                            fontSize: 12, fontWeight: 600,
                          }}>
                            {STORE_LABELS[best.store]} €{best.price.toFixed(2)}
                          </span>
                        ) : result ? (
                          <span style={{ fontSize: 11, color: '#aaa' }}>no price</span>
                        ) : (
                          <span style={{ fontSize: 11, color: '#ddd' }}>pending…</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              {/* Totals row */}
              <tfoot>
                <tr style={{ background: DARK, color: '#fff' }}>
                  <td colSpan={2} style={{ padding: '10px 14px', fontWeight: 700, fontSize: 12 }}>
                    TOTAL (items found)
                  </td>
                  {STORES.map(s => {
                    const total = storeTotal(results, s.key)
                    return (
                      <td key={s.key} style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 700 }}>
                        {total >= 0 ? `€${total.toFixed(2)}` : '—'}
                      </td>
                    )
                  })}
                  <td style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 700, color: SAFFRON }}>
                    {best ? `${STORE_LABELS[best]} €${storeTotal(results, best).toFixed(2)}` : '—'}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        ) : (
          /* Pre-search: plain shopping list */
          <div>
            {!searched && (
              <p style={{ color: '#666', fontSize: 14, marginBottom: 20 }}>
                {allItems.length} items from this week&apos;s plan. Click &quot;Compare prices&quot; to find the cheapest supermarket for each item.
              </p>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
              {list.categories.map(cat => (
                <div key={cat.name} style={{
                  background: '#fff', borderRadius: 12, padding: '14px 16px',
                  border: `1px solid ${MIST}`,
                  boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                }}>
                  <h3 style={{
                    margin: '0 0 10px', fontSize: 11, fontWeight: 700,
                    textTransform: 'uppercase', letterSpacing: '0.08em', color: GREEN,
                  }}>
                    {cat.name}
                  </h3>
                  <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                    {cat.items.map((item, i) => (
                      <li key={i} style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
                        padding: '4px 0',
                        borderBottom: i < cat.items.length - 1 ? `1px solid ${MIST}` : 'none',
                        fontSize: 13,
                      }}>
                        <span style={{ color: DARK, textTransform: 'capitalize' }}>{item.name}</span>
                        <span style={{ color: '#888', fontSize: 11, marginLeft: 8 }}>{item.quantity} {item.unit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No week plan notice */}
        {allItems.length === 0 && (
          <div style={{
            textAlign: 'center', padding: '60px 20px', color: '#999',
          }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🛒</div>
            <p>No meals planned yet. <a href="/" style={{ color: GREEN }}>Add meals to your week</a> first.</p>
          </div>
        )}
      </main>
    </div>
  )
}

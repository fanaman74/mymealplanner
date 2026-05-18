'use client'

import { useEffect, useState, useCallback } from 'react'
import { loadStorage } from '@/lib/storage'
import { buildShoppingList } from '@/lib/ingredients'
import { ShoppingList, ShoppingListItem } from '@/lib/types'
import type { ItemSearchResult, StoreName } from '@/app/api/supermarket-search/route'

const GREEN     = '#41A05F'
const DARK      = '#1D2F2A'
const MIST      = '#D8E8D8'
const CREAM     = '#F4F6F3'
const SAFFRON   = '#FC9F37'
const TOMATO    = '#C73E2E'

const STORES: { key: StoreName; label: string; logo: string }[] = [
  { key: 'colruyt',   label: 'Colruyt',   logo: '🛒' },
  { key: 'delhaize',  label: 'Delhaize',  logo: '🦁' },
  { key: 'carrefour', label: 'Carrefour', logo: '🔵' },
  { key: 'ah',        label: 'AH',        logo: '🧡' },
]

const STORE_LABELS: Record<StoreName, string> = {
  colruyt: 'Colruyt', delhaize: 'Delhaize', carrefour: 'Carrefour', ah: 'Albert Heijn',
}

function cheapestStore(result: ItemSearchResult): { store: StoreName; price: number } | null {
  let best: { store: StoreName; price: number } | null = null
  for (const s of STORES) {
    const p = result[s.key]?.price
    if (p !== undefined && (best === null || p < best.price)) best = { store: s.key, price: p }
  }
  return best
}

function storeTotal(results: ItemSearchResult[], store: StoreName): number {
  let total = 0; let covered = 0
  for (const r of results) {
    const p = r[store]?.price
    if (p !== undefined) { total += p; covered++ }
  }
  return covered > 0 ? total : -1
}

function cheapestBasket(results: ItemSearchResult[]): StoreName | null {
  let best: { store: StoreName; total: number } | null = null
  for (const s of STORES) {
    const t = storeTotal(results, s.key)
    if (t >= 0 && (best === null || t < best.total)) best = { store: s.key, total: t }
  }
  return best?.store ?? null
}

export default function ShoppingComparePage() {
  const [list, setList] = useState<ShoppingList | null>(null)
  const [apifyToken, setApifyToken] = useState('')
  const [results, setResults] = useState<ItemSearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
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
        const data = await res.json() as { results?: ItemSearchResult[] }
        if (data.results) { all.push(...data.results); setResults([...all]) }
      } catch { /* continue */ }
      setProgress(Math.min(i + BATCH, names.length))
    }
    setLoading(false)
  }, [allItems, apifyToken])

  const best = results.length && !loading ? cheapestBasket(results) : null

  if (!list) return <div style={{ padding: 40, fontFamily: 'system-ui', color: DARK }}>Loading…</div>

  return (
    <div style={{ minHeight: '100vh', background: CREAM, fontFamily: 'system-ui, -apple-system, sans-serif' }}>

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
            🏪 Price Compare — This Week&apos;s List
          </h1>
        </div>
        <button
          onClick={handleCompare}
          disabled={loading || !allItems.length}
          style={{
            padding: '9px 22px', borderRadius: 999, border: 'none',
            background: loading || !allItems.length ? '#aaa' : GREEN,
            color: '#fff', fontSize: 13, fontWeight: 700,
            cursor: loading || !allItems.length ? 'not-allowed' : 'pointer',
            transition: 'background 0.15s',
          }}
        >
          {loading ? `Searching… (${progress}/${allItems.length})` : '🔍 Find best prices'}
        </button>
      </header>

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 20px 60px' }}>

        {best && !loading && (
          <div style={{
            marginBottom: 24, padding: '16px 24px', borderRadius: 14,
            background: GREEN, color: '#fff',
            display: 'flex', alignItems: 'center', gap: 16,
            boxShadow: '0 4px 16px rgba(65,160,95,0.3)', flexWrap: 'wrap',
          }}>
            <span style={{ fontSize: 28 }}>🏆</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>Cheapest basket: {STORE_LABELS[best]}</div>
              <div style={{ opacity: 0.85, fontSize: 13, marginTop: 2 }}>
                €{storeTotal(results, best).toFixed(2)} · {results.filter(r => r[best!]?.price !== undefined).length}/{allItems.length} items found
              </div>
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              {STORES.map(s => {
                const t = storeTotal(results, s.key)
                return t >= 0 ? (
                  <div key={s.key} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 11, opacity: 0.75, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: s.key === best ? SAFFRON : '#fff' }}>€{t.toFixed(2)}</div>
                  </div>
                ) : null
              })}
            </div>
          </div>
        )}

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
              Comparing Colruyt, Delhaize, Carrefour &amp; AH…
            </div>
          </div>
        )}

        {searched && results.length > 0 ? (
          <div style={{ overflowX: 'auto', borderRadius: 14, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, background: '#fff' }}>
              <thead>
                <tr style={{ background: DARK, color: '#fff' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Item</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: 11, opacity: 0.6, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Qty</th>
                  {STORES.map(s => (
                    <th key={s.key} style={{ padding: '12px 16px', textAlign: 'center', fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                      {s.logo} {s.label}
                    </th>
                  ))}
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', background: GREEN }}>✓ Best price</th>
                </tr>
              </thead>
              <tbody>
                {allItems.map((item, i) => {
                  const result = results.find(r => r.item === item.name)
                  const winner = result ? cheapestStore(result) : null
                  return (
                    <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : CREAM, borderBottom: `1px solid ${MIST}` }}>
                      <td style={{ padding: '10px 16px', fontWeight: 500, color: DARK, textTransform: 'capitalize' }}>{item.name}</td>
                      <td style={{ padding: '10px 16px', textAlign: 'center', color: '#888', fontSize: 12 }}>{item.quantity} {item.unit}</td>
                      {STORES.map(s => {
                        const p = result?.[s.key]
                        const isBest = winner?.store === s.key
                        return (
                          <td key={s.key} style={{ padding: '10px 16px', textAlign: 'center' }}>
                            {p ? (
                              <a
                                href={result?.[`${s.key}SearchUrl` as keyof ItemSearchResult] as string ?? '#'}
                                target="_blank" rel="noopener noreferrer"
                                style={{
                                  display: 'inline-block', padding: '3px 10px', borderRadius: 6,
                                  background: isBest ? GREEN : 'transparent',
                                  color: isBest ? '#fff' : DARK,
                                  fontWeight: isBest ? 700 : 400,
                                  textDecoration: 'none',
                                }}
                              >
                                €{p.price.toFixed(2)}
                                {p.pricePerUnit && <span style={{ display: 'block', fontSize: 10, opacity: 0.7 }}>{p.pricePerUnit}</span>}
                              </a>
                            ) : result ? (
                              <a href={result[`${s.key}SearchUrl` as keyof ItemSearchResult] as string ?? '#'} target="_blank" rel="noopener noreferrer" style={{ color: '#ccc', fontSize: 11, textDecoration: 'none' }}>search →</a>
                            ) : (
                              <span style={{ color: '#ddd', fontSize: 11 }}>…</span>
                            )}
                          </td>
                        )
                      })}
                      <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                        {winner ? (
                          <span style={{ padding: '3px 10px', borderRadius: 999, background: SAFFRON + '33', color: DARK, fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>
                            {STORE_LABELS[winner.store]} €{winner.price.toFixed(2)}
                          </span>
                        ) : (
                          <span style={{ fontSize: 11, color: '#bbb' }}>—</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr style={{ background: DARK, color: '#fff' }}>
                  <td colSpan={2} style={{ padding: '10px 16px', fontWeight: 700, fontSize: 12 }}>TOTAL</td>
                  {STORES.map(s => {
                    const t = storeTotal(results, s.key)
                    return <td key={s.key} style={{ padding: '10px 16px', textAlign: 'center', fontWeight: 700 }}>{t >= 0 ? `€${t.toFixed(2)}` : '—'}</td>
                  })}
                  <td style={{ padding: '10px 16px', textAlign: 'center', fontWeight: 700, color: SAFFRON }}>
                    {best ? `${STORE_LABELS[best]} €${storeTotal(results, best).toFixed(2)}` : '—'}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        ) : (
          !searched && (
            <div>
              <p style={{ color: '#666', fontSize: 14, marginBottom: 20 }}>
                {allItems.length} ingredients from this week&apos;s plan. Click <strong>Find best prices</strong> to compare across supermarkets.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
                {list.categories.map(cat => (
                  <div key={cat.name} style={{ background: '#fff', borderRadius: 12, padding: '14px 16px', border: `1px solid ${MIST}` }}>
                    <h3 style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: GREEN }}>{cat.name}</h3>
                    <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                      {cat.items.map((item, i) => (
                        <li key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', borderBottom: i < cat.items.length - 1 ? `1px solid ${MIST}` : 'none', fontSize: 13 }}>
                          <span style={{ color: DARK, textTransform: 'capitalize' }}>{item.name}</span>
                          <span style={{ color: '#888', fontSize: 11 }}>{item.quantity} {item.unit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )
        )}

        {allItems.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#999' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🍽</div>
            <p>No meals planned yet. <a href="/" style={{ color: GREEN }}>Plan your week first.</a></p>
          </div>
        )}
      </main>
    </div>
  )
}

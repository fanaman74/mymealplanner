'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { loadStorage } from '@/lib/storage'
import { buildShoppingList } from '@/lib/ingredients'
import type { ItemSearchResult, StoreName } from '@/app/api/supermarket-search/route'

// ── Design tokens ────────────────────────────────────────────────────────────
const GREEN     = '#41A05F'
const DARK      = '#1D2F2A'
const MIST      = '#D8E8D8'
const CREAM     = '#F4F6F3'
const SAFFRON   = '#FC9F37'
const TOMATO    = '#C73E2E'

// ── Store metadata ───────────────────────────────────────────────────────────
const STORES: { key: StoreName; label: string; logo: string }[] = [
  { key: 'colruyt',   label: 'Colruyt',   logo: '🛒' },
  { key: 'delhaize',  label: 'Delhaize',  logo: '🦁' },
  { key: 'carrefour', label: 'Carrefour', logo: '🔵' },
  { key: 'ah',        label: 'AH',        logo: '🧡' },
]

const STORE_LABELS: Record<StoreName, string> = {
  colruyt: 'Colruyt', delhaize: 'Delhaize', carrefour: 'Carrefour', ah: 'Albert Heijn',
}

// ── Helpers ──────────────────────────────────────────────────────────────────
interface ListEntry { id: string; name: string; qty: string }

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

// ── Page ─────────────────────────────────────────────────────────────────────
export default function ShoppingPage() {
  const [items, setItems] = useState<ListEntry[]>([])
  const [input, setInput] = useState('')
  const [qtyInput, setQtyInput] = useState('')
  const [apifyToken, setApifyToken] = useState('')
  const [results, setResults] = useState<ItemSearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [searched, setSearched] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const { apifyToken: tok } = loadStorage()
    setApifyToken(tok)
    // Restore saved list from sessionStorage
    try {
      const saved = sessionStorage.getItem('mmp-shopping-list')
      if (saved) setItems(JSON.parse(saved))
    } catch { /* ignore */ }
  }, [])

  // Persist list in sessionStorage
  useEffect(() => {
    try { sessionStorage.setItem('mmp-shopping-list', JSON.stringify(items)) } catch { /* ignore */ }
  }, [items])

  function addItem() {
    const name = input.trim()
    if (!name) return
    setItems(prev => [...prev, { id: crypto.randomUUID(), name, qty: qtyInput.trim() }])
    setInput('')
    setQtyInput('')
    setSearched(false)
    setResults([])
    inputRef.current?.focus()
  }

  function removeItem(id: string) {
    setItems(prev => prev.filter(i => i.id !== id))
    setSearched(false)
    setResults([])
  }

  function loadFromPlan() {
    const { current } = loadStorage()
    const list = buildShoppingList(current)
    const planItems: ListEntry[] = list.categories.flatMap(cat =>
      cat.items.map(i => ({
        id: crypto.randomUUID(),
        name: i.name,
        qty: `${i.quantity} ${i.unit}`,
      }))
    )
    setItems(prev => {
      const existing = new Set(prev.map(i => i.name.toLowerCase()))
      const newItems = planItems.filter(i => !existing.has(i.name.toLowerCase()))
      return [...prev, ...newItems]
    })
    setSearched(false)
    setResults([])
  }

  const handleCompare = useCallback(async () => {
    if (!items.length) return
    setLoading(true)
    setResults([])
    setProgress(0)
    setSearched(true)

    const BATCH = 5
    const names = items.map(i => i.name)
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
  }, [items, apifyToken])

  const best = results.length && !loading ? cheapestBasket(results) : null

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
            🛒 Shopping List
          </h1>
        </div>
        <button
          onClick={handleCompare}
          disabled={loading || items.length === 0}
          style={{
            padding: '9px 22px', borderRadius: 999, border: 'none',
            background: loading || items.length === 0 ? '#aaa' : GREEN,
            color: '#fff', fontSize: 13, fontWeight: 700,
            cursor: loading || items.length === 0 ? 'not-allowed' : 'pointer',
            transition: 'background 0.15s',
          }}
        >
          {loading ? `Searching… (${progress}/${items.length})` : '🔍 Compare prices'}
        </button>
      </header>

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 20px 60px' }}>

        {/* Add item form */}
        <div style={{
          background: '#fff', borderRadius: 16, padding: '20px 24px',
          border: `1px solid ${MIST}`, marginBottom: 24,
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addItem()}
              placeholder="Add item (e.g. tomatoes, chicken breast…)"
              style={{
                flex: '1 1 260px', padding: '11px 14px', borderRadius: 10,
                border: `1.5px solid ${MIST}`, fontSize: 14, outline: 'none',
                fontFamily: 'inherit', color: DARK,
              }}
              onFocus={e => (e.target.style.borderColor = GREEN)}
              onBlur={e => (e.target.style.borderColor = MIST)}
            />
            <input
              value={qtyInput}
              onChange={e => setQtyInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addItem()}
              placeholder="Qty (optional)"
              style={{
                width: 120, padding: '11px 14px', borderRadius: 10,
                border: `1.5px solid ${MIST}`, fontSize: 14, outline: 'none',
                fontFamily: 'inherit', color: DARK,
              }}
              onFocus={e => (e.target.style.borderColor = GREEN)}
              onBlur={e => (e.target.style.borderColor = MIST)}
            />
            <button
              onClick={addItem}
              disabled={!input.trim()}
              style={{
                padding: '11px 22px', borderRadius: 10, border: 'none',
                background: input.trim() ? GREEN : '#ccc',
                color: '#fff', fontSize: 14, fontWeight: 600,
                cursor: input.trim() ? 'pointer' : 'not-allowed',
                fontFamily: 'inherit', whiteSpace: 'nowrap',
              }}
            >
              + Add
            </button>
            <button
              onClick={loadFromPlan}
              title="Import items from this week's meal plan"
              style={{
                padding: '11px 16px', borderRadius: 10,
                border: `1.5px solid ${MIST}`, background: 'transparent',
                color: DARK, fontSize: 13, cursor: 'pointer',
                fontFamily: 'inherit', whiteSpace: 'nowrap',
              }}
            >
              📅 Load from plan
            </button>
            {items.length > 0 && (
              <button
                onClick={() => { setItems([]); setResults([]); setSearched(false) }}
                style={{
                  padding: '11px 14px', borderRadius: 10,
                  border: `1.5px solid ${MIST}`, background: 'transparent',
                  color: TOMATO, fontSize: 13, cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                Clear all
              </button>
            )}
          </div>
        </div>

        {/* Winner banner */}
        {best && (
          <div style={{
            marginBottom: 24, padding: '16px 24px', borderRadius: 14,
            background: GREEN, color: '#fff',
            display: 'flex', alignItems: 'center', gap: 16,
            boxShadow: '0 4px 16px rgba(65,160,95,0.3)', flexWrap: 'wrap',
          }}>
            <span style={{ fontSize: 28 }}>🏆</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>
                Cheapest basket: {STORE_LABELS[best]}
              </div>
              <div style={{ opacity: 0.85, fontSize: 13, marginTop: 2 }}>
                €{storeTotal(results, best).toFixed(2)} for {results.filter(r => r[best!]?.price !== undefined).length} / {items.length} items found
              </div>
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              {STORES.map(s => {
                const t = storeTotal(results, s.key)
                return t >= 0 ? (
                  <div key={s.key} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 11, opacity: 0.75, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: s.key === best ? SAFFRON : '#fff' }}>
                      €{t.toFixed(2)}
                    </div>
                  </div>
                ) : null
              })}
            </div>
          </div>
        )}

        {/* Progress bar */}
        {loading && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ height: 4, background: MIST, borderRadius: 2, overflow: 'hidden' }}>
              <div style={{
                height: '100%', background: GREEN, borderRadius: 2,
                width: `${items.length ? (progress / items.length) * 100 : 0}%`,
                transition: 'width 0.3s',
              }} />
            </div>
            <div style={{ fontSize: 12, color: '#666', marginTop: 6 }}>
              Comparing prices at Colruyt, Delhaize, Carrefour &amp; AH…
            </div>
          </div>
        )}

        {/* Items list / results table */}
        {items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#bbb' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🛒</div>
            <p style={{ fontSize: 15 }}>Add items above or import from your week plan.</p>
          </div>
        ) : searched ? (
          /* Results table */
          <div style={{ overflowX: 'auto', borderRadius: 14, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, background: '#fff' }}>
              <thead>
                <tr style={{ background: DARK, color: '#fff' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Item</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', opacity: 0.6 }}>Qty</th>
                  {STORES.map(s => (
                    <th key={s.key} style={{ padding: '12px 16px', textAlign: 'center', fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                      {s.logo} {s.label}
                    </th>
                  ))}
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', background: GREEN }}>
                    ✓ Best price
                  </th>
                  <th style={{ padding: '12px 10px', width: 32 }} />
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => {
                  const result = results.find(r => r.item === item.name)
                  const winner = result ? cheapestStore(result) : null
                  return (
                    <tr key={item.id} style={{ background: i % 2 === 0 ? '#fff' : CREAM, borderBottom: `1px solid ${MIST}` }}>
                      <td style={{ padding: '10px 16px', fontWeight: 500, color: DARK, textTransform: 'capitalize' }}>
                        {item.name}
                      </td>
                      <td style={{ padding: '10px 16px', textAlign: 'center', color: '#888', fontSize: 12 }}>
                        {item.qty || '—'}
                      </td>
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
                                  textDecoration: 'none', fontSize: 13,
                                }}
                              >
                                €{p.price.toFixed(2)}
                                {p.pricePerUnit && (
                                  <span style={{ display: 'block', fontSize: 10, opacity: 0.7 }}>{p.pricePerUnit}</span>
                                )}
                              </a>
                            ) : result ? (
                              <a
                                href={result[`${s.key}SearchUrl` as keyof ItemSearchResult] as string ?? '#'}
                                target="_blank" rel="noopener noreferrer"
                                style={{ color: '#ccc', fontSize: 11, textDecoration: 'none' }}
                              >
                                search →
                              </a>
                            ) : (
                              <span style={{ color: '#ddd', fontSize: 11 }}>…</span>
                            )}
                          </td>
                        )
                      })}
                      <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                        {winner ? (
                          <span style={{
                            padding: '3px 10px', borderRadius: 999,
                            background: SAFFRON + '33', color: DARK,
                            fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap',
                          }}>
                            {STORE_LABELS[winner.store]} €{winner.price.toFixed(2)}
                          </span>
                        ) : (
                          <span style={{ fontSize: 11, color: '#bbb' }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                        <button
                          onClick={() => removeItem(item.id)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ccc', fontSize: 16, lineHeight: 1 }}
                          title="Remove"
                        >×</button>
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
                    return (
                      <td key={s.key} style={{ padding: '10px 16px', textAlign: 'center', fontWeight: 700 }}>
                        {t >= 0 ? `€${t.toFixed(2)}` : '—'}
                      </td>
                    )
                  })}
                  <td colSpan={2} style={{ padding: '10px 16px', textAlign: 'center', fontWeight: 700, color: SAFFRON }}>
                    {best ? `${STORE_LABELS[best]} €${storeTotal(results, best).toFixed(2)}` : '—'}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        ) : (
          /* Plain list before search */
          <div style={{
            background: '#fff', borderRadius: 14, overflow: 'hidden',
            border: `1px solid ${MIST}`, boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          }}>
            {items.map((item, i) => (
              <div key={item.id} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 18px',
                borderBottom: i < items.length - 1 ? `1px solid ${MIST}` : 'none',
                background: '#fff',
              }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: MIST, flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: 14, color: DARK, textTransform: 'capitalize' }}>{item.name}</span>
                {item.qty && (
                  <span style={{ fontSize: 12, color: '#888' }}>{item.qty}</span>
                )}
                <button
                  onClick={() => removeItem(item.id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ccc', fontSize: 18, lineHeight: 1, padding: '0 4px' }}
                  title="Remove"
                >×</button>
              </div>
            ))}
            <div style={{ padding: '12px 18px', background: CREAM, fontSize: 13, color: '#888' }}>
              {items.length} item{items.length !== 1 ? 's' : ''} · Click <strong>Compare prices</strong> to find cheapest store
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

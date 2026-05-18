// components/ShoppingListModal.tsx
'use client'

import { useState, useEffect } from 'react'
import { X, Copy, Download, Printer, ShoppingCart, ExternalLink, Loader2, Plus, Trash2 } from 'lucide-react'
import { ShoppingList, ShoppingListItem } from '@/lib/types'
import { shoppingListToCsv, shoppingListToText } from '@/lib/ingredients'
import { usePlanner } from '@/lib/planner-context'
import type { ItemSearchResult } from '@/app/api/supermarket-search/route'

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

const STORE_COLORS: Record<string, { bg: string; color: string }> = {
  colruyt:  { bg: '#E8F5E9', color: '#1B5E20' },
  delhaize: { bg: '#FFF8E1', color: '#E65100' },
  carrefour:{ bg: '#FCE4EC', color: '#880E4F' },
  ah:       { bg: '#E3F2FD', color: '#0D47A1' },
}

function StoreBadge({ store, price, url }: { store: string; price: number; url: string }) {
  const s = STORE_COLORS[store] ?? { bg: '#F5F5F5', color: '#555' }
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" style={{
      display: 'inline-flex', alignItems: 'center', gap: 3,
      padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 600,
      background: s.bg, color: s.color, textDecoration: 'none', whiteSpace: 'nowrap',
    }}>
      €{price.toFixed(2)} <span style={{ opacity: 0.7, fontWeight: 400 }}>{store}</span>
      <ExternalLink size={9} />
    </a>
  )
}

function StoreLink({ label, url }: { label: string; url: string }) {
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" style={{
      display: 'inline-flex', alignItems: 'center', gap: 3,
      padding: '2px 8px', borderRadius: 999, fontSize: 11,
      background: '#F0EEEA', color: '#666', textDecoration: 'none', whiteSpace: 'nowrap',
    }}>
      {label} <ExternalLink size={9} />
    </a>
  )
}

function SearchLinks({ result }: { result: ItemSearchResult }) {
  const priced: { store: string; price: number; url: string }[] = []
  if (result.colruyt)   priced.push({ store: 'colruyt',   price: result.colruyt.price,   url: result.colruyt.url })
  if (result.delhaize)  priced.push({ store: 'delhaize',  price: result.delhaize.price,  url: result.delhaize.url })
  if (result.carrefour) priced.push({ store: 'carrefour', price: result.carrefour.price, url: result.carrefour.url })
  if (result.ah)        priced.push({ store: 'ah',        price: result.ah.price,        url: result.ah.url })
  priced.sort((a, b) => a.price - b.price)

  const noPrice = [
    !result.colruyt   && { label: 'Colruyt',   url: result.colruytSearchUrl },
    !result.delhaize  && { label: 'Delhaize',  url: result.delhaizeSearchUrl },
    !result.carrefour && { label: 'Carrefour', url: result.carrefourSearchUrl },
    !result.ah        && { label: 'AH',        url: result.ahSearchUrl },
  ].filter(Boolean) as { label: string; url: string }[]

  return (
    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
      {priced.map(p => <StoreBadge key={p.store} store={p.store} price={p.price} url={p.url} />)}
      {noPrice.map(s => <StoreLink key={s.label} label={s.label} url={s.url} />)}
      <StoreLink label="Aldi" url={result.aldiSearchUrl} />
      <StoreLink label="Lidl" url={result.lidlSearchUrl} />
    </div>
  )
}

export function ShoppingListModal({ open, list, onClose }: ShoppingListModalProps) {
  const { apifyToken, prefs } = usePlanner()
  const [categories, setCategories] = useState(() =>
    list.categories.map(c => ({ ...c, items: [...c.items], addInput: '' }))
  )
  const [priceResults, setPriceResults] = useState<Record<string, ItemSearchResult>>({})
  const [priceLoading, setPriceLoading] = useState(false)
  const [priceError, setPriceError] = useState('')
  const [pricesSearched, setPricesSearched] = useState(false)

  useEffect(() => {
    if (open && !pricesSearched && !priceLoading) {
      handleSearchPrices()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  if (!open) return null

  const totalCost = Object.values(priceResults).reduce((sum, r) => {
    const prices = [r.colruyt?.price, r.delhaize?.price, r.carrefour?.price, r.ah?.price].filter((p): p is number => p !== undefined)
    return sum + (prices.length ? Math.min(...prices) : 0)
  }, 0)

  const editableList: ShoppingList = { categories: categories.map(({ addInput: _, ...c }) => c), generatedAt: list.generatedAt }

  function removeItem(catIdx: number, itemIdx: number) {
    setCategories(cs => cs.map((c, ci) =>
      ci !== catIdx ? c : { ...c, items: c.items.filter((_, ii) => ii !== itemIdx) }
    ))
  }

  function addItem(catIdx: number) {
    const raw = categories[catIdx].addInput.trim()
    if (!raw) return
    const newItem: ShoppingListItem = { name: raw, quantity: 1, unit: 'pcs' }
    setCategories(cs => cs.map((c, ci) =>
      ci !== catIdx ? c : { ...c, items: [...c.items, newItem], addInput: '' }
    ))
  }

  function setAddInput(catIdx: number, val: string) {
    setCategories(cs => cs.map((c, ci) => ci !== catIdx ? c : { ...c, addInput: val }))
  }

  function handleCopy() {
    navigator.clipboard.writeText(shoppingListToText(editableList))
  }

  function handleDownloadTxt() {
    downloadFile(shoppingListToText(editableList), 'shopping-list.txt', 'text/plain')
  }

  function handleDownloadCsv() {
    downloadFile(shoppingListToCsv(editableList), 'shopping-list.csv', 'text/csv')
  }

  function handlePrint() {
    window.open('/print', '_blank')
  }

  async function handleSearchPrices() {
    const allItems = editableList.categories.flatMap(c => c.items.map(i => i.name))
    if (allItems.length === 0) return
    setPriceLoading(true)
    setPriceError('')
    try {
      const res = await fetch('/api/supermarket-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: allItems, apifyToken }),
      })
      if (!res.ok) throw new Error(`Status ${res.status}`)
      const data = await res.json()
      const map: Record<string, ItemSearchResult> = {}
      for (const r of data.results as ItemSearchResult[]) {
        map[r.item.toLowerCase()] = r
      }
      setPriceResults(map)
      setPricesSearched(true)
    } catch (e) {
      setPriceError(String(e))
    } finally {
      setPriceLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mmp-modal-box" style={{
        width: '100%', maxWidth: 560, borderRadius: 16,
        background: 'var(--paper)', boxShadow: '0 8px 40px rgba(42,31,26,0.18)',
        maxHeight: '88vh', display: 'flex', flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 20px 14px', borderBottom: '1px solid var(--mist)',
        }}>
          <h2 style={{
            fontFamily: 'var(--font-display)', fontSize: 22, fontStyle: 'italic',
            color: 'var(--ink)', margin: 0,
          }}>
            Shopping list
          </h2>
          <button onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--aubergine)' }}>
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {categories.map((cat, catIdx) => (
            <div key={cat.name}>
              <h3 style={{
                fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
                textTransform: 'uppercase', color: 'var(--aubergine)',
                opacity: 0.6, margin: '0 0 8px',
              }}>
                {CATEGORY_EMOJI[cat.name] ?? '📦'} {cat.name}
              </h3>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 4 }}>
                {cat.items.map((item, itemIdx) => {
                  const result = priceResults[item.name.toLowerCase()]
                  return (
                    <li key={itemIdx} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{
                          width: 5, height: 5, borderRadius: '50%',
                          background: 'var(--tomato)', opacity: 0.6,
                          flexShrink: 0, display: 'inline-block',
                        }} />
                        <span style={{ fontSize: 13, color: 'var(--ink)', fontWeight: 500, flex: 1 }}>{item.name}</span>
                        <span style={{ fontSize: 12, color: 'var(--aubergine)', opacity: 0.6 }}>
                          {item.quantity} {item.unit}
                        </span>
                        <button
                          onClick={() => removeItem(catIdx, itemIdx)}
                          style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '2px 4px', color: '#C73E2E', opacity: 0.5, lineHeight: 1 }}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                      {pricesSearched && result && <div style={{ paddingLeft: 13 }}><SearchLinks result={result} /></div>}
                      {pricesSearched && !result && (
                        <div style={{ paddingLeft: 13 }}>
                          <SearchLinks result={{
                            item: item.name,
                            colruytSearchUrl: `https://www.colruyt.be/nl/zoeken?searchTerm=${encodeURIComponent(item.name)}`,
                            ahSearchUrl: `https://www.ah.be/zoeken?query=${encodeURIComponent(item.name)}`,
                            delhaizeSearchUrl: `https://www.delhaize.be/nl-BE/search?q=${encodeURIComponent(item.name)}`,
                            carrefourSearchUrl: `https://www.carrefour.be/nl/zoeken?q=${encodeURIComponent(item.name)}`,
                            aldiSearchUrl: `https://www.aldi.be/nl/producten.html?q=${encodeURIComponent(item.name)}`,
                            lidlSearchUrl: `https://www.lidl.be/q/nl-BE?q=${encodeURIComponent(item.name)}`,
                          }} />
                        </div>
                      )}
                    </li>
                  )
                })}
              </ul>
              {/* Add item row */}
              <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                <input
                  type="text"
                  value={cat.addInput}
                  onChange={e => setAddInput(catIdx, e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addItem(catIdx)}
                  placeholder="Add item…"
                  style={{
                    flex: 1, fontSize: 12, padding: '5px 10px', borderRadius: 8,
                    border: '1px dashed #D9D2BF', background: 'transparent',
                    color: 'var(--ink)', outline: 'none', fontFamily: 'inherit',
                  }}
                />
                <button
                  onClick={() => addItem(catIdx)}
                  style={{
                    padding: '5px 10px', borderRadius: 8, border: 'none',
                    background: '#5D7A3E', color: 'white', cursor: 'pointer', lineHeight: 1,
                  }}
                >
                  <Plus size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{
          padding: '12px 20px 16px',
          borderTop: '1px solid var(--mist)',
          display: 'flex', flexDirection: 'column', gap: 8,
        }}>
          {/* Price search row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={handleSearchPrices}
              disabled={priceLoading}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 16px', borderRadius: 10, border: 'none',
                background: pricesSearched ? 'var(--basil)' : 'var(--tomato)',
                color: 'var(--cream)',
                fontSize: 13, fontWeight: 600, cursor: priceLoading ? 'not-allowed' : 'pointer',
                opacity: priceLoading ? 0.7 : 1,
                transition: 'all 0.2s',
              }}
            >
              {priceLoading
                ? <><Loader2 size={13} className="animate-spin" /> Searching…</>
                : <><ShoppingCart size={13} /> {pricesSearched ? 'Refresh prices' : 'Compare prices'}</>
              }
            </button>
            {!apifyToken && (
              <span style={{ fontSize: 11, color: 'var(--aubergine)', opacity: 0.6 }}>
                Add Apify token in Settings for AH Belgium prices
              </span>
            )}
            {priceError && (
              <span style={{ fontSize: 11, color: 'var(--tomato)' }}>{priceError}</span>
            )}
          </div>

          {/* Budget summary */}
          {pricesSearched && totalCost > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12, color: 'var(--aubergine)', opacity: 0.7 }}>
                Estimated total (cheapest per item):
              </span>
              <span style={{
                fontSize: 14, fontWeight: 700,
                color: prefs.weeklyBudget && totalCost > prefs.weeklyBudget ? '#C73E2E' : '#5D7A3E',
              }}>
                €{totalCost.toFixed(2)}
              </span>
              {prefs.weeklyBudget && (
                <span style={{ fontSize: 11, color: 'var(--aubergine)', opacity: 0.55 }}>
                  {totalCost <= prefs.weeklyBudget
                    ? `✓ within €${prefs.weeklyBudget} budget (€${(prefs.weeklyBudget - totalCost).toFixed(2)} left)`
                    : `⚠ €${(totalCost - prefs.weeklyBudget).toFixed(2)} over €${prefs.weeklyBudget} budget`
                  }
                </span>
              )}
            </div>
          )}

          {/* Export row */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <button
              aria-label="Copy"
              onClick={handleCopy}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '6px 12px', borderRadius: 8,
                border: '1px solid var(--mist)', background: 'transparent',
                fontSize: 12, color: 'var(--aubergine)', cursor: 'pointer',
              }}
            >
              <Copy size={12} /> Copy
            </button>
            <button
              aria-label=".txt"
              onClick={handleDownloadTxt}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '6px 12px', borderRadius: 8,
                border: '1px solid var(--mist)', background: 'transparent',
                fontSize: 12, color: 'var(--aubergine)', cursor: 'pointer',
              }}
            >
              <Download size={12} /> .txt
            </button>
            <button
              aria-label=".csv"
              onClick={handleDownloadCsv}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '6px 12px', borderRadius: 8,
                border: '1px solid var(--mist)', background: 'transparent',
                fontSize: 12, color: 'var(--aubergine)', cursor: 'pointer',
              }}
            >
              <Download size={12} /> .csv
            </button>
            <button
              aria-label="Print"
              onClick={handlePrint}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '6px 12px', borderRadius: 8,
                border: '1px solid var(--mist)', background: 'transparent',
                fontSize: 12, color: 'var(--aubergine)', cursor: 'pointer',
              }}
            >
              <Printer size={12} /> Print
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

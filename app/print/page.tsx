// app/print/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { loadStorage } from '@/lib/storage'
import { buildShoppingList } from '@/lib/ingredients'
import { ShoppingList, WeekPlan, WEEKDAYS, WEEKDAY_LABELS } from '@/lib/types'

const CATEGORY_EMOJI: Record<string, string> = {
  produce: '🥦', meat: '🥩', fish: '🐟', dairy: '🥛',
  pantry: '🫙', bakery: '🍞', frozen: '🧊', other: '📦',
}

const CATEGORY_COLOR: Record<string, string> = {
  produce:  '#E8F5E9',
  meat:     '#FFF3E0',
  fish:     '#E3F2FD',
  dairy:    '#F3E5F5',
  pantry:   '#FFF8E1',
  bakery:   '#FBE9E7',
  frozen:   '#E1F5FE',
  other:    '#F5F5F5',
}

const CATEGORY_BORDER: Record<string, string> = {
  produce:  '#4CAF50',
  meat:     '#FF9800',
  fish:     '#2196F3',
  dairy:    '#9C27B0',
  pantry:   '#FFC107',
  bakery:   '#FF5722',
  frozen:   '#03A9F4',
  other:    '#9E9E9E',
}

export default function PrintPage() {
  const [plan, setPlan] = useState<WeekPlan | null>(null)
  const [list, setList] = useState<ShoppingList | null>(null)

  useEffect(() => {
    const { current } = loadStorage()
    setPlan(current)
    setList(buildShoppingList(current))
  }, [])

  if (!plan || !list) return <p style={{ padding: 32 }}>Loading…</p>

  const dateStr = new Date().toLocaleDateString('en-BE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
        body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #fff; }
      `}</style>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px' }}>

        {/* Branded header */}
        <div style={{
          background: '#41A05F',
          borderRadius: 16,
          padding: '20px 28px',
          marginBottom: 28,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div>
            <h1 style={{ margin: 0, color: '#fff', fontSize: 26, fontWeight: 800, letterSpacing: '-0.5px' }}>
              🥗 MyMealPlanner
            </h1>
            <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>
              Weekly Plan &amp; Shopping List
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ margin: 0, color: 'rgba(255,255,255,0.75)', fontSize: 12 }}>Generated</p>
            <p style={{ margin: '2px 0 0', color: '#fff', fontSize: 13, fontWeight: 600 }}>{dateStr}</p>
          </div>
        </div>

        {/* Week plan */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{
            margin: '0 0 12px',
            fontSize: 16, fontWeight: 700, color: '#1D2F2A',
            textTransform: 'uppercase', letterSpacing: '0.06em',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <span style={{ width: 4, height: 18, background: '#41A05F', borderRadius: 2, display: 'inline-block' }} />
            This Week&apos;s Dinners
          </h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr>
                {WEEKDAYS.map(d => (
                  <th key={d} style={{
                    padding: '8px 10px', textAlign: 'left', fontWeight: 700,
                    background: '#1D2F2A', color: '#fff',
                    fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase',
                    borderRight: '1px solid #2B4A3D',
                  }}>
                    {WEEKDAY_LABELS[d].slice(0, 3)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                {WEEKDAYS.map((d, i) => {
                  const meal = plan.days[d]
                  return (
                    <td key={d} style={{
                      padding: '10px 10px', verticalAlign: 'top',
                      background: i % 2 === 0 ? '#F8FAF8' : '#fff',
                      border: '1px solid #D8E8D8',
                    }}>
                      {meal ? (
                        <>
                          <p style={{ margin: 0, fontWeight: 600, color: '#1D2F2A', lineHeight: 1.3 }}>{meal.name}</p>
                          {meal.prepTime && <p style={{ margin: '3px 0 0', color: '#6B8C6B', fontSize: 11 }}>⏱ {meal.prepTime}</p>}
                          {meal.cuisine && <p style={{ margin: '2px 0 0', color: '#41A05F', fontSize: 11 }}>{meal.cuisine}</p>}
                        </>
                      ) : (
                        <span style={{ color: '#ccc', fontSize: 18 }}>—</span>
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
          <h2 style={{
            margin: '0 0 16px',
            fontSize: 16, fontWeight: 700, color: '#1D2F2A',
            textTransform: 'uppercase', letterSpacing: '0.06em',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <span style={{ width: 4, height: 18, background: '#41A05F', borderRadius: 2, display: 'inline-block' }} />
            Shopping List
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 14,
          }}>
            {list.categories.filter(c => c.items.length > 0).map(cat => {
              const bg = CATEGORY_COLOR[cat.name] ?? '#F5F5F5'
              const border = CATEGORY_BORDER[cat.name] ?? '#9E9E9E'
              return (
                <div key={cat.name} style={{
                  background: bg,
                  borderRadius: 10,
                  border: `2px solid ${border}`,
                  padding: '12px 14px',
                  breakInside: 'avoid',
                }}>
                  <h3 style={{
                    margin: '0 0 8px',
                    fontSize: 11, fontWeight: 800,
                    textTransform: 'uppercase', letterSpacing: '0.08em',
                    color: border,
                  }}>
                    {CATEGORY_EMOJI[cat.name] ?? '📦'} {cat.name}
                  </h3>
                  <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                    {cat.items.map((item, i) => (
                      <li key={i} style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
                        padding: '3px 0',
                        borderBottom: i < cat.items.length - 1 ? `1px solid ${border}33` : 'none',
                      }}>
                        <span style={{ fontSize: 12, color: '#1D2F2A', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{
                            width: 12, height: 12, border: `1.5px solid ${border}`,
                            borderRadius: 2, flexShrink: 0, display: 'inline-block',
                          }} />
                          {item.name}
                        </span>
                        <span style={{ fontSize: 11, color: '#666', marginLeft: 8, whiteSpace: 'nowrap' }}>
                          {item.quantity} {item.unit}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </div>
        </section>

        {/* Print button */}
        <div className="no-print" style={{ marginTop: 32, display: 'flex', justifyContent: 'center' }}>
          <button
            onClick={() => window.print()}
            style={{
              padding: '12px 32px', borderRadius: 12, border: 'none',
              background: '#41A05F', color: '#fff',
              fontSize: 14, fontWeight: 700, cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(65,160,95,0.35)',
            }}
          >
            🖨 Print / Save as PDF
          </button>
        </div>
      </div>
    </>
  )
}

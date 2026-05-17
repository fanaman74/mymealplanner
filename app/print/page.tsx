// app/print/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { loadStorage } from '@/lib/storage'
import { buildShoppingList } from '@/lib/ingredients'
import { ShoppingList, WeekPlan, WEEKDAYS, WEEKDAY_LABELS } from '@/lib/types'

export default function PrintPage() {
  const [plan, setPlan] = useState<WeekPlan | null>(null)
  const [list, setList] = useState<ShoppingList | null>(null)

  useEffect(() => {
    const { current } = loadStorage()
    setPlan(current)
    setList(buildShoppingList(current))
  }, [])

  if (!plan || !list) return <p className="p-8">Loading…</p>

  return (
    <div className="p-8 max-w-4xl mx-auto font-sans">
      <h1 className="text-2xl font-bold mb-6">🍲 Weekly Dinner Plan</h1>

      {/* Plan table */}
      <section className="mb-8">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr>
              {WEEKDAYS.map(d => (
                <th key={d} className="border border-gray-300 px-2 py-1 text-left font-semibold bg-gray-50">
                  {WEEKDAY_LABELS[d]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              {WEEKDAYS.map(d => {
                const meal = plan.days[d]
                return (
                  <td key={d} className="border border-gray-300 px-2 py-2 align-top text-xs">
                    {meal ? (
                      <>
                        <p className="font-semibold">{meal.name}</p>
                        {meal.prepTime && <p className="text-gray-500">{meal.prepTime}</p>}
                      </>
                    ) : (
                      <span className="text-gray-300">—</span>
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
        <h2 className="text-xl font-bold mb-4">Shopping List</h2>
        <div className="columns-2 gap-8">
          {list.categories.map(cat => (
            <div key={cat.name} className="break-inside-avoid mb-4">
              <h3 className="font-semibold uppercase text-xs tracking-wide text-gray-500 mb-1">
                {cat.name}
              </h3>
              <ul>
                {cat.items.map((item, i) => (
                  <li key={i} className="text-sm flex justify-between">
                    <span>{item.name}</span>
                    <span className="text-gray-500">{item.quantity} {item.unit}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <button
        onClick={() => window.print()}
        className="mt-8 rounded-lg bg-gray-900 px-6 py-2 text-sm font-medium text-white hover:bg-gray-700 no-print"
      >
        Print
      </button>
    </div>
  )
}

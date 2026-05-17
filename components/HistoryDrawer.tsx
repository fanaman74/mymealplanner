// components/HistoryDrawer.tsx
'use client'

import { X, Clock, ArrowDownToLine } from 'lucide-react'
import { usePlanner } from '@/lib/planner-context'
import { WEEKDAYS } from '@/lib/types'

interface HistoryDrawerProps {
  open: boolean
  onClose: () => void
}

export function HistoryDrawer({ open, onClose }: HistoryDrawerProps) {
  const { history, current, loadWeek } = usePlanner()

  if (!open) return null

  function handleLoad(index: number) {
    const hasCurrentMeals = WEEKDAYS.some(d => current.days[d] !== null)
    if (hasCurrentMeals) {
      if (!confirm('Load this week? Your current plan will be replaced.')) return
    }
    loadWeek(history[index])
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-white p-6 shadow-xl h-full overflow-y-auto">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Clock size={18} /> History
          </h2>
          <button onClick={onClose}><X size={20} /></button>
        </div>

        {history.length === 0 ? (
          <p className="text-sm text-gray-400">No saved weeks yet. Use &quot;Save Snapshot&quot; to save the current plan.</p>
        ) : (
          <ul className="space-y-3">
            {history.map((week, i) => {
              const mealCount = WEEKDAYS.filter(d => week.days[d] !== null).length
              return (
                <li key={week.id} className="rounded-xl border border-gray-200 p-4">
                  <p className="font-medium text-sm text-gray-900">
                    {week.label ?? `Week ${i + 1}`}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(week.createdAt).toLocaleDateString('en-BE')} · {mealCount}/7 meals
                  </p>
                  <div className="mt-2 space-y-0.5">
                    {WEEKDAYS.map(d => week.days[d] && (
                      <p key={d} className="text-xs text-gray-600 truncate">
                        {d.slice(0, 3).toUpperCase()}: {week.days[d]!.name}
                      </p>
                    ))}
                  </div>
                  <button
                    onClick={() => handleLoad(i)}
                    className="mt-3 flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100"
                  >
                    <ArrowDownToLine size={12} /> Load this week
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}

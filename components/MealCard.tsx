// components/MealCard.tsx
'use client'

import { Dices, Pencil } from 'lucide-react'
import { Meal, Weekday, WEEKDAY_LABELS } from '@/lib/types'

interface MealCardProps {
  day: Weekday
  meal: Meal | null
  loading: boolean
  weekLoading: boolean
  onRandomize: (day: Weekday) => void
  onEdit: (day: Weekday, meal: Meal) => void
}

export function MealCard({ day, meal, loading, weekLoading, onRandomize, onEdit }: MealCardProps) {
  const disabled = loading || weekLoading

  return (
    <div className="flex flex-col rounded-xl border border-gray-200 bg-white p-4 shadow-sm min-h-[200px]">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">
        {WEEKDAY_LABELS[day]}
      </p>

      {loading ? (
        <div data-testid="meal-skeleton" className="flex-1 space-y-2 animate-pulse">
          <div className="h-5 rounded bg-gray-200 w-3/4" />
          <div className="h-3 rounded bg-gray-100 w-1/2" />
          <div className="h-3 rounded bg-gray-100 w-2/3" />
          <div className="h-3 rounded bg-gray-100 w-1/2" />
        </div>
      ) : meal ? (
        <div className="flex-1 flex flex-col">
          <h3 className="font-semibold text-gray-900 text-base leading-snug">{meal.name}</h3>
          {(meal.prepTime || meal.cuisine) && (
            <p className="mt-0.5 text-xs text-gray-400">
              {[meal.cuisine, meal.prepTime].filter(Boolean).join(' · ')}
            </p>
          )}
          <ul className="mt-2 flex-1 space-y-0.5">
            {meal.ingredients.slice(0, 5).map((ing, i) => (
              <li key={i} className="text-xs text-gray-600">
                • {ing.quantity} {ing.unit} {ing.name}
              </li>
            ))}
            {meal.ingredients.length > 5 && (
              <li className="text-xs text-gray-400">+{meal.ingredients.length - 5} more</li>
            )}
          </ul>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-gray-400">No meal — click 🎲 to generate</p>
        </div>
      )}

      <div className="mt-3 flex gap-2 pt-3 border-t border-gray-100">
        <button
          aria-label="Randomize"
          onClick={() => onRandomize(day)}
          disabled={disabled}
          className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <Dices size={14} /> Randomize
        </button>
        {meal && (
          <button
            aria-label="Edit"
            onClick={() => onEdit(day, meal)}
            className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <Pencil size={14} /> Edit
          </button>
        )}
      </div>
    </div>
  )
}

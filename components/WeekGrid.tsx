// components/WeekGrid.tsx
'use client'

import { useState } from 'react'
import { usePlanner } from '@/lib/planner-context'
import { Meal, Weekday, WEEKDAYS } from '@/lib/types'
import { MealCard } from '@/components/MealCard'
import { EditMealModal } from '@/components/EditMealModal'

export function WeekGrid() {
  const { current, dayLoading, weekLoading, randomizeMeal, setMeal } = usePlanner()
  const [editing, setEditing] = useState<{ day: Weekday; meal: Meal } | null>(null)

  function handleEdit(day: Weekday, meal: Meal) {
    setEditing({ day, meal })
  }

  function handleSave(meal: Meal) {
    if (!editing) return
    setMeal(editing.day, meal)
    setEditing(null)
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
        {WEEKDAYS.map(day => (
          <MealCard
            key={day}
            day={day}
            meal={current.days[day]}
            loading={dayLoading[day]}
            weekLoading={weekLoading}
            onRandomize={randomizeMeal}
            onEdit={handleEdit}
          />
        ))}
      </div>

      <EditMealModal
        open={editing !== null}
        meal={editing?.meal ?? null}
        onSave={handleSave}
        onClose={() => setEditing(null)}
      />
    </>
  )
}

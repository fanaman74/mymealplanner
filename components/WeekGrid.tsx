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
      {/* 4 + 3 grid — 12-col base keeps rows flush */}
      <div className="mmp-week-grid" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(12, 1fr)',
        gap: 10,
      }}>
        {WEEKDAYS.slice(0, 4).map(day => (
          <div key={day} style={{ gridColumn: 'span 3', display: 'flex', flexDirection: 'column' }}>
            <MealCard
              day={day}
              meal={current.days[day]}
              loading={dayLoading[day]}
              weekLoading={weekLoading}
              onRandomize={randomizeMeal}
              onEdit={handleEdit}
            />
          </div>
        ))}
        {WEEKDAYS.slice(4, 7).map(day => (
          <div key={day} style={{ gridColumn: 'span 4', display: 'flex', flexDirection: 'column' }}>
            <MealCard
              day={day}
              meal={current.days[day]}
              loading={dayLoading[day]}
              weekLoading={weekLoading}
              onRandomize={randomizeMeal}
              onEdit={handleEdit}
            />
          </div>
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

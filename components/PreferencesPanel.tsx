// components/PreferencesPanel.tsx
'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { usePlanner } from '@/lib/planner-context'
import { DEFAULT_PREFERENCES, DietType, BudgetTier, Preferences } from '@/lib/types'

const DIET_OPTIONS: { value: DietType; label: string }[] = [
  { value: 'omnivore', label: 'Omnivore' },
  { value: 'vegetarian', label: 'Vegetarian' },
  { value: 'pescatarian', label: 'Pescatarian' },
  { value: 'vegan', label: 'Vegan' },
]

const BUDGET_OPTIONS: { value: BudgetTier; label: string }[] = [
  { value: 'low', label: 'Budget' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High-end' },
]

const CUISINE_OPTIONS = [
  'Belgian', 'Italian', 'French', 'Spanish', 'Greek', 'Turkish',
  'Asian', 'Japanese', 'Thai', 'Indian', 'Mexican', 'American',
]

interface PrefsPanelProps {
  open: boolean
  onClose: () => void
}

export function PreferencesPanel({ open, onClose }: PrefsPanelProps) {
  const { prefs, setPrefs } = usePlanner()
  const [local, setLocal] = useState<Preferences>(prefs)
  const [dislikeInput, setDislikeInput] = useState(prefs.dislikes.join(', '))
  const [allergyInput, setAllergyInput] = useState(prefs.allergies.join(', '))

  if (!open) return null

  function toggleCuisine(c: string) {
    setLocal(p => ({
      ...p,
      cuisines: p.cuisines.includes(c)
        ? p.cuisines.filter(x => x !== c)
        : [...p.cuisines, c],
    }))
  }

  function handleSave() {
    setPrefs({
      ...local,
      dislikes: dislikeInput.split(',').map(s => s.trim()).filter(Boolean),
      allergies: allergyInput.split(',').map(s => s.trim()).filter(Boolean),
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-sm overflow-y-auto bg-white p-6 shadow-xl h-full">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Preferences</h2>
          <button onClick={onClose}><X size={20} /></button>
        </div>

        <div className="space-y-5">
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Diet</p>
            <div className="flex flex-wrap gap-2">
              {DIET_OPTIONS.map(o => (
                <button
                  key={o.value}
                  onClick={() => setLocal(p => ({ ...p, dietType: o.value }))}
                  className={`rounded-full px-3 py-1 text-sm ${
                    local.dietType === o.value
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Cuisines</p>
            <div className="flex flex-wrap gap-2">
              {CUISINE_OPTIONS.map(c => (
                <button
                  key={c}
                  onClick={() => toggleCuisine(c)}
                  className={`rounded-full px-3 py-1 text-sm ${
                    local.cuisines.includes(c)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Dislikes</label>
            <input
              type="text"
              value={dislikeInput}
              onChange={e => setDislikeInput(e.target.value)}
              placeholder="mushrooms, eggplant, ..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="mt-1 text-xs text-gray-500">Comma-separated.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Allergies</label>
            <input
              type="text"
              value={allergyInput}
              onChange={e => setAllergyInput(e.target.value)}
              placeholder="nuts, gluten, ..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Budget</p>
            <div className="flex gap-2">
              {BUDGET_OPTIONS.map(o => (
                <button
                  key={o.value}
                  onClick={() => setLocal(p => ({ ...p, budgetTier: o.value }))}
                  className={`rounded-full px-3 py-1 text-sm ${
                    local.budgetTier === o.value
                      ? 'bg-amber-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Family size</label>
            <input
              type="number"
              min={1}
              max={12}
              value={local.familySize}
              onChange={e => setLocal(p => ({ ...p, familySize: parseInt(e.target.value) || 4 }))}
              className="w-20 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={local.notes}
              onChange={e => setLocal(p => ({ ...p, notes: e.target.value }))}
              rows={3}
              placeholder="We prefer quick meals on weekdays, ..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="mt-6 flex gap-2">
          <button
            onClick={() => setLocal(DEFAULT_PREFERENCES)}
            className="flex-1 rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 border"
          >
            Reset
          </button>
          <button
            onClick={handleSave}
            className="flex-1 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}

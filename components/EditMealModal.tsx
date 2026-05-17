// components/EditMealModal.tsx
'use client'

import { useState } from 'react'
import { X, Plus, Trash2 } from 'lucide-react'
import { Ingredient, Meal, Unit, UNITS } from '@/lib/types'

interface EditMealModalProps {
  open: boolean
  meal: Meal | null
  onSave: (meal: Meal) => void
  onClose: () => void
}

interface IngredientRow extends Ingredient {
  key: string
}

export function EditMealModal({ open, meal, onSave, onClose }: EditMealModalProps) {
  const [name, setName] = useState(meal?.name ?? '')
  const [rows, setRows] = useState<IngredientRow[]>(
    (meal?.ingredients ?? []).map((ing, i) => ({ ...ing, key: String(i) }))
  )

  if (!open || !meal) return null

  function addRow() {
    setRows(r => [...r, { key: crypto.randomUUID(), name: '', quantity: 0, unit: 'g' }])
  }

  function removeRow(key: string) {
    setRows(r => r.filter(row => row.key !== key))
  }

  function updateRow(key: string, field: keyof Ingredient, value: string | number) {
    setRows(r => r.map(row => row.key === key ? { ...row, [field]: value } : row))
  }

  function handleSave() {
    const ingredients: Ingredient[] = rows
      .filter(r => r.name.trim())
      .map(({ key, ...ing }) => ({ ...ing, quantity: Number(ing.quantity) }))
    onSave({ ...meal!, name: name.trim(), ingredients })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Edit Meal</h2>
          <button onClick={onClose}><X size={20} /></button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Meal name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Ingredients</p>
            <div className="space-y-2">
              {rows.map(row => (
                <div key={row.key} className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={row.name}
                    onChange={e => updateRow(row.key, 'name', e.target.value)}
                    placeholder="ingredient name"
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="number"
                    value={row.quantity}
                    onChange={e => updateRow(row.key, 'quantity', e.target.value)}
                    min={0}
                    className="w-20 rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <select
                    value={row.unit}
                    onChange={e => updateRow(row.key, 'unit', e.target.value as Unit)}
                    className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                  <button
                    onClick={() => removeRow(row.key)}
                    className="text-red-400 hover:text-red-600"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
            <button
              aria-label="Add ingredient"
              onClick={addRow}
              className="mt-2 flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
            >
              <Plus size={14} /> Add ingredient
            </button>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            aria-label="Cancel"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            aria-label="Save"
            onClick={handleSave}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}

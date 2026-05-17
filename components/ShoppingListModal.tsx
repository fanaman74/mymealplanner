// components/ShoppingListModal.tsx
'use client'

import { X, Copy, Download, Printer } from 'lucide-react'
import { ShoppingList } from '@/lib/types'
import { shoppingListToCsv, shoppingListToText } from '@/lib/ingredients'

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

export function ShoppingListModal({ open, list, onClose }: ShoppingListModalProps) {
  if (!open) return null

  function handleCopy() {
    navigator.clipboard.writeText(shoppingListToText(list))
  }

  function handleDownloadTxt() {
    downloadFile(shoppingListToText(list), 'shopping-list.txt', 'text/plain')
  }

  function handleDownloadCsv() {
    downloadFile(shoppingListToCsv(list), 'shopping-list.csv', 'text/csv')
  }

  function handlePrint() {
    window.open('/print', '_blank')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-xl max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between p-6 pb-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold">Shopping List</h2>
          <button onClick={onClose}><X size={20} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {list.categories.map(cat => (
            <div key={cat.name}>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-2">
                {CATEGORY_EMOJI[cat.name] ?? '📦'} {cat.name}
              </h3>
              <ul className="space-y-1">
                {cat.items.map((item, i) => (
                  <li key={i} className="flex items-baseline gap-2 text-sm text-gray-800">
                    <span className="text-gray-400">•</span>
                    <span className="font-medium">{item.name}</span>
                    <span className="text-gray-500 ml-auto shrink-0">
                      {item.quantity} {item.unit}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex gap-2 p-4 border-t border-gray-100 flex-wrap">
          <button
            aria-label="Copy"
            onClick={handleCopy}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            <Copy size={14} /> Copy
          </button>
          <button
            aria-label=".txt"
            onClick={handleDownloadTxt}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            <Download size={14} /> .txt
          </button>
          <button
            aria-label=".csv"
            onClick={handleDownloadCsv}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            <Download size={14} /> .csv
          </button>
          <button
            aria-label="Print"
            onClick={handlePrint}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            <Printer size={14} /> Print
          </button>
        </div>
      </div>
    </div>
  )
}

// app/page.tsx
'use client'

import { useState } from 'react'
import { Dices, Trash2, Save, ListChecks, SlidersHorizontal, History, Settings } from 'lucide-react'
import { PlannerProvider, usePlanner } from '@/lib/planner-context'
import { buildShoppingList } from '@/lib/ingredients'
import { WeekGrid } from '@/components/WeekGrid'
import { ShoppingListModal } from '@/components/ShoppingListModal'
import { PreferencesPanel } from '@/components/PreferencesPanel'
import { HistoryDrawer } from '@/components/HistoryDrawer'
import { SettingsModal } from '@/components/SettingsModal'
import { ToastStack, useToasts } from '@/components/Toast'
import { ShoppingList } from '@/lib/types'

interface PlannerAppProps {
  showSettings: boolean
  setShowSettings: (v: boolean) => void
}

function PlannerApp({ showSettings, setShowSettings }: PlannerAppProps) {
  const { current, weekLoading, randomizeWeek, clearAll, saveSnapshot, storageAvailable } = usePlanner()
  const [shoppingList, setShoppingList] = useState<ShoppingList | null>(null)
  const [showPrefs, setShowPrefs] = useState(false)
  const [showHistory, setShowHistory] = useState(false)

  function handleGenerateList() {
    setShoppingList(buildShoppingList(current))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Storage warning banner */}
      {!storageAvailable && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-sm text-amber-800 text-center">
          Local storage unavailable — your plan won&apos;t persist after closing this tab.
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-900">🍲 MyMealPlanner</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPrefs(true)}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100"
          >
            <SlidersHorizontal size={15} /> Prefs
          </button>
          <button
            onClick={() => setShowHistory(true)}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100"
          >
            <History size={15} /> History
          </button>
          <button
            onClick={() => setShowSettings(true)}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100"
          >
            <Settings size={15} /> Settings
          </button>
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-4 py-6">
        {/* Action bar */}
        <div className="mb-4 flex flex-wrap gap-2">
          <button
            onClick={randomizeWeek}
            disabled={weekLoading}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Dices size={15} />
            {weekLoading ? 'Generating…' : 'Randomize Week'}
          </button>
          <button
            onClick={clearAll}
            className="flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
          >
            <Trash2 size={15} /> Clear All
          </button>
          <button
            onClick={saveSnapshot}
            className="flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
          >
            <Save size={15} /> Save Snapshot
          </button>
        </div>

        {/* Week grid */}
        <WeekGrid />

        {/* Shopping list CTA */}
        <div className="mt-8 flex justify-center">
          <button
            onClick={handleGenerateList}
            className="flex items-center gap-2 rounded-xl bg-green-600 px-8 py-3 text-base font-semibold text-white shadow hover:bg-green-700 transition-colors"
          >
            <ListChecks size={18} /> Generate Shopping List
          </button>
        </div>
      </main>

      {/* Modals & drawers */}
      {shoppingList && (
        <ShoppingListModal
          open={true}
          list={shoppingList}
          onClose={() => setShoppingList(null)}
        />
      )}
      <PreferencesPanel open={showPrefs} onClose={() => setShowPrefs(false)} />
      <HistoryDrawer open={showHistory} onClose={() => setShowHistory(false)} />
      <SettingsModal open={showSettings} onClose={() => setShowSettings(false)} />
    </div>
  )
}

export default function Page() {
  const { toasts, addToast, dismissToast } = useToasts()
  const [showSettings, setShowSettings] = useState(false)

  return (
    <PlannerProvider onError={addToast} openSettings={() => setShowSettings(true)}>
      <PlannerApp showSettings={showSettings} setShowSettings={setShowSettings} />
      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </PlannerProvider>
  )
}

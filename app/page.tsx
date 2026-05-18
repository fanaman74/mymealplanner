// app/page.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { Dices, Trash2, Save, ListChecks, History, Settings, Moon, Sun } from 'lucide-react'
import { PlannerProvider, usePlanner } from '@/lib/planner-context'
import { I18nProvider, useLang } from '@/lib/i18n-context'
import { t, Lang } from '@/lib/i18n'
import { buildShoppingList } from '@/lib/ingredients'
import { WeekGrid } from '@/components/WeekGrid'
import { ShoppingListModal } from '@/components/ShoppingListModal'
import { HistoryDrawer } from '@/components/HistoryDrawer'
import { HeroEditorial } from '@/components/HeroEditorial'
import { InlinePreferences } from '@/components/InlinePreferences'
import { SettingsModal } from '@/components/SettingsModal'
import { ToastStack, useToasts } from '@/components/Toast'
import { SquiggleMotif, LeafMotif } from '@/components/Motifs'
import { ShoppingList } from '@/lib/types'

const LANGS: { code: Lang; label: string }[] = [
  { code: 'en', label: 'EN' },
  { code: 'fr', label: 'FR' },
  { code: 'nl', label: 'NL' },
]

function DarkModeToggle() {
  const [dark, setDark] = useState(false)
  useEffect(() => {
    const stored = localStorage.getItem('mmp-dark')
    if (stored === '1') { document.body.classList.add('dark'); setDark(true) }
  }, [])
  function toggle() {
    const next = !dark
    setDark(next)
    document.body.classList.toggle('dark', next)
    localStorage.setItem('mmp-dark', next ? '1' : '0')
  }
  return (
    <button onClick={toggle} style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      width: 32, height: 32, borderRadius: 8, border: 'none',
      background: 'transparent', cursor: 'pointer', color: 'var(--aubergine)',
    }}>
      {dark ? <Sun size={15} /> : <Moon size={15} />}
    </button>
  )
}

function LangToggle() {
  const { lang, setLang } = useLang()
  return (
    <div style={{
      display: 'flex',
      gap: 2,
      background: 'var(--mist)',
      borderRadius: 999,
      padding: 2,
    }}>
      {LANGS.map(({ code, label }) => (
        <button
          key={code}
          onClick={() => setLang(code)}
          style={{
            padding: '3px 10px',
            borderRadius: 999,
            border: 'none',
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.05em',
            cursor: 'pointer',
            transition: 'all 0.15s',
            background: lang === code ? 'var(--tomato)' : 'transparent',
            color: lang === code ? 'var(--cream)' : 'var(--aubergine)',
          }}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

interface PlannerAppProps {
  showSettings: boolean
  setShowSettings: (v: boolean) => void
}

function PlannerApp({ showSettings, setShowSettings }: PlannerAppProps) {
  const { current, weekLoading, randomizeWeek, clearAll, saveSnapshot, storageAvailable, setMeal } = usePlanner()
  const { lang } = useLang()
  const strings = t(lang)
  const [shoppingList, setShoppingList] = useState<ShoppingList | null>(null)
  const [showHistory, setShowHistory] = useState(false)

  // Apply HelloFresh meal selection from /hellofresh page
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('hf_selection')
      if (raw) {
        const { day, meal } = JSON.parse(raw)
        sessionStorage.removeItem('hf_selection')
        if (day && meal) setMeal(day, { ...meal, id: meal.id ?? crypto.randomUUID() })
      }
    } catch { /* ignore */ }
  }, [setMeal])

  function handleGenerateList() {
    setShoppingList(buildShoppingList(current))
  }

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Storage warning */}
      {!storageAvailable && (
        <div style={{
          background: '#FFF7ED',
          borderBottom: '1px solid #FED7AA',
          padding: '8px 16px',
          fontSize: 13,
          color: '#92400E',
          textAlign: 'center',
        }}>
          {strings.storageWarning}
        </div>
      )}

      {/* Header — HelloFresh style */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 30,
        background: '#FFFFFF',
        borderBottom: '2px solid #41A05F',
        padding: '0 24px', height: 60,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: '0 2px 12px rgba(29,47,42,0.08)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: '#41A05F',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <LeafMotif size={16} color="#FFFFFF" />
          </div>
          <h1 className="mmp-header-title" style={{
            fontFamily: 'var(--font-display)',
            fontStyle: 'italic', fontSize: 20,
            color: '#1D2F2A', margin: 0, lineHeight: 1,
          }}>
            MyMealPlanner
          </h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <DarkModeToggle />
          <LangToggle />
          <button onClick={() => setShowHistory(true)} style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '6px 12px', borderRadius: 999, border: 'none',
            background: 'transparent', fontSize: 12, color: '#2B4A3D', cursor: 'pointer',
            fontWeight: 500,
          }}>
            <History size={13} />
            <span className="mmp-header-btn-text">{strings.history}</span>
          </button>
          <button onClick={() => setShowSettings(true)} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 34, height: 34, borderRadius: '50%', border: '1px solid #D8E8D8',
            background: 'transparent', cursor: 'pointer', color: '#2B4A3D',
          }}>
            <Settings size={14} />
          </button>
        </div>
      </header>

      <main style={{ maxWidth: 1280, margin: '0 auto', padding: '20px 16px 40px' }}>
        {/* Editorial hero — Option B */}
        <HeroEditorial />


        {/* Inline preferences */}
        <InlinePreferences />

        {/* Section heading */}
        <div style={{ marginBottom: 20 }}>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 36,
            lineHeight: 1,
            color: 'var(--ink)',
            margin: '0 0 6px',
          }}>
            {strings.thisWeek}{' '}
            <span style={{ fontStyle: 'italic', color: 'var(--tomato)' }}>—</span>
          </h2>
          <SquiggleMotif color="var(--tomato)" width={64} />
        </div>

        {/* Action bar */}
        <div className="mmp-action-bar" style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
          <button
            onClick={randomizeWeek}
            disabled={weekLoading}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 20px', borderRadius: 12, border: 'none',
              background: weekLoading ? 'var(--terracotta)' : 'var(--tomato)',
              color: 'var(--cream)',
              fontSize: 14, fontWeight: 600, cursor: weekLoading ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 12px rgba(199,62,46,0.3)',
              transition: 'all 0.2s',
              fontFamily: 'inherit',
            }}
          >
            <Dices size={15} />
            {weekLoading ? strings.generatingWeek : strings.randomizeWeek}
          </button>
          <button
            onClick={clearAll}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '10px 16px', borderRadius: 12,
              border: '1px solid var(--mist)', background: 'transparent',
              fontSize: 13, color: 'var(--aubergine)', cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            <Trash2 size={13} /> {strings.clearAll}
          </button>
          <button
            onClick={saveSnapshot}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '10px 16px', borderRadius: 12,
              border: '1px solid var(--mist)', background: 'transparent',
              fontSize: 13, color: 'var(--aubergine)', cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            <Save size={13} /> {strings.saveSnapshot}
          </button>
        </div>

        {/* Week-wide loading banner */}
        {weekLoading && (
          <div style={{
            marginBottom: 16,
            padding: '14px 20px',
            borderRadius: 14,
            background: 'var(--saffron)',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            boxShadow: '0 4px 16px rgba(232,169,59,0.25)',
          }}>
            <span style={{ fontSize: 20 }}>⏳</span>
            <div>
              <div style={{
                fontFamily: 'var(--font-display)',
                fontSize: 16,
                fontStyle: 'italic',
                color: 'var(--charcoal, #1A1410)',
                lineHeight: 1,
              }}>
                {strings.generatingWeek}
              </div>
              <div style={{
                fontFamily: 'var(--font-hand)',
                fontSize: 14,
                color: 'var(--aubergine)',
                marginTop: 3,
              }}>
                {lang === 'fr' ? 'L\'IA prépare vos repas…' : lang === 'nl' ? 'AI bereidt uw maaltijden voor…' : 'AI is preparing your meals…'}
              </div>
            </div>
          </div>
        )}

        {/* Week grid */}
        <WeekGrid />

        {/* Shopping list CTA */}
        <div style={{ marginTop: 32, display: 'flex', justifyContent: 'center' }}>
          <button
            onClick={handleGenerateList}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '14px 32px', borderRadius: 16,
              border: 'none', background: 'var(--basil)',
              color: 'var(--cream)',
              fontSize: 15, fontWeight: 600, cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(93,122,62,0.3)',
              fontFamily: 'inherit',
            }}
          >
            <ListChecks size={18} /> {strings.shoppingList}
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
      <HistoryDrawer open={showHistory} onClose={() => setShowHistory(false)} />
      <SettingsModal open={showSettings} onClose={() => setShowSettings(false)} />
    </div>
  )
}

export default function Page() {
  const { toasts, addToast, dismissToast } = useToasts()
  const [showSettings, setShowSettings] = useState(false)

  return (
    <I18nProvider>
      <PlannerProvider onError={addToast} openSettings={() => setShowSettings(true)}>
        <PlannerApp showSettings={showSettings} setShowSettings={setShowSettings} />
        <ToastStack toasts={toasts} onDismiss={dismissToast} />
      </PlannerProvider>
    </I18nProvider>
  )
}

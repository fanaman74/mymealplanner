// components/InlinePreferences.tsx
'use client'

import { useState } from 'react'
import { ChevronDown, Check } from 'lucide-react'
import { usePlanner } from '@/lib/planner-context'
import { DEFAULT_PREFERENCES, DietType, BudgetTier, Preferences } from '@/lib/types'
import { useLang } from '@/lib/i18n-context'

const DIET_OPTIONS: { value: DietType; label: string; emoji: string }[] = [
  { value: 'omnivore',     label: 'Omnivore',     emoji: '🍖' },
  { value: 'vegetarian',  label: 'Vegetarian',   emoji: '🥦' },
  { value: 'pescatarian', label: 'Pescatarian',  emoji: '🐟' },
  { value: 'vegan',       label: 'Vegan',        emoji: '🌱' },
]

const BUDGET_OPTIONS: { value: BudgetTier; label: string; sub: string; emoji: string }[] = [
  { value: 'low',    label: 'Budget',    sub: '< €10 / repas', emoji: '🪙' },
  { value: 'medium', label: 'Moyen',     sub: '€10–20 / repas', emoji: '💶' },
  { value: 'high',   label: 'Premium',   sub: '€20+ / repas',  emoji: '✨' },
]

const CUISINE_OPTIONS = [
  'French', 'Italian', 'Ghanaian', 'Belgian', 'Spanish', 'Greek',
  'Turkish', 'Asian', 'Japanese', 'Thai', 'Indian', 'Mexican', 'American',
]

const INPUT: React.CSSProperties = {
  width: '100%',
  borderRadius: 10,
  border: '1.5px solid #D9D2BF',
  background: 'white',
  padding: '9px 13px',
  fontSize: 13,
  color: '#2A1F1A',
  outline: 'none',
  boxSizing: 'border-box' as const,
  fontFamily: 'inherit',
}

function StepLabel({ n, label }: { n: number; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
      <div style={{
        width: 24, height: 24, borderRadius: '50%',
        background: '#C73E2E', color: 'white',
        fontSize: 11, fontWeight: 700,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        {n}
      </div>
      <span style={{
        fontSize: 11, fontWeight: 700, letterSpacing: '0.12em',
        textTransform: 'uppercase' as const, color: '#3D2433',
      }}>
        {label}
      </span>
    </div>
  )
}

function CuisineChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        padding: '6px 14px', borderRadius: 999,
        border: active ? '2px solid #7BB88A' : '1.5px solid #D9D2BF',
        background: active ? '#C8E6C9' : 'white',
        color: '#1A1A1A',                  // always dark — no CSS var dependency
        fontSize: 12, fontWeight: active ? 600 : 400,
        cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
        boxShadow: active ? '0 2px 8px rgba(123,184,138,0.35)' : 'none',
      }}
    >
      {active && <Check size={11} strokeWidth={3} color="#2A6A3A" />}
      {label}
    </button>
  )
}

function DietCard({ value, label, emoji, active, onClick }: {
  value: string; label: string; emoji: string; active: boolean; onClick: () => void
}) {
  // Hard-code colors — no CSS var inheritance that can silently fail
  const bg     = active ? '#5D7A3E' : 'white'
  const border = active ? '2px solid #5D7A3E' : '1.5px solid #D9D2BF'
  const txtCol = active ? '#FFFFFF' : '#2A1F1A'
  const shadow = active ? '0 3px 10px rgba(93,122,62,0.3)' : '0 1px 3px rgba(42,31,26,0.06)'

  return (
    <button
      onClick={onClick}
      style={{
        flex: 1, minWidth: 76, padding: '10px 8px',
        borderRadius: 12, border, background: bg,
        cursor: 'pointer', fontFamily: 'inherit',
        transition: 'all 0.15s', boxShadow: shadow,
        display: 'flex', flexDirection: 'column' as const,
        alignItems: 'center', gap: 5,
      }}
    >
      <span style={{ fontSize: 20, lineHeight: 1 }}>{emoji}</span>
      <span style={{ fontSize: 12, fontWeight: active ? 600 : 400, lineHeight: 1, color: txtCol }}>
        {label}
      </span>
    </button>
  )
}

function BudgetCard({ value, label, sub, emoji, active, onClick }: {
  value: string; label: string; sub: string; emoji: string; active: boolean; onClick: () => void
}) {
  const bg     = active ? '#3D2433' : 'white'
  const border = active ? '2px solid #3D2433' : '1.5px solid #D9D2BF'
  const txtCol = active ? '#F6EFE0' : '#2A1F1A'
  const subCol = active ? 'rgba(246,239,224,0.7)' : 'rgba(61,36,51,0.45)'
  const shadow = active ? '0 3px 10px rgba(61,36,51,0.28)' : '0 1px 3px rgba(42,31,26,0.06)'

  return (
    <button
      onClick={onClick}
      style={{
        flex: 1, padding: '12px 10px', borderRadius: 12,
        border, background: bg, cursor: 'pointer',
        fontFamily: 'inherit', transition: 'all 0.15s',
        boxShadow: shadow, textAlign: 'left' as const,
      }}
    >
      <div style={{ fontSize: 18, marginBottom: 4 }}>{emoji}</div>
      <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1, color: txtCol }}>{label}</div>
      <div style={{ fontSize: 10, marginTop: 3, lineHeight: 1, color: subCol }}>{sub}</div>
    </button>
  )
}

export function InlinePreferences() {
  const { prefs, setPrefs } = usePlanner()
  const { lang } = useLang()
  const [open, setOpen] = useState(true)
  const [local, setLocal] = useState<Preferences>(prefs)
  const [dislikeInput, setDislikeInput] = useState(prefs.dislikes.join(', '))
  const [allergyInput, setAllergyInput] = useState(prefs.allergies.join(', '))
  const [saved, setSaved] = useState(false)
  const [customCuisine, setCustomCuisine] = useState('')

  const headerLabel =
    lang === 'fr' ? 'Notre famille' :
    lang === 'nl' ? 'Ons gezin' : 'Our family'

  function handleSave() {
    setPrefs({
      ...local,
      dislikes: dislikeInput.split(',').map(s => s.trim()).filter(Boolean),
      allergies: allergyInput.split(',').map(s => s.trim()).filter(Boolean),
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function handleReset() {
    setLocal(DEFAULT_PREFERENCES)
    setDislikeInput(DEFAULT_PREFERENCES.dislikes.join(', '))
    setAllergyInput(DEFAULT_PREFERENCES.allergies.join(', '))
  }

  function toggleCuisine(c: string) {
    setLocal(p => ({
      ...p,
      cuisines: p.cuisines.includes(c)
        ? p.cuisines.filter(x => x !== c)
        : [...p.cuisines, c],
    }))
  }

  function randomizeCuisines() {
    const pool = [...CUISINE_OPTIONS, ...local.cuisines.filter(c => !CUISINE_OPTIONS.includes(c))]
    const shuffled = pool.sort(() => Math.random() - 0.5)
    setLocal(p => ({ ...p, cuisines: shuffled.slice(0, 7) }))
  }

  function addCustomCuisine() {
    const val = customCuisine.trim()
    if (!val || local.cuisines.includes(val)) return
    setLocal(p => ({ ...p, cuisines: [...p.cuisines, val] }))
    setCustomCuisine('')
  }

  const lbl = (en: string, fr: string, nl: string) =>
    lang === 'fr' ? fr : lang === 'nl' ? nl : en

  return (
    <div style={{
      background: '#FBF6EA',
      borderRadius: 20,
      border: '1.5px solid #D9D2BF',
      marginBottom: 28,
      overflow: 'hidden',
      boxShadow: '0 4px 16px rgba(42,31,26,0.08)',
    }}>

      {/* Header */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', padding: '0 20px', height: 56,
          background: 'none', border: 'none',
          borderBottom: open ? '1.5px solid #D9D2BF' : 'none',
          cursor: 'pointer', fontFamily: 'inherit',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 6, height: 28, borderRadius: 4,
            background: 'linear-gradient(180deg, #C73E2E 0%, #E8A93B 100%)',
          }} />
          <span style={{ fontSize: 22 }}>👨‍👩‍👧‍👦</span>
          <div style={{ textAlign: 'left' }}>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontStyle: 'italic', fontSize: 19, color: '#2A1F1A', lineHeight: 1,
            }}>
              {headerLabel}
            </div>
            <div style={{ fontSize: 11, color: '#3D2433', opacity: 0.55, marginTop: 1 }}>
              {lbl('diet · cuisines · preferences', 'régime · cuisines · préférences', 'dieet · keukens · voorkeuren')}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {!open && (
            <div style={{ display: 'flex', gap: 5 }}>
              <span style={{ padding: '3px 9px', borderRadius: 999, fontSize: 11, background: '#5D7A3E', color: 'white', fontWeight: 500 }}>
                {DIET_OPTIONS.find(d => d.value === local.dietType)?.emoji} {local.dietType}
              </span>
              <span style={{ padding: '3px 9px', borderRadius: 999, fontSize: 11, background: '#D9D2BF', color: '#3D2433' }}>
                {local.cuisines.length} {lbl('cuisines', 'cuisines', 'keukens')}
              </span>
              <span style={{ padding: '3px 9px', borderRadius: 999, fontSize: 11, background: '#D9D2BF', color: '#3D2433' }}>
                {local.familySize} 👤
              </span>
            </div>
          )}
          <ChevronDown size={18} color="#3D2433"
            style={{ transform: open ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s', flexShrink: 0 }}
          />
        </div>
      </button>

      {open && (
        <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* Step 1 — Diet */}
          <div>
            <StepLabel n={1} label={lbl('Diet type', 'Régime alimentaire', 'Soort dieet')} />
            <div className="mmp-diet-row" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {DIET_OPTIONS.map(o => (
                <DietCard key={o.value} {...o}
                  active={local.dietType === o.value}
                  onClick={() => setLocal(p => ({ ...p, dietType: o.value }))}
                />
              ))}
            </div>
          </div>

          <div style={{ height: 1, background: '#D9D2BF', opacity: 0.5 }} />

          {/* Step 2 — Cuisines */}
          <div>
            <StepLabel n={2} label={lbl('Preferred cuisines', 'Cuisines préférées', 'Favoriete keukens')} />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {CUISINE_OPTIONS.map(c => (
                <CuisineChip key={c} label={c}
                  active={local.cuisines.includes(c)}
                  onClick={() => toggleCuisine(c)}
                />
              ))}
              {/* custom cuisines not in preset list */}
              {local.cuisines.filter(c => !CUISINE_OPTIONS.includes(c)).map(c => (
                <button
                  key={c}
                  onClick={() => toggleCuisine(c)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    padding: '6px 14px', borderRadius: 999,
                    border: '2px solid #7BB88A', background: '#C8E6C9',
                    color: '#1A1A1A', fontSize: 12, fontWeight: 600,
                    cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  <Check size={11} strokeWidth={3} color="#2A6A3A" />
                  {c}
                  <span style={{ fontSize: 14, lineHeight: 1, marginLeft: 2, opacity: 0.6 }}>×</span>
                </button>
              ))}
            </div>
            {/* Add custom cuisine */}
            <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
              <input
                type="text"
                value={customCuisine}
                onChange={e => setCustomCuisine(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addCustomCuisine()}
                placeholder={lbl('Add cuisine…', 'Ajouter une cuisine…', 'Keuken toevoegen…')}
                style={{
                  flex: 1, fontSize: 12, padding: '6px 12px', borderRadius: 999,
                  border: '1.5px dashed #D9D2BF', background: 'transparent',
                  color: '#2A1F1A', outline: 'none', fontFamily: 'inherit',
                }}
              />
              <button
                onClick={addCustomCuisine}
                style={{
                  padding: '6px 14px', borderRadius: 999, border: 'none',
                  background: '#C73E2E', color: 'white', fontSize: 12,
                  fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                + {lbl('Add', 'Ajouter', 'Toevoegen')}
              </button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10 }}>
              <button
                onClick={randomizeCuisines}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '6px 16px', borderRadius: 999, border: 'none',
                  background: '#E8A93B', color: '#2A1F1A', fontSize: 12,
                  fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                  boxShadow: '0 2px 8px rgba(232,169,59,0.3)',
                }}
              >
                🎲 {lbl('Random 7', 'Aléatoire 7', 'Willekeurig 7')}
              </button>
              {local.cuisines.length > 0 && (
                <span style={{ fontSize: 11, color: '#5D7A3E', fontWeight: 500 }}>
                  {local.cuisines.length} {lbl('selected', 'sélectionnée(s)', 'geselecteerd')}
                </span>
              )}
            </div>
          </div>

          <div style={{ height: 1, background: '#D9D2BF', opacity: 0.5 }} />

          {/* Step 3 — Dislikes & Allergies */}
          <div>
            <StepLabel n={3} label={lbl('Dislikes & allergies', 'Pas aimés & allergies', 'Niet lekker & allergieën')} />
            <div className="mmp-prefs-two-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#3D2433', opacity: 0.6, marginBottom: 6 }}>
                  🚫 {lbl('Dislikes', 'Pas aimés', 'Niet lekker')}
                </div>
                <input type="text" value={dislikeInput} onChange={e => setDislikeInput(e.target.value)}
                  placeholder={lbl('mushrooms, eggplant…', 'champignons, aubergine…', 'champignons, aubergine…')}
                  style={INPUT}
                />
                <span style={{ fontSize: 10, color: '#3D2433', opacity: 0.45, marginTop: 4, display: 'block' }}>
                  {lbl('comma-separated', 'séparés par virgule', 'komma-gescheiden')}
                </span>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#3D2433', opacity: 0.6, marginBottom: 6 }}>
                  ⚠️ {lbl('Allergies', 'Allergies', 'Allergieën')}
                </div>
                <input type="text" value={allergyInput} onChange={e => setAllergyInput(e.target.value)}
                  placeholder={lbl('nuts, gluten…', 'noix, gluten…', 'noten, gluten…')}
                  style={INPUT}
                />
              </div>
            </div>
          </div>

          <div style={{ height: 1, background: '#D9D2BF', opacity: 0.5 }} />

          {/* Step 4 — Budget */}
          <div>
            <StepLabel n={4} label={lbl('Budget per meal', 'Budget par repas', 'Budget per maaltijd')} />
            <div className="mmp-budget-row" style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {BUDGET_OPTIONS.map(o => (
                <BudgetCard key={o.value} {...o}
                  active={local.budgetTier === o.value}
                  onClick={() => setLocal(p => ({ ...p, budgetTier: o.value }))}
                />
              ))}
            </div>
          </div>

          <div style={{ height: 1, background: '#D9D2BF', opacity: 0.5 }} />

          {/* Step 5 — Family size + Notes */}
          <div>
            <StepLabel n={5} label={lbl('Family & notes', 'Famille & notes', 'Gezin & notities')} />
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#3D2433', opacity: 0.6, marginBottom: 8 }}>
                  👥 {lbl('Family size', 'Taille de la famille', 'Gezinsgrootte')}
                </div>
                <div style={{
                  display: 'inline-flex', alignItems: 'center',
                  border: '1.5px solid #D9D2BF', borderRadius: 12,
                  overflow: 'hidden', background: 'white',
                }}>
                  <button
                    onClick={() => setLocal(p => ({ ...p, familySize: Math.max(1, p.familySize - 1) }))}
                    style={{ width: 40, height: 40, border: 'none', borderRight: '1px solid #D9D2BF', background: 'transparent', fontSize: 18, cursor: 'pointer', color: '#3D2433', fontWeight: 300 }}
                  >−</button>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: '#2A1F1A', width: 44, textAlign: 'center' as const, lineHeight: '40px' }}>
                    {local.familySize}
                  </span>
                  <button
                    onClick={() => setLocal(p => ({ ...p, familySize: Math.min(12, p.familySize + 1) }))}
                    style={{ width: 40, height: 40, border: 'none', borderLeft: '1px solid #D9D2BF', background: 'transparent', fontSize: 18, cursor: 'pointer', color: '#3D2433', fontWeight: 300 }}
                  >+</button>
                </div>
              </div>
              <div style={{ flex: 1, minWidth: 180 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#3D2433', opacity: 0.6, marginBottom: 8 }}>
                  📝 {lbl('Notes', 'Notes', 'Notities')}
                </div>
                <textarea
                  value={local.notes}
                  onChange={e => setLocal(p => ({ ...p, notes: e.target.value }))}
                  rows={2}
                  placeholder={lbl('Quick meals on weekdays…', 'Repas rapides les jours de semaine…', 'Snelle maaltijden op weekdagen…')}
                  style={{ ...INPUT, resize: 'vertical' as const }}
                />
              </div>
            </div>
          </div>

          {/* Save / Reset */}
          <div style={{ display: 'flex', gap: 8, paddingTop: 4, borderTop: '1.5px solid #D9D2BF' }}>
            <button
              onClick={handleReset}
              style={{
                padding: '10px 20px', borderRadius: 10,
                border: '1.5px solid #D9D2BF',
                background: 'white',
                fontSize: 13, color: '#3D2433',
                cursor: 'pointer', fontFamily: 'inherit',
                fontWeight: 500,
              }}
            >
              {lbl('Reset', 'Réinitialiser', 'Herstel')}
            </button>
            <button
              onClick={handleSave}
              style={{
                padding: '10px 28px', borderRadius: 10, border: 'none',
                background: saved ? '#5D7A3E' : '#C73E2E',  // hex — no CSS var risk
                fontSize: 13, fontWeight: 700,
                color: '#FFFFFF',                             // explicit white — always visible
                cursor: 'pointer', fontFamily: 'inherit',
                boxShadow: saved ? '0 2px 8px rgba(93,122,62,0.3)' : '0 2px 8px rgba(199,62,46,0.3)',
                transition: 'background 0.3s',
                display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              {saved
                ? <><Check size={14} strokeWidth={3} /> {lbl('Saved!', 'Sauvegardé !', 'Opgeslagen!')}</>
                : lbl('Save preferences', 'Sauvegarder', 'Opslaan')
              }
            </button>
          </div>

        </div>
      )}
    </div>
  )
}

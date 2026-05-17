// components/MealCard.tsx
'use client'

import { useState } from 'react'
import { Dices, Pencil, ChevronDown, ChevronUp } from 'lucide-react'
import { Meal, Weekday } from '@/lib/types'
import { useLang } from '@/lib/i18n-context'
import { t } from '@/lib/i18n'
import { MealArt, BG_COLORS, hashName } from './MealArt'
import { ClockMotif } from './Motifs'

const DAY_SEEDS: Record<Weekday, number> = {
  mon: 0, tue: 1, wed: 2, thu: 3, fri: 4, sat: 5, sun: 6,
}

const CUISINE_FLAGS: Record<string, string> = {
  belgian: '🇧🇪', italian: '🇮🇹', french: '🇫🇷', spanish: '🇪🇸',
  greek: '🇬🇷', turkish: '🇹🇷', asian: '🌏', japanese: '🇯🇵',
  thai: '🇹🇭', indian: '🇮🇳', mexican: '🇲🇽', american: '🇺🇸',
  ghanaian: '🇬🇭', moroccan: '🇲🇦', portuguese: '🇵🇹', german: '🇩🇪', british: '🇬🇧',
  chinese: '🇨🇳', korean: '🇰🇷', vietnamese: '🇻🇳', lebanese: '🇱🇧',
}

function cuisineFlag(cuisine?: string): string {
  if (!cuisine) return ''
  return CUISINE_FLAGS[cuisine.toLowerCase()] ?? '🍴'
}

const DAY_TO_LONG: Record<Weekday, keyof ReturnType<typeof t>['days']> = {
  mon: 'monday', tue: 'tuesday', wed: 'wednesday', thu: 'thursday',
  fri: 'friday', sat: 'saturday', sun: 'sunday',
}

interface MealCardProps {
  day: Weekday
  meal: Meal | null
  loading: boolean
  weekLoading: boolean
  onRandomize: (day: Weekday) => void
  onEdit: (day: Weekday, meal: Meal) => void
  hero?: boolean
}

export function MealCard({
  day, meal, loading, weekLoading, onRandomize, onEdit, hero = false,
}: MealCardProps) {
  const { lang } = useLang()
  const strings = t(lang)
  const disabled = loading || weekLoading
  const seed = DAY_SEEDS[day]
  const [expanded, setExpanded] = useState(false)
  const longKey = DAY_TO_LONG[day]
  const dayLabel = strings.days[longKey]
  const dayShort = strings.daysShort[longKey]

  return (
    <div
      style={{
        background: 'var(--paper)',
        borderRadius: hero ? 20 : 16,
        overflow: 'hidden',
        border: '1px solid var(--mist)',
        boxShadow: hero
          ? '0 8px 32px rgba(42,31,26,0.12)'
          : '0 2px 8px rgba(42,31,26,0.07)',
        display: 'flex',
        flexDirection: 'column',
        minHeight: hero ? 320 : 220,
        height: '100%',
        position: 'relative',
      }}
    >
      {/* Illustration */}
      {(meal || loading) && (
        <div style={{ position: 'relative' }}>
          {meal?.cuisine ? (
            /* Flag banner replaces illustration */
            <div style={{
              height: hero ? 200 : 130,
              background: BG_COLORS[(meal ? hashName(meal.name) : seed) % BG_COLORS.length],
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: hero ? 96 : 64,
              lineHeight: 1,
              userSelect: 'none',
            }}>
              {cuisineFlag(meal.cuisine)}
            </div>
          ) : (
            <MealArt seed={seed} name={meal?.name} height={hero ? 200 : 130} className="w-full" />
          )}
          {/* Day label pill */}
          <div style={{
            position: 'absolute',
            top: 10,
            left: 12,
            background: 'var(--tomato)',
            color: 'var(--cream)',
            borderRadius: 999,
            padding: '3px 10px',
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}>
            {hero ? dayLabel : dayShort}
          </div>
        </div>
      )}

      {/* Content */}
      <div style={{ padding: hero ? '14px 16px 12px' : '10px 12px 10px', flex: 1, display: 'flex', flexDirection: 'column' }}>

        {/* No art state — day label shown inline */}
        {!meal && !loading && (
          <p style={{
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--tomato)',
            marginBottom: 8,
          }}>
            {dayLabel}
          </p>
        )}

        {loading ? (
          <div data-testid="meal-skeleton" style={{ flex: 1 }} className="animate-pulse space-y-2">
            <div style={{ height: 20, borderRadius: 6, background: 'var(--mist)', width: '75%' }} />
            <div style={{ height: 12, borderRadius: 4, background: 'var(--mist)', width: '50%', opacity: 0.6 }} />
            <div style={{ height: 12, borderRadius: 4, background: 'var(--mist)', width: '65%', opacity: 0.5 }} />
            <div style={{ height: 12, borderRadius: 4, background: 'var(--mist)', width: '55%', opacity: 0.4 }} />
          </div>
        ) : meal ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <h3 style={{
              fontFamily: 'var(--font-display)',
              fontSize: hero ? 22 : 16,
              lineHeight: 1.15,
              color: 'var(--ink)',
              margin: 0,
            }}>
              {meal.name}
            </h3>

            {(meal.prepTime || meal.cuisine) && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 5,
                marginTop: 4, color: 'var(--aubergine)', fontSize: 11, opacity: 0.8,
              }}>
                {meal.prepTime && <ClockMotif color="var(--aubergine)" size={11} />}
                {[meal.cuisine, meal.prepTime].filter(Boolean).join(' · ')}
              </div>
            )}

            {(() => {
              const limit = hero ? 6 : 4
              const shown = expanded ? meal.ingredients : meal.ingredients.slice(0, limit)
              const hidden = meal.ingredients.length - limit
              return (
                <ul style={{ margin: '8px 0 0', padding: 0, listStyle: 'none', flex: 1 }}>
                  {shown.map((ing, i) => (
                    <li key={i} style={{
                      fontSize: 11, color: 'var(--aubergine)',
                      padding: '1px 0', display: 'flex', alignItems: 'center', gap: 5,
                    }}>
                      <span style={{
                        width: 4, height: 4, borderRadius: '50%',
                        background: 'var(--tomato)', flexShrink: 0,
                        opacity: 0.7, display: 'inline-block',
                      }} />
                      {ing.quantity} {ing.unit} {ing.name}
                    </li>
                  ))}
                  {!expanded && hidden > 0 && (
                    <li style={{ paddingTop: 3 }}>
                      <button
                        onClick={e => { e.stopPropagation(); setExpanded(true) }}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 3,
                          fontSize: 11, color: 'var(--tomato)', fontWeight: 600,
                          background: 'none', border: 'none', cursor: 'pointer',
                          padding: 0, fontFamily: 'inherit',
                        }}
                      >
                        <ChevronDown size={12} strokeWidth={2.5} />
                        +{hidden} {strings.moreIngredients(hidden).replace(`+${hidden} `, '')}
                      </button>
                    </li>
                  )}
                  {expanded && meal.ingredients.length > limit && (
                    <li style={{ paddingTop: 3 }}>
                      <button
                        onClick={e => { e.stopPropagation(); setExpanded(false) }}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 3,
                          fontSize: 11, color: 'var(--aubergine)', opacity: 0.6,
                          background: 'none', border: 'none', cursor: 'pointer',
                          padding: 0, fontFamily: 'inherit',
                        }}
                      >
                        <ChevronUp size={12} strokeWidth={2.5} /> show less
                      </button>
                    </li>
                  )}
                </ul>
              )
            })()}
          </div>
        ) : (
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            padding: '20px 0',
          }}>
            <span style={{
              fontFamily: 'var(--font-hand)',
              fontSize: 18,
              color: 'var(--mist)',
              textAlign: 'center',
              lineHeight: 1.3,
            }}>
              {strings.noMeal}
            </span>
          </div>
        )}
      </div>

      {/* Action row */}
      <div style={{
        display: 'flex',
        gap: 6,
        padding: '8px 12px 10px',
        borderTop: '1px solid var(--mist)',
      }}>
        <button
          aria-label="Randomize"
          onClick={() => onRandomize(day)}
          disabled={disabled}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '5px 10px',
            borderRadius: 999,
            border: '1px solid var(--mist)',
            background: 'transparent',
            fontSize: 11,
            fontWeight: 500,
            color: 'var(--aubergine)',
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.4 : 1,
            transition: 'background 0.15s',
          }}
        >
          <Dices size={12} /> {strings.randomize}
        </button>
        {meal && (
          <button
            aria-label="Edit"
            onClick={() => onEdit(day, meal)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '5px 10px',
              borderRadius: 999,
              border: '1px solid var(--mist)',
              background: 'transparent',
              fontSize: 11,
              fontWeight: 500,
              color: 'var(--aubergine)',
              cursor: 'pointer',
              transition: 'background 0.15s',
            }}
          >
            <Pencil size={12} /> {strings.edit}
          </button>
        )}
      </div>
    </div>
  )
}

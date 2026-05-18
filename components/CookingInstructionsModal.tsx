// components/CookingInstructionsModal.tsx
'use client'

import { useEffect, useState } from 'react'
import { X, ChefHat, Lightbulb } from 'lucide-react'
import { Meal } from '@/lib/types'
import { useLang } from '@/lib/i18n-context'
import { usePlanner } from '@/lib/planner-context'

interface Props {
  meal: Meal
  onClose: () => void
}

export function CookingInstructionsModal({ meal, onClose }: Props) {
  const { lang } = useLang()
  const { model } = usePlanner()
  const [steps, setSteps] = useState<string[]>([])
  const [tips, setTips] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    // Priority 1: HF native steps
    if (meal.steps?.length) {
      setSteps(meal.steps)
      setTips('')
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    setError('')

    // Priority 2: TheMealDB instructions (free, no AI cost)
    fetch(`/api/meal-image?q=${encodeURIComponent(meal.name)}`)
      .then(r => r.json())
      .then(async (data) => {
        if (cancelled) return
        if (data.steps?.length) {
          setSteps(data.steps)
          setTips('')
          setLoading(false)
          return
        }
        // Priority 3: AI generation
        const res = await fetch('/api/cooking-instructions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mealName: meal.name, ingredients: meal.ingredients, prepTime: meal.prepTime, lang, model }),
        })
        const aiData = await res.json()
        if (cancelled) return
        if (aiData.error) { setError(aiData.error); return }
        setSteps(aiData.steps ?? [])
        setTips(aiData.tips ?? '')
      })
      .catch(() => { if (!cancelled) setError('Failed to load instructions') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [meal.name, meal.steps, meal.ingredients, meal.prepTime, lang, model])

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 60,
        background: 'rgba(29,47,42,0.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--paper)',
          borderRadius: 20,
          width: '100%',
          maxWidth: 520,
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 60px rgba(29,47,42,0.25)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--mist)',
          display: 'flex',
          alignItems: 'flex-start',
          gap: 12,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: '#41A05F',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <ChefHat size={18} color="#FFFFFF" />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--tomato)', opacity: 0.8 }}>
              Cooking Instructions
            </p>
            <h2 style={{
              margin: '2px 0 0',
              fontFamily: 'var(--font-display)',
              fontSize: 18, lineHeight: 1.2,
              color: 'var(--ink)',
            }}>
              {meal.name}
            </h2>
            {meal.prepTime && (
              <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--aubergine)', opacity: 0.7 }}>
                {meal.prepTime}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            style={{
              width: 30, height: 30, borderRadius: '50%',
              border: '1px solid var(--mist)', background: 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'var(--aubergine)', flexShrink: 0,
            }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div style={{ overflowY: 'auto', padding: '16px 20px 20px', flex: 1 }}>
          {loading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[80, 65, 90, 70, 85, 60].map((w, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--mist)', flexShrink: 0 }} />
                  <div style={{ flex: 1, height: 16, borderRadius: 6, background: 'var(--mist)', width: `${w}%` }} />
                </div>
              ))}
            </div>
          )}

          {error && (
            <p style={{ color: '#C73E2E', fontSize: 14, textAlign: 'center', marginTop: 24 }}>{error}</p>
          )}

          {!loading && !error && (
            <>
              <ol style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 14 }}>
                {steps.map((step, i) => (
                  <li key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <span style={{
                      width: 26, height: 26, borderRadius: '50%',
                      background: '#41A05F',
                      color: '#FFFFFF',
                      fontSize: 12, fontWeight: 700,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0, marginTop: 1,
                    }}>
                      {i + 1}
                    </span>
                    <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: 'var(--ink)' }}>
                      {step}
                    </p>
                  </li>
                ))}
              </ol>

              {tips && (
                <div style={{
                  marginTop: 20,
                  padding: '12px 14px',
                  borderRadius: 12,
                  background: 'rgba(65,160,95,0.08)',
                  border: '1px solid rgba(65,160,95,0.2)',
                  display: 'flex', gap: 10, alignItems: 'flex-start',
                }}>
                  <Lightbulb size={15} color="#41A05F" style={{ flexShrink: 0, marginTop: 1 }} />
                  <p style={{ margin: 0, fontSize: 13, color: 'var(--aubergine)', lineHeight: 1.5 }}>
                    {tips}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

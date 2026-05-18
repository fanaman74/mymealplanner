'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import type { HFMeal } from '@/app/api/hellofresh-meals/route'

const HF_GREEN = '#41A05F'
const HF_DARK = '#1D2F2A'
const HF_BG = '#F4F6F3'
const HF_CARD_BG = '#FFFFFF'
const HF_LIGHT_GREEN = '#E8F3EC'
const HF_BORDER = '#D6E8DC'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

function SkeletonCard() {
  return (
    <div
      style={{
        background: HF_CARD_BG,
        borderRadius: 16,
        overflow: 'hidden',
        boxShadow: '0 2px 12px rgba(29,47,42,0.08)',
        border: `1px solid ${HF_BORDER}`,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          aspectRatio: '4/3',
          background: 'linear-gradient(90deg, #e8f0eb 25%, #d6e8dc 50%, #e8f0eb 75%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.5s infinite',
        }}
      />
      <div style={{ padding: '16px 20px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ height: 22, background: '#e8f0eb', borderRadius: 6, width: '75%' }} />
        <div style={{ height: 16, background: '#e8f0eb', borderRadius: 6, width: '50%' }} />
        <div style={{ height: 14, background: '#e8f0eb', borderRadius: 6, width: '60%' }} />
        <div style={{ height: 40, background: HF_LIGHT_GREEN, borderRadius: 8, marginTop: 8 }} />
      </div>
    </div>
  )
}

function DifficultyBadge({ difficulty }: { difficulty: string }) {
  const colorMap: Record<string, { bg: string; text: string }> = {
    Easy: { bg: '#E8F3EC', text: '#2A7A4B' },
    Medium: { bg: '#FFF4E0', text: '#B86A00' },
    Hard: { bg: '#FDECEA', text: '#B91C1C' },
  }
  const colors = colorMap[difficulty] ?? { bg: '#F0F0F0', text: '#555' }
  return (
    <span
      style={{
        background: colors.bg,
        color: colors.text,
        fontSize: 11,
        fontWeight: 700,
        padding: '3px 10px',
        borderRadius: 20,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
      }}
    >
      {difficulty}
    </span>
  )
}

function MealCard({ meal }: { meal: HFMeal }) {
  const router = useRouter()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    if (dropdownOpen) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [dropdownOpen])

  function handleDaySelect(day: string) {
    setSelectedDay(day)
    setDropdownOpen(false)
    sessionStorage.setItem('hf_selection', JSON.stringify({ day, meal }))
    router.push('/')
  }

  return (
    <div
      style={{
        background: HF_CARD_BG,
        borderRadius: 16,
        overflow: 'hidden',
        boxShadow: '0 2px 12px rgba(29,47,42,0.08)',
        border: `1px solid ${HF_BORDER}`,
        display: 'flex',
        flexDirection: 'column',
        transition: 'box-shadow 0.2s ease, transform 0.2s ease',
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLDivElement
        el.style.boxShadow = '0 8px 32px rgba(29,47,42,0.16)'
        el.style.transform = 'translateY(-2px)'
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLDivElement
        el.style.boxShadow = '0 2px 12px rgba(29,47,42,0.08)'
        el.style.transform = 'translateY(0)'
      }}
    >
      {/* Image */}
      <div style={{ aspectRatio: '4/3', overflow: 'hidden', position: 'relative' }}>
        <img
          src={meal.imageUrl}
          alt={meal.name}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
          }}
          onError={(e) => {
            const img = e.currentTarget
            img.src = `https://placehold.co/500x375/e8f3ec/41a05f?text=${encodeURIComponent(meal.name.slice(0, 20))}`
          }}
        />
        {meal.cuisines.length > 0 && (
          <div
            style={{
              position: 'absolute',
              top: 12,
              left: 12,
              background: 'rgba(29,47,42,0.75)',
              backdropFilter: 'blur(4px)',
              color: '#fff',
              fontSize: 11,
              fontWeight: 600,
              padding: '4px 10px',
              borderRadius: 20,
              letterSpacing: '0.03em',
            }}
          >
            {meal.cuisines[0]}
          </div>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: '16px 20px 20px', display: 'flex', flexDirection: 'column', flex: 1 }}>
        {/* Title */}
        <h3
          style={{
            margin: '0 0 8px',
            fontSize: 16,
            fontWeight: 700,
            color: HF_DARK,
            lineHeight: 1.3,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {meal.name}
        </h3>

        {/* Meta row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginBottom: 10,
            flexWrap: 'wrap',
          }}
        >
          {/* Prep time */}
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#556B5F', fontSize: 13 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            {meal.prepTime} min
          </span>

          {/* Servings */}
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#556B5F', fontSize: 13 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            {meal.servings} servings
          </span>

          <DifficultyBadge difficulty={meal.difficulty} />
        </div>

        {/* Ingredients count */}
        <p style={{ margin: '0 0 10px', fontSize: 13, color: '#6B7F75' }}>
          {meal.ingredients.length} ingredients
        </p>

        {/* Tags */}
        {meal.tags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
            {meal.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                style={{
                  background: HF_LIGHT_GREEN,
                  color: HF_GREEN,
                  fontSize: 11,
                  fontWeight: 500,
                  padding: '3px 9px',
                  borderRadius: 20,
                  border: `1px solid ${HF_BORDER}`,
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Add to plan button + dropdown */}
        <div ref={dropdownRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setDropdownOpen((v) => !v)}
            style={{
              width: '100%',
              padding: '11px 18px',
              background: dropdownOpen ? '#368F52' : HF_GREEN,
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              transition: 'background 0.15s ease',
              letterSpacing: '0.02em',
            }}
            onMouseEnter={(e) => {
              if (!dropdownOpen) (e.currentTarget as HTMLButtonElement).style.background = '#368F52'
            }}
            onMouseLeave={(e) => {
              if (!dropdownOpen) (e.currentTarget as HTMLButtonElement).style.background = HF_GREEN
            }}
          >
            {selectedDay ? `Added to ${selectedDay}` : 'Add to plan'}
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              style={{ transform: dropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {dropdownOpen && (
            <div
              style={{
                position: 'absolute',
                bottom: 'calc(100% + 6px)',
                left: 0,
                right: 0,
                background: '#fff',
                border: `1px solid ${HF_BORDER}`,
                borderRadius: 10,
                boxShadow: '0 8px 24px rgba(29,47,42,0.15)',
                overflow: 'hidden',
                zIndex: 100,
              }}
            >
              {DAYS.map((day) => (
                <button
                  key={day}
                  onClick={() => handleDaySelect(day)}
                  style={{
                    width: '100%',
                    padding: '10px 16px',
                    background: 'transparent',
                    border: 'none',
                    borderBottom: `1px solid ${HF_BORDER}`,
                    textAlign: 'left',
                    fontSize: 14,
                    color: HF_DARK,
                    cursor: 'pointer',
                    fontWeight: 500,
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = HF_LIGHT_GREEN
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = 'transparent'
                  }}
                >
                  {day}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function HelloFreshPage() {
  const router = useRouter()
  const [meals, setMeals] = useState<HFMeal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [skip, setSkip] = useState(0)
  const take = 20

  useEffect(() => {
    setLoading(true)
    setError(null)

    // Read saved prefs from localStorage (same source as InlinePreferences)
    let dietType = ''
    let cuisines: string[] = []
    try {
      const raw = localStorage.getItem('mmp.prefs')
      if (raw) {
        const p = JSON.parse(raw) as { dietType?: string; cuisines?: string[] }
        dietType = p.dietType ?? ''
        cuisines = p.cuisines ?? []
      }
    } catch { /* ignore */ }

    const params = new URLSearchParams({ skip: String(skip), take: String(take) })
    if (dietType && dietType !== 'omnivore') params.set('dietType', dietType)
    for (const c of cuisines) params.append('cuisines', c)

    fetch(`/api/hellofresh-meals?${params}`)
      .then((r) => r.json())
      .then((data: { meals: HFMeal[] }) => {
        setMeals(data.meals ?? [])
      })
      .catch(() => {
        setError('Could not load meals. Please try again.')
      })
      .finally(() => setLoading(false))
  }, [skip])

  return (
    <>
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        * { box-sizing: border-box; }
        body { margin: 0; }
      `}</style>

      <div style={{ minHeight: '100vh', background: HF_BG, fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
        {/* Header */}
        <header
          style={{
            background: HF_DARK,
            padding: '0 24px',
            position: 'sticky',
            top: 0,
            zIndex: 50,
            boxShadow: '0 2px 12px rgba(0,0,0,0.2)',
          }}
        >
          <div
            style={{
              maxWidth: 1200,
              margin: '0 auto',
              height: 64,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            {/* Logo area */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  background: HF_GREEN,
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
              </div>
              <span
                style={{
                  color: '#fff',
                  fontSize: 18,
                  fontWeight: 800,
                  letterSpacing: '-0.02em',
                }}
              >
                HelloFresh <span style={{ color: HF_GREEN }}>Meals</span>
              </span>
            </div>

            {/* Back button */}
            <button
              onClick={() => router.push('/')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '9px 18px',
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: 8,
                color: '#fff',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.2)'
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.1)'
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              Back to planner
            </button>
          </div>
        </header>

        {/* Hero banner */}
        <div
          style={{
            background: `linear-gradient(135deg, ${HF_DARK} 0%, #2A5C3F 100%)`,
            padding: '48px 24px',
            textAlign: 'center',
          }}
        >
          <div style={{ maxWidth: 640, margin: '0 auto' }}>
            <p
              style={{
                margin: '0 0 8px',
                fontSize: 13,
                fontWeight: 700,
                color: HF_GREEN,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
              }}
            >
              Browse &amp; Plan
            </p>
            <h1
              style={{
                margin: '0 0 16px',
                fontSize: 'clamp(28px, 5vw, 42px)',
                fontWeight: 900,
                color: '#fff',
                lineHeight: 1.1,
                letterSpacing: '-0.03em',
              }}
            >
              Fresh recipes,<br />
              <span style={{ color: HF_GREEN }}>delivered to your plan</span>
            </h1>
            <p style={{ margin: 0, color: 'rgba(255,255,255,0.7)', fontSize: 16, lineHeight: 1.6 }}>
              Choose any meal and add it to a day in your weekly planner with one click.
            </p>
          </div>
        </div>

        {/* Main content */}
        <main style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px 80px' }}>
          {error && (
            <div
              style={{
                background: '#FDECEA',
                border: '1px solid #FBBCB8',
                borderRadius: 10,
                padding: '16px 20px',
                color: '#B91C1C',
                marginBottom: 32,
                fontSize: 14,
              }}
            >
              {error}
            </div>
          )}

          {/* Section heading */}
          {!loading && !error && (
            <div style={{ marginBottom: 28, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h2
                  style={{
                    margin: '0 0 4px',
                    fontSize: 22,
                    fontWeight: 800,
                    color: HF_DARK,
                    letterSpacing: '-0.02em',
                  }}
                >
                  {meals.length} recipes available
                </h2>
                <p style={{ margin: 0, color: '#6B7F75', fontSize: 14 }}>
                  Click &quot;Add to plan&quot; on any card to schedule it for a day
                </p>
              </div>
            </div>
          )}

          {/* Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))',
              gap: 24,
            }}
          >
            {loading
              ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
              : meals.map((meal) => <MealCard key={meal.id} meal={meal} />)}
          </div>

          {/* Pagination */}
          {!loading && meals.length > 0 && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                gap: 12,
                marginTop: 48,
              }}
            >
              {skip > 0 && (
                <button
                  onClick={() => setSkip(Math.max(0, skip - take))}
                  style={{
                    padding: '12px 28px',
                    background: '#fff',
                    border: `1.5px solid ${HF_BORDER}`,
                    borderRadius: 10,
                    color: HF_DARK,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = HF_LIGHT_GREEN
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = '#fff'
                  }}
                >
                  ← Previous
                </button>
              )}
              <button
                onClick={() => setSkip(skip + take)}
                style={{
                  padding: '12px 28px',
                  background: HF_GREEN,
                  border: 'none',
                  borderRadius: 10,
                  color: '#fff',
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = '#368F52'
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = HF_GREEN
                }}
              >
                Next recipes →
              </button>
            </div>
          )}
        </main>
      </div>
    </>
  )
}

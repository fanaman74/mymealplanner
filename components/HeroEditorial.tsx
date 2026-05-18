'use client'

// Option B — Editorial split hero: serif copy left, framed video card right.
// Uses design-file color values directly (not the app's HF-green remaps).

const CREAM   = '#F6EFE0'
const INK     = '#2A1F1A'
const TOMATO  = '#C73E2E'
const SAFFRON = '#E8A93B'
const BASIL   = '#5D7A3E'
const AUBERGINE = '#3D2433'
const MIST    = '#D9D2BF'
const PAPER   = '#FBF6EA'

const COOK_VIDEO  = 'https://videos.pexels.com/video-files/4253899/4253899-hd_1280_720_25fps.mp4'
const COOK_VIDEO2 = 'https://videos.pexels.com/video-files/3173305/3173305-hd_1920_1080_25fps.mp4'

const CUISINES = ['🇫🇷 Française', '🇮🇹 Italienne', '🇯🇵 Japonaise', '🇲🇽 Mexicaine', '🥦 Végé', '🐟 Pescetarien', '🌱 Vegan', '+ 8 autres']

function scrollToPlanner() {
  document.querySelector<HTMLElement>('[data-planner-action]')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  || window.scrollBy({ top: 600, behavior: 'smooth' })
}

export function HeroEditorial() {
  return (
    <div style={{
      width: '100%',
      background: CREAM,
      fontFamily: "'Geist', 'Helvetica Neue', system-ui, sans-serif",
      color: INK,
      position: 'relative',
      overflow: 'hidden',
      borderRadius: 20,
      marginBottom: 28,
    }}>
      <style>{`
        @keyframes mmp-hero-pulse {
          0%   { box-shadow: 0 0 0 0 rgba(199,62,46,0.6); }
          70%  { box-shadow: 0 0 0 10px rgba(199,62,46,0); }
          100% { box-shadow: 0 0 0 0 rgba(199,62,46,0); }
        }
        .mmp-hero-cta-primary:hover {
          opacity: 0.9;
          transform: translateY(-1px);
        }
        .mmp-hero-cta-outline:hover {
          background: rgba(42,31,26,0.06);
        }
        .mmp-hero-chip:hover {
          background: ${MIST};
        }
        @media (max-width: 860px) {
          .mmp-hero-grid { grid-template-columns: 1fr !important; }
          .mmp-hero-video-col { display: none !important; }
          .mmp-hero-headline { font-size: 64px !important; }
          .mmp-hero-scroll-hint { display: none !important; }
        }
        @media (max-width: 640px) {
          .mmp-hero-headline { font-size: 52px !important; }
          .mmp-hero-inner { padding: 28px 20px 36px !important; }
        }
      `}</style>

      {/* Dot pattern background */}
      <svg
        aria-hidden
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.45, pointerEvents: 'none' }}
      >
        <defs>
          <pattern id="mmp-editorial-dots" x="0" y="0" width="22" height="22" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1" fill={MIST} />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#mmp-editorial-dots)" />
      </svg>

      {/* Content grid */}
      <div
        className="mmp-hero-inner"
        style={{ position: 'relative', zIndex: 2, padding: '40px 44px 48px' }}
      >
        <div
          className="mmp-hero-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1.05fr',
            gap: 52,
            alignItems: 'start',
          }}
        >
          {/* ── LEFT: copy ── */}
          <div style={{ paddingTop: 32 }}>
            {/* Hand-written tagline */}
            <div style={{
              fontFamily: "'Caveat', cursive",
              color: TOMATO,
              fontSize: 24,
              transform: 'rotate(-2deg)',
              display: 'inline-block',
              marginBottom: 6,
              lineHeight: 1,
            }}>
              ✿ pour les familles qui cuisinent maison
            </div>

            {/* Main headline */}
            <h2
              className="mmp-hero-headline"
              style={{
                fontFamily: "'Instrument Serif', 'Times New Roman', serif",
                fontSize: 96,
                lineHeight: 0.9,
                fontWeight: 400,
                margin: '10px 0 0',
                letterSpacing: '-0.02em',
                color: INK,
              }}
            >
              Quoi{' '}
              <span style={{ fontStyle: 'italic', color: TOMATO }}>manger</span>
              <br />
              ce soir,
              <br />
              et toute la{' '}
              <span style={{ position: 'relative', display: 'inline-block' }}>
                semaine
                <svg
                  width="260"
                  height="14"
                  viewBox="0 0 260 14"
                  style={{ position: 'absolute', left: 0, bottom: -8, width: '100%' }}
                  aria-hidden
                >
                  <path
                    d="M3 8 C 54 1, 100 13, 155 6 S 245 1, 257 9"
                    stroke={TOMATO}
                    strokeWidth="3"
                    fill="none"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
              .
            </h2>

            {/* Body copy */}
            <p style={{
              fontSize: 16,
              lineHeight: 1.55,
              maxWidth: 440,
              marginTop: 36,
              color: AUBERGINE,
            }}>
              Sept dîners adaptés à votre famille — régimes, cuisines préférées,
              allergies, budget — avec liste de courses générée et mode cuisine pas à pas.
            </p>

            {/* CTAs */}
            <div style={{ display: 'flex', gap: 12, marginTop: 28, alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                className="mmp-hero-cta-primary"
                onClick={scrollToPlanner}
                style={{
                  background: INK,
                  color: CREAM,
                  border: 'none',
                  padding: '15px 24px',
                  borderRadius: 999,
                  fontSize: 15,
                  fontWeight: 500,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 10,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  fontFamily: 'inherit',
                }}
              >
                Composer ma semaine
                <span style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  background: TOMATO,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 13,
                  color: '#fff',
                }}>→</span>
              </button>
              <button
                className="mmp-hero-cta-outline"
                onClick={() => window.open('/print', '_blank')}
                style={{
                  background: 'transparent',
                  color: INK,
                  border: `1.5px solid ${AUBERGINE}`,
                  padding: '14px 20px',
                  borderRadius: 999,
                  fontSize: 14,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                  fontFamily: 'inherit',
                }}
              >
                <span>▶</span> Voir la liste
              </button>
            </div>

            {/* Cuisine chips */}
            <div style={{ marginTop: 36 }}>
              <div style={{
                fontSize: 10,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: AUBERGINE,
                opacity: 0.65,
                marginBottom: 10,
                fontWeight: 600,
              }}>
                Adapté à votre cuisine
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                {CUISINES.map((chip, i) => (
                  <span
                    key={i}
                    className="mmp-hero-chip"
                    style={{
                      padding: '6px 12px',
                      borderRadius: 999,
                      background: PAPER,
                      border: `1px solid ${MIST}`,
                      fontSize: 12,
                      cursor: 'default',
                      transition: 'background 0.12s',
                    }}
                  >
                    {chip}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* ── RIGHT: video card ── */}
          <div className="mmp-hero-video-col" style={{ position: 'relative', paddingTop: 16 }}>
            {/* Offset color block shadow */}
            <div style={{
              position: 'absolute',
              inset: '36px -14px -14px 14px',
              borderRadius: 24,
              background: TOMATO,
            }} />

            {/* Video card */}
            <div style={{
              position: 'relative',
              borderRadius: 24,
              overflow: 'hidden',
              height: 580,
              background: AUBERGINE,
              boxShadow: '0 30px 60px rgba(61,36,51,0.22)',
            }}>
              <video
                autoPlay
                muted
                loop
                playsInline
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  objectPosition: 'center 40%',
                  display: 'block',
                }}
              >
                <source src={COOK_VIDEO} type="video/mp4" />
                <source src={COOK_VIDEO2} type="video/mp4" />
              </video>

              {/* Caption overlay */}
              <div style={{
                position: 'absolute',
                left: 14,
                bottom: 14,
                right: 14,
                padding: '12px 14px',
                borderRadius: 14,
                background: 'rgba(26,20,16,0.72)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}>
                <div style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  background: TOMATO,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 18,
                  flexShrink: 0,
                }}>
                  👩‍🍳
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontFamily: "'Instrument Serif', serif",
                    fontStyle: 'italic',
                    fontSize: 16,
                    lineHeight: 1,
                  }}>
                    Maman cuisine ce soir
                  </div>
                  <div style={{ fontSize: 11, opacity: 0.72, marginTop: 2 }}>
                    Blanquette de veau · 2 h · 4 portions
                  </div>
                </div>
                <button style={{
                  padding: '7px 12px',
                  borderRadius: 999,
                  background: '#fff',
                  color: INK,
                  fontSize: 11,
                  fontWeight: 500,
                  border: 'none',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  fontFamily: 'inherit',
                }}>
                  Mode cuisine →
                </button>
              </div>

              {/* Saffron sticker */}
              <div style={{
                position: 'absolute',
                top: 16,
                right: 16,
                width: 76,
                height: 76,
                borderRadius: '50%',
                background: SAFFRON,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transform: 'rotate(12deg)',
                fontFamily: "'Instrument Serif', serif",
                fontStyle: 'italic',
                fontSize: 14,
                lineHeight: 1.15,
                textAlign: 'center',
                color: INK,
                boxShadow: '0 6px 14px rgba(61,36,51,0.18)',
                padding: 6,
              }}>
                nouveau<br />cette<br />semaine
              </div>
            </div>

            {/* Hand-written annotation */}
            <div style={{
              position: 'absolute',
              right: -2,
              top: -4,
              fontFamily: "'Caveat', cursive",
              color: BASIL,
              fontSize: 19,
              transform: 'rotate(8deg)',
              lineHeight: 1.3,
              pointerEvents: 'none',
            }}>
              ↘ vraie famille,<br />&nbsp;&nbsp;vraie cuisine
            </div>
          </div>
        </div>

        {/* Scroll hint */}
        <div
          className="mmp-hero-scroll-hint"
          style={{
            marginTop: 32,
            fontSize: 11,
            color: AUBERGINE,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            display: 'flex',
            justifyContent: 'center',
            opacity: 0.6,
          }}
        >
          Voir la semaine ↓
        </div>
      </div>
    </div>
  )
}

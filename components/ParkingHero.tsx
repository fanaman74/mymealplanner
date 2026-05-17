// components/ParkingHero.tsx
'use client'

import { useLang } from '@/lib/i18n-context'

export function ParkingHero() {
  const { lang } = useLang()
  const signText =
    lang === 'fr' ? 'SUPERMARCHÉ' : lang === 'nl' ? 'SUPERMARKT' : 'SUPERMARKET'

  return (
    <div
      style={{
        width: '100%',
        borderRadius: 20,
        overflow: 'hidden',
        position: 'relative',
        marginBottom: 28,
        boxShadow: '0 4px 24px rgba(42,31,26,0.1)',
      }}
    >
      <style>{`
        @keyframes mmp-cloud1 {
          0%,100% { transform: translateX(0); }
          50%     { transform: translateX(-18px); }
        }
        @keyframes mmp-cloud2 {
          0%,100% { transform: translateX(0); }
          50%     { transform: translateX(14px); }
        }
        @keyframes mmp-flag {
          0%,100% { transform: skewX(0deg) scaleX(1); }
          50%     { transform: skewX(10deg) scaleX(0.92); }
        }
        .mmp-cloud1 { animation: mmp-cloud1 9s ease-in-out infinite; }
        .mmp-cloud2 { animation: mmp-cloud2 13s ease-in-out infinite; }
        .mmp-flag   { animation: mmp-flag 1.8s ease-in-out infinite; transform-origin: left center; }
      `}</style>

      <svg
        width="100%"
        height="175"
        viewBox="0 0 900 175"
        preserveAspectRatio="xMidYMid slice"
        style={{ display: 'block' }}
      >
        <defs>
          <linearGradient id="mmp-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#C8E6F4" />
            <stop offset="100%" stopColor="#E8F4F8" />
          </linearGradient>
        </defs>

        {/* ── Sky ── */}
        <rect width="900" height="175" fill="url(#mmp-sky)" />

        {/* Sun */}
        <circle cx="830" cy="48" r="32" fill="#E8A93B" opacity="0.25" />
        <circle cx="830" cy="48" r="22" fill="#E8A93B" opacity="0.55" />
        <circle cx="830" cy="48" r="14" fill="#E8A93B" opacity="0.85" />

        {/* Cloud 1 */}
        <g className="mmp-cloud1">
          <ellipse cx="220" cy="58" rx="58" ry="20" fill="white" opacity="0.82" />
          <ellipse cx="196" cy="64" rx="38" ry="16" fill="white" opacity="0.82" />
          <ellipse cx="252" cy="64" rx="44" ry="16" fill="white" opacity="0.82" />
        </g>

        {/* Cloud 2 */}
        <g className="mmp-cloud2">
          <ellipse cx="580" cy="42" rx="48" ry="17" fill="white" opacity="0.72" />
          <ellipse cx="558" cy="48" rx="32" ry="14" fill="white" opacity="0.72" />
          <ellipse cx="608" cy="47" rx="36" ry="14" fill="white" opacity="0.72" />
        </g>

        {/* ── Left trees (foliage only, no trunk) ── */}
        <ellipse cx="58" cy="122" rx="28" ry="34" fill="#4A7A3A" />
        <ellipse cx="58" cy="112" rx="20" ry="26" fill="#5D7A3E" />

        <ellipse cx="95" cy="130" rx="22" ry="27" fill="#4A7A3A" />
        <ellipse cx="95" cy="122" rx="15" ry="20" fill="#5D7A3E" />

        {/* ── Building ── */}
        {/* Shadow */}
        <rect x="125" y="72" width="354" height="118" rx="4" fill="#2A1F1A" opacity="0.06" transform="translate(4,4)" />
        {/* Body */}
        <rect x="125" y="68" width="354" height="112" rx="4" fill="#FBF6EA" />
        {/* Roof strip */}
        <rect x="120" y="60" width="364" height="14" rx="3" fill="#C97A4D" />
        {/* Flag pole */}
        <rect x="476" y="38" width="3" height="26" fill="#C97A4D" />
        {/* Flag */}
        <g className="mmp-flag">
          <rect x="479" y="38" width="22" height="14" rx="1" fill="#C73E2E" />
        </g>

        {/* Windows — row of 4 */}
        {[145, 205, 265, 330].map((x, i) => (
          <g key={i}>
            <rect x={x} y="82" width="48" height="40" rx="3" fill="#A8D4E8" opacity="0.85" />
            <rect x={x + 4} y="84" width="12" height="36" rx="2" fill="white" opacity="0.22" />
          </g>
        ))}

        {/* Door (double) */}
        <rect x="398" y="100" width="68" height="80" rx="2" fill="#C0DCE8" opacity="0.9" />
        <line x1="432" y1="100" x2="432" y2="180" stroke="#D9D2BF" strokeWidth="1.5" />
        <rect x="420" y="138" width="9" height="3" rx="1.5" fill="#9BBCCC" />
        <rect x="435" y="138" width="9" height="3" rx="1.5" fill="#9BBCCC" />

        {/* Awning */}
        <rect x="145" y="148" width="318" height="18" rx="2" fill="#C73E2E" />
        {Array.from({ length: 16 }, (_, i) => (
          <rect key={i} x={145 + i * 20} y="148" width="10" height="18" fill="#E8A93B" opacity="0.55" />
        ))}

        {/* Sign */}
        <text
          x="302"
          y="57"
          textAnchor="middle"
          fontFamily="'Instrument Serif', serif"
          fontSize="15"
          fontWeight="bold"
          fill="#2A1F1A"
          letterSpacing="2.5"
        >
          {signText}
        </text>

        {/* Shopping cart near door */}
        <g transform="translate(476, 150)" fill="none" stroke="#5D7A3E" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M0 2 L3 2 L5 12 L15 12 L17 5 L3 5" />
          <circle cx="6" cy="15" r="2" />
          <circle cx="14" cy="15" r="2" />
        </g>

        {/* ── Right trees (foliage only, no trunk) ── */}
        <ellipse cx="512" cy="128" rx="24" ry="29" fill="#4A7A3A" />
        <ellipse cx="512" cy="119" rx="17" ry="22" fill="#5D7A3E" />

        <ellipse cx="549" cy="134" rx="20" ry="24" fill="#4A7A3A" />
        <ellipse cx="549" cy="126" rx="14" ry="18" fill="#5D7A3E" />
      </svg>
    </div>
  )
}

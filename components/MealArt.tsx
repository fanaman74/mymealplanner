// components/MealArt.tsx
// 7 different food illustration types, picked by seed

const PALETTES = [
  ['#C73E2E', '#E8A93B', '#5D7A3E'],
  ['#C97A4D', '#F1C9B4', '#5D7A3E'],
  ['#E8A93B', '#C73E2E', '#3D2433'],
  ['#5D7A3E', '#E8A93B', '#C97A4D'],
  ['#3D2433', '#F1C9B4', '#E8A93B'],
  ['#C97A4D', '#E8A93B', '#C73E2E'],
  ['#5D7A3E', '#C97A4D', '#F1C9B4'],
]

export const BG_COLORS = [
  '#EFD9B7', '#E6E1C2', '#D8E4D0', '#F3D4C5',
  '#F0D3A8', '#EEC58A', '#F2DBB0',
]

export function hashName(name: string): number {
  let h = 0
  for (let i = 0; i < name.length; i++) {
    h = Math.imul(31, h) + name.charCodeAt(i) | 0
  }
  return Math.abs(h)
}

interface MealArtProps {
  seed: number       // 0–6 day fallback
  name?: string      // meal name → unique hash
  height?: number
  className?: string
}

export function MealArt({ seed, name, height = 130, className }: MealArtProps) {
  const effectiveSeed = name ? hashName(name) : seed
  const paletteIdx = effectiveSeed % PALETTES.length
  const typeIdx    = effectiveSeed % 7
  const [a, b, c]  = PALETTES[paletteIdx]
  const bg         = BG_COLORS[effectiveSeed % BG_COLORS.length]
  const vw = 320
  const vh = height

  function Illustration() {
    switch (typeIdx) {
      // ── 0: Soup bowl ──
      case 0: return (
        <>
          <ellipse cx={vw*.5} cy={vh*.7} rx={vw*.38} ry={vh*.28} fill={a} opacity=".9" />
          <ellipse cx={vw*.5} cy={vh*.65} rx={vw*.3} ry={vh*.2} fill={b} opacity=".9" />
          {/* noodle swirls */}
          <path d={`M${vw*.36} ${vh*.63} Q${vw*.42} ${vh*.56} ${vw*.5} ${vh*.6} Q${vw*.58} ${vh*.64} ${vw*.64} ${vh*.57}`}
            stroke={c} strokeWidth="3" strokeLinecap="round" fill="none" />
          <path d={`M${vw*.38} ${vh*.68} Q${vw*.45} ${vh*.62} ${vw*.52} ${vh*.65} Q${vw*.59} ${vh*.68} ${vw*.62} ${vh*.63}`}
            stroke={c} strokeWidth="2.5" strokeLinecap="round" fill="none" opacity=".7" />
          {/* chopsticks */}
          <line x1={vw*.58} y1={vh*.2} x2={vw*.52} y2={vh*.72} stroke="#C97A4D" strokeWidth="2" strokeLinecap="round" opacity=".8" />
          <line x1={vw*.65} y1={vh*.18} x2={vw*.59} y2={vh*.72} stroke="#C97A4D" strokeWidth="2" strokeLinecap="round" opacity=".65" />
          {/* steam */}
          <path d={`M${vw*.42} ${vh*.33} Q${vw*.45} ${vh*.22} ${vw*.43} ${vh*.1}`} stroke="#FBF6EA" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity=".55" />
          <path d={`M${vw*.5} ${vh*.3} Q${vw*.53} ${vh*.18} ${vw*.51} ${vh*.06}`} stroke="#FBF6EA" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity=".4" />
        </>
      )
      // ── 1: Steak plate ──
      case 1: return (
        <>
          <ellipse cx={vw*.5} cy={vh*.68} rx={vw*.4} ry={vh*.3} fill={a} opacity=".15" />
          <ellipse cx={vw*.5} cy={vh*.67} rx={vw*.36} ry={vh*.26} fill="white" opacity=".7" />
          {/* steak shape */}
          <ellipse cx={vw*.48} cy={vh*.64} rx={vw*.22} ry={vh*.16} fill={a} opacity=".95" />
          <ellipse cx={vw*.48} cy={vh*.63} rx={vw*.16} ry={vh*.1} fill={b} opacity=".8" />
          {/* grill marks */}
          <line x1={vw*.37} y1={vh*.57} x2={vw*.43} y2={vh*.7} stroke="#2A1F1A" strokeWidth="2" opacity=".25" strokeLinecap="round" />
          <line x1={vw*.44} y1={vh*.56} x2={vw*.5} y2={vh*.69} stroke="#2A1F1A" strokeWidth="2" opacity=".25" strokeLinecap="round" />
          <line x1={vw*.51} y1={vh*.56} x2={vw*.57} y2={vh*.69} stroke="#2A1F1A" strokeWidth="2" opacity=".25" strokeLinecap="round" />
          {/* herbs */}
          <circle cx={vw*.7} cy={vh*.62} r={vh*.07} fill={c} opacity=".9" />
          <circle cx={vw*.74} cy={vh*.57} r={vh*.045} fill={c} opacity=".75" />
          {/* steam */}
          <path d={`M${vw*.45} ${vh*.3} Q${vw*.48} ${vh*.2} ${vw*.46} ${vh*.08}`} stroke="#FBF6EA" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity=".5" />
        </>
      )
      // ── 2: Pizza ──
      case 2: return (
        <>
          <circle cx={vw*.5} cy={vh*.6} r={vw*.35} fill={b} opacity=".9" />
          <circle cx={vw*.5} cy={vh*.6} r={vw*.28} fill="#F0C060" opacity=".85" />
          {/* sauce */}
          <circle cx={vw*.5} cy={vh*.6} r={vw*.22} fill={a} opacity=".75" />
          {/* toppings */}
          {[[.42,.52],[.58,.52],[.5,.47],[.38,.62],[.62,.62],[.5,.68],[.44,.58],[.56,.58]].map(([cx,cy],i) => (
            <circle key={i} cx={vw*cx} cy={vh*cy} r={vh*.04} fill={c} opacity=".85" />
          ))}
          {/* crust dots */}
          {[[.22,.6],[.28,.44],[.5,.3],[.72,.44],[.78,.6],[.72,.76],[.5,.9],[.28,.76]].map(([cx,cy],i) => (
            <circle key={i} cx={vw*cx} cy={vh*cy} r={3} fill={b} opacity=".5" />
          ))}
        </>
      )
      // ── 3: Salad bowl ──
      case 3: return (
        <>
          <ellipse cx={vw*.5} cy={vh*.68} rx={vw*.42} ry={vh*.28} fill={a} opacity=".2" />
          <ellipse cx={vw*.5} cy={vh*.66} rx={vw*.38} ry={vh*.24} fill={b} opacity=".85" />
          {/* lettuce blobs */}
          {[[.38,.55],[.5,.5],[.62,.55],[.44,.63],[.56,.63],[.35,.64],[.65,.62]].map(([cx,cy],i) => (
            <ellipse key={i} cx={vw*cx} cy={vh*cy} rx={vh*.085} ry={vh*.06}
              fill={c} opacity={.7+i*.03} transform={`rotate(${i*25} ${vw*cx} ${vh*cy})`} />
          ))}
          {/* cherry tomatoes */}
          <circle cx={vw*.45} cy={vh*.58} r={vh*.055} fill="#C73E2E" opacity=".9" />
          <circle cx={vw*.6} cy={vh*.6} r={vh*.05} fill="#C73E2E" opacity=".85" />
          <circle cx={vw*.52} cy={vh*.67} r={vh*.045} fill="#E8A93B" opacity=".9" />
          {/* fork */}
          <line x1={vw*.82} y1={vh*.2} x2={vw*.78} y2={vh*.72} stroke="#C97A4D" strokeWidth="2.2" strokeLinecap="round" opacity=".7" />
          {[-.025,0,.025].map((dx,i) => (
            <line key={i} x1={vw*(.82+dx)} y1={vh*.2} x2={vw*(.82+dx)} y2={vh*.32}
              stroke="#C97A4D" strokeWidth="1.5" strokeLinecap="round" opacity=".7" />
          ))}
        </>
      )
      // ── 4: Pasta ──
      case 4: return (
        <>
          <ellipse cx={vw*.5} cy={vh*.68} rx={vw*.4} ry={vh*.28} fill={a} opacity=".9" />
          <ellipse cx={vw*.5} cy={vh*.65} rx={vw*.32} ry={vh*.2} fill={b} opacity=".85" />
          {/* pasta swirls */}
          {[0,1,2,3,4].map(i => (
            <path key={i}
              d={`M${vw*(.33+i*.07)} ${vh*.58} Q${vw*(.37+i*.07)} ${vh*.51} ${vw*(.41+i*.07)} ${vh*.58} Q${vw*(.45+i*.07)} ${vh*.65} ${vw*(.41+i*.07)} ${vh*.72}`}
              stroke={c} strokeWidth="2.5" strokeLinecap="round" fill="none" opacity={.6+i*.06}
            />
          ))}
          {/* sauce blobs */}
          <circle cx={vw*.44} cy={vh*.58} r={vh*.045} fill={a} opacity=".8" />
          <circle cx={vw*.56} cy={vh*.62} r={vh*.035} fill={a} opacity=".7" />
          <circle cx={vw*.5} cy={vh*.68} r={vh*.04} fill={a} opacity=".75" />
          {/* basil */}
          <ellipse cx={vw*.62} cy={vh*.55} rx="9" ry="5" fill="#5D7A3E" opacity=".9" transform={`rotate(-15 ${vw*.62} ${vh*.55})`} />
          <ellipse cx={vw*.55} cy={vh*.52} rx="7" ry="4" fill="#5D7A3E" opacity=".75" transform={`rotate(10 ${vw*.55} ${vh*.52})`} />
          {/* steam */}
          <path d={`M${vw*.43} ${vh*.32} Q${vw*.46} ${vh*.2} ${vw*.44} ${vh*.08}`} stroke="#FBF6EA" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity=".5" />
          <path d={`M${vw*.53} ${vh*.3} Q${vw*.57} ${vh*.17} ${vw*.55} ${vh*.05}`} stroke="#FBF6EA" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity=".38" />
        </>
      )
      // ── 5: Burger / sandwich ──
      case 5: return (
        <>
          {/* bun bottom */}
          <ellipse cx={vw*.5} cy={vh*.76} rx={vw*.3} ry={vh*.1} fill={b} opacity=".9" />
          {/* layers */}
          <rect x={vw*.22} y={vh*.68} width={vw*.56} height={vh*.09} rx="4" fill="#E8A93B" opacity=".85" />
          <rect x={vw*.24} y={vh*.61} width={vw*.52} height={vh*.08} rx="3" fill={c} opacity=".9" />
          <rect x={vw*.23} y={vh*.54} width={vw*.54} height={vh*.08} rx="3" fill={a} opacity=".85" />
          <rect x={vw*.25} y={vh*.48} width={vw*.5} height={vh*.07} rx="3" fill="#F0C060" opacity=".8" />
          {/* bun top */}
          <ellipse cx={vw*.5} cy={vh*.43} rx={vw*.28} ry={vh*.14} fill={b} opacity=".95" />
          {/* sesame seeds */}
          {[[.44,.4],[.5,.37],[.56,.4],[.48,.44],[.54,.44]].map(([cx,cy],i) => (
            <ellipse key={i} cx={vw*cx} cy={vh*cy} rx="4" ry="2.5" fill="white" opacity=".6" transform={`rotate(${i*30} ${vw*cx} ${vh*cy})`} />
          ))}
        </>
      )
      // ── 6: Fish dish ──
      default: return (
        <>
          <ellipse cx={vw*.5} cy={vh*.68} rx={vw*.4} ry={vh*.26} fill="white" opacity=".75" />
          {/* fish body */}
          <ellipse cx={vw*.48} cy={vh*.62} rx={vw*.28} ry={vh*.12} fill={a} opacity=".9" />
          {/* tail */}
          <path d={`M${vw*.76} ${vh*.55} L${vw*.82} ${vh*.48} L${vw*.84} ${vh*.62} L${vw*.82} ${vh*.76} L${vw*.76} ${vh*.69} Z`}
            fill={a} opacity=".85" />
          {/* scales */}
          {[[.5,.58],[.42,.6],[.34,.62],[.56,.56],[.48,.64]].map(([cx,cy],i) => (
            <path key={i} d={`M${vw*cx} ${vh*cy} Q${vw*(cx+.05)} ${vh*(cy-.05)} ${vw*(cx+.1)} ${vh*cy}`}
              stroke={b} strokeWidth="1.5" fill="none" opacity=".6" />
          ))}
          {/* eye */}
          <circle cx={vw*.68} cy={vh*.6} r="5" fill="white" />
          <circle cx={vw*.68} cy={vh*.6} r="3" fill="#2A1F1A" />
          {/* lemon slices */}
          <circle cx={vw*.25} cy={vh*.64} r={vh*.06} fill="#E8A93B" opacity=".9" />
          <circle cx={vw*.25} cy={vh*.64} r={vh*.04} fill="#F0C060" opacity=".8" />
          {[[0,1],[.5,.5],[1,0],[.5,-.5]].map(([dx,dy],i) => (
            <line key={i}
              x1={vw*.25} y1={vh*.64}
              x2={vw*.25 + dx*vh*.06} y2={vh*.64 + dy*vh*.06}
              stroke="#E8A93B" strokeWidth="1" opacity=".6" />
          ))}
          {/* herbs */}
          <ellipse cx={vw*.3} cy={vh*.55} rx="8" ry="4" fill={c} opacity=".9" transform={`rotate(-20 ${vw*.3} ${vh*.55})`} />
          <ellipse cx={vw*.23} cy={vh*.57} rx="6" ry="3.5" fill={c} opacity=".75" transform={`rotate(10 ${vw*.23} ${vh*.57})`} />
          {/* steam */}
          <path d={`M${vw*.4} ${vh*.3} Q${vw*.43} ${vh*.2} ${vw*.41} ${vh*.08}`} stroke="#FBF6EA" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity=".5" />
        </>
      )
    }
  }

  return (
    <div
      className={className}
      style={{ width: '100%', height: vh, background: bg, overflow: 'hidden', position: 'relative', flexShrink: 0 }}
    >
      <svg
        width="100%" height={vh}
        viewBox={`0 0 ${vw} ${vh}`}
        preserveAspectRatio="xMidYMid slice"
        style={{ position: 'absolute', inset: 0 }}
        aria-hidden="true"
      >
        <Illustration />
        {/* vignette */}
        <defs>
          <linearGradient id={`vig-${effectiveSeed}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="transparent" />
            <stop offset="100%" stopColor="#2A1F1A" />
          </linearGradient>
        </defs>
        <rect x="0" y={vh * 0.55} width={vw} height={vh * 0.45} fill={`url(#vig-${effectiveSeed})`} opacity="0.12" />
      </svg>
    </div>
  )
}

// components/Motifs.tsx

interface MotifProps {
  color?: string
  size?: number
  className?: string
}

export function LeafMotif({ color = '#5D7A3E', size = 18, className }: MotifProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M4 20C4 11 11 4 20 4C20 13 13 20 4 20Z" fill={color} />
      <path d="M4 20L20 4" stroke="#F6EFE0" strokeWidth="1.2" />
    </svg>
  )
}

export function SquiggleMotif({ color = '#C73E2E', width = 56, className }: { color?: string; width?: number; className?: string }) {
  return (
    <svg width={width} height="10" viewBox="0 0 56 10" fill="none" className={className} aria-hidden="true">
      <path
        d="M1 5C5 1 9 9 14 5C19 1 23 9 28 5C33 1 37 9 42 5C47 1 51 9 55 5"
        stroke={color} strokeWidth="2" strokeLinecap="round" fill="none"
      />
    </svg>
  )
}

export function StarMotif({ color = '#C73E2E', size = 14, className }: MotifProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} className={className} aria-hidden="true">
      <path d="M12 2C12 8 8 12 2 12C8 12 12 16 12 22C12 16 16 12 22 12C16 12 12 8 12 2Z" />
    </svg>
  )
}

export function FlameMotif({ color = '#C73E2E', size = 14, className }: MotifProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} className={className} aria-hidden="true">
      <path d="M12 2C13 6 18 8 18 14C18 18 15 22 12 22C9 22 6 18 6 14C6 12 7 11 8 11C8 8 10 5 12 2Z" />
    </svg>
  )
}

export function ClockMotif({ color = '#2A1F1A', size = 13, className }: MotifProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  )
}

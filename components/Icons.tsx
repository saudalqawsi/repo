const P = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }

export function IconHelmet() {
  return (
    <svg viewBox="0 0 48 48" width="44" height="44" aria-hidden="true" {...P}>
      <path d="M8 30a16 16 0 0 1 32 0" />
      <path d="M5 30h38v4H5z" />
      <path d="M20 15v-3h8v3M24 12v8" />
      <path d="M15 38c2 3 5 4 9 4s7-1 9-4" />
    </svg>
  )
}
export function IconShield() {
  return (
    <svg viewBox="0 0 48 48" width="44" height="44" aria-hidden="true" {...P}>
      <path d="M24 5l15 6v11c0 10-6.5 17-15 21C15.5 39 9 32 9 22V11z" />
      <path d="M17 24l5 5 9-10" />
    </svg>
  )
}
export function IconTag() {
  return (
    <svg viewBox="0 0 48 48" width="44" height="44" aria-hidden="true" {...P}>
      <path d="M8 8h15l17 17-15 15L8 23z" />
      <circle cx="16" cy="16" r="3" />
      <path d="M22 30l8-8" />
    </svg>
  )
}
export function IconLock() {
  return (
    <svg viewBox="0 0 48 48" width="44" height="44" aria-hidden="true" {...P}>
      <rect x="10" y="21" width="28" height="21" rx="2" />
      <path d="M16 21v-6a8 8 0 0 1 16 0v6" />
      <path d="M24 29v6" />
    </svg>
  )
}
export const FEATURE_ICONS = [IconHelmet, IconShield, IconTag, IconLock]

/** Renter (customer) mark: a hard hat. Owners use the loader mark in yellow. */
export function IconRenter({ size = 18 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 15a8 8 0 0 1 16 0" />
      <path d="M2.5 15h19v2.5h-19z" />
      <path d="M10 7.5V6h4v1.5M12 6v5" />
    </svg>
  )
}

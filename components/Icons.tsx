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

/** Official Saudi Riyal sign (SAMA, 2025). Path from the OFL-licensed saudi-riyal-font. */
export const RIYAL_PATH =
  'M750,1119C730,1163,716,1211,711,1262L1136,1172C1156,1127,1169,1079,1174,1028L750,1119ZM1136,901C1156,857,1169,809,1174,758L843,828L843,693L1136,631C1156,587,1169,538,1174,488L843,558L843,72C793,100,748,138,711,183L711,586L579,614L579,6C528,34,483,72,447,117L447,642L151,705C131,750,117,798,112,849L447,777L447,948L88,1024C68,1068,55,1117,50,1167L425,1088C456,1081,482,1063,499,1038L568,936C575,926,579,913,579,899L579,749L711,721L711,992L1136,901Z'

export function RiyalSign({ size = 16, title }: { size?: number; title?: string }) {
  return (
    <svg viewBox="40 0 1145 1270" width={size} height={size} role={title ? 'img' : undefined} aria-hidden={title ? undefined : true} aria-label={title} fill="currentColor" style={{ display: 'inline-block', verticalAlign: '-0.1em' }}>
      <path d={RIYAL_PATH} />
    </svg>
  )
}

/* Guarantee icons: one per promise, same 48 grid and stroke as the feature icons. */
export function IconPrice() {
  return (
    <svg viewBox="0 0 48 48" width="44" height="44" aria-hidden="true" {...P}>
      <path d="M11 5h26v38l-4.3-3-4.4 3-4.3-3-4.3 3-4.4-3L11 43z" />
      <g transform="translate(12.7 8) scale(0.0185)" fill="currentColor" stroke="none">
        <path d={RIYAL_PATH} />
      </g>
      <path d="M17 36.5h14" />
    </svg>
  )
}
export function IconHeld() {
  return (
    <svg viewBox="0 0 48 48" width="44" height="44" aria-hidden="true" {...P}>
      <rect x="6" y="11" width="36" height="28" rx="2" />
      <circle cx="24" cy="25" r="7" />
      <path d="M24 21v4l3 2M10 39v3M38 39v3M42 20h-3M42 30h-3" />
    </svg>
  )
}
export function IconOnTime() {
  return (
    <svg viewBox="0 0 48 48" width="44" height="44" aria-hidden="true" {...P}>
      <circle cx="24" cy="26" r="16" />
      <path d="M24 16v10l7 4M19 5h10M24 5v5M38 10l3 3" />
    </svg>
  )
}
export function IconWorks() {
  return (
    <svg viewBox="0 0 48 48" width="44" height="44" aria-hidden="true" {...P}>
      <path d="M29.5 9.5a9 9 0 0 0-11.7 11.6L7 31.9a3.5 3.5 0 0 0 5 5l10.8-10.8a9 9 0 0 0 11.7-11.6l-5.4 5.4-4.6-1.1-1.1-4.6z" />
      <path d="M33 33l4 4 7-8" />
    </svg>
  )
}
export function IconHandover() {
  return (
    <svg viewBox="0 0 48 48" width="44" height="44" aria-hidden="true" {...P}>
      <path d="M5 15h8l3-5h16l3 5h8v25H5z" />
      <circle cx="24" cy="26" r="8" />
      <path d="M38 20h1" />
    </svg>
  )
}
export function IconScales() {
  return (
    <svg viewBox="0 0 48 48" width="44" height="44" aria-hidden="true" {...P}>
      <path d="M24 6v36M14 42h20M10 12h28M24 9v3" />
      <path d="M10 12l-6 14a6 6 0 0 0 12 0zM38 12l-6 14a6 6 0 0 0 12 0z" />
    </svg>
  )
}
export const GUARANTEE_ICONS = [IconPrice, IconHeld, IconOnTime, IconWorks, IconHandover, IconScales]

export const OWNER_ICONS = [IconTag, IconPrice, IconScales]
export function IconContract() {
  return (
    <svg viewBox="0 0 48 48" width="44" height="44" aria-hidden="true" {...P}>
      <path d="M11 4h19l9 9v31H11z" />
      <path d="M30 4v9h9M17 20h15M17 26h15M17 32h7" />
      <path d="M26 39c2-3 3-3 4-1s2 2 4-1" />
    </svg>
  )
}
export const ABOUT_ICONS = [IconContract, IconHeld, IconShield, IconHandover]

/** Vision: an eye looking out to the horizon. */
export function IconVision({ size = 40 }: { size?: number }) {
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} aria-hidden="true" {...P}>
      <path d="M4 24s7.5-12 20-12 20 12 20 12-7.5 12-20 12S4 24 4 24z" />
      <circle cx="24" cy="24" r="6.5" />
      <circle cx="24" cy="24" r="2" fill="currentColor" />
      <path d="M8 42h32" />
    </svg>
  )
}
/** Mission: a target with an arrow on it. */
export function IconMission({ size = 40 }: { size?: number }) {
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} aria-hidden="true" {...P}>
      <circle cx="22" cy="26" r="17" />
      <circle cx="22" cy="26" r="10" />
      <circle cx="22" cy="26" r="3" fill="currentColor" />
      <path d="M22 26L40 8M34 8h6v6" />
    </svg>
  )
}

/**
 * Shayul mark: a loader bucket carrying three squares of soil.
 * Read the other way it is the letter ش, the dots being its three dots.
 */
export function Mark({
  size = 40,
  ink = 'var(--ink)',
  dots = 'var(--sun)',
  title,
}: {
  size?: number
  ink?: string
  dots?: string
  title?: string
}) {
  return (
    <svg
      viewBox="0 0 64 52"
      width={size}
      height={Math.round((size * 52) / 64)}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      className="mark"
    >
      <g fill={dots}>
        <rect x="27" y="2" width="9" height="9" rx="1.2" transform="rotate(45 31.5 6.5)" />
        <rect x="20.5" y="12.5" width="9" height="9" rx="1.2" transform="rotate(45 25 17)" />
        <rect x="33.5" y="12.5" width="9" height="9" rx="1.2" transform="rotate(45 38 17)" />
      </g>
      <path
        fill={ink}
        d="M8 22 C5 33 9 44 21 46 L56 46 C58.5 46 60 44.5 61 42.5 L62 40.5 L48 40.5 C44 40.5 41.5 38.5 40 35 L36.5 26 L31 26 L27.5 34 C26.5 36.5 24.5 38 22 38 L18.5 38 C15.5 38 14 35.5 14.2 32 L15 22 Z"
      />
    </svg>
  )
}

/** Kept for existing imports: the small decorative mark used in section dividers. */
export function LoaderMark({ size = 30, color = 'var(--sun)' }: { size?: number; color?: string }) {
  return <Mark size={size} ink={color} dots={color} />
}

export function Brand({ label, sub, onDark }: { label: string; sub?: string; onDark?: boolean }) {
  return (
    <>
      <span className="brand-mark">
        <Mark size={54} ink={onDark ? '#fff' : 'var(--ink)'} />
      </span>
      <span className="brand-text">
        <b>{label}</b>
        {sub ? <small>{sub}</small> : null}
      </span>
    </>
  )
}

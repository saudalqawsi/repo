'use client'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

/**
 * Phone menu. Closes on any link tap, on page change, on Escape and on a tap outside,
 * so it can never stay open over the next page.
 */
export function MobileMenu({ label, children }: { label: string; children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const path = usePathname()
  const search = useSearchParams()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => setOpen(false), [path, search])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    const onDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onDown)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onDown)
    }
  }, [open])

  return (
    <div className="menu-btn" ref={ref} data-open={open}>
      <button type="button" className="icon-btn" aria-label={label} aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        {open ? (
          <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
        )}
      </button>
      <nav
        className="mnav"
        aria-label={label}
        hidden={!open}
        onClick={(e) => {
          if ((e.target as HTMLElement).closest('a')) setOpen(false)
        }}
      >
        {children}
      </nav>
    </div>
  )
}

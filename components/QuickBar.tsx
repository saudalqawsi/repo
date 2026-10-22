'use client'
import { useEffect, useState, type ReactNode } from 'react'

/**
 * Slim bar that fades in once the full header has scrolled away, keeping the
 * important links one tap away on every page.
 */
export function QuickBar({ children, label }: { children: ReactNode; label: string }) {
  const [show, setShow] = useState(false)
  useEffect(() => {
    const on = () => setShow(window.scrollY > 240)
    on()
    window.addEventListener('scroll', on, { passive: true })
    return () => window.removeEventListener('scroll', on)
  }, [])
  useEffect(() => {
    document.documentElement.toggleAttribute('data-qbar', show)
  }, [show])
  return (
    <div className="qbar" data-show={show} aria-hidden={!show} inert={!show} data-label={label}>
      <div className="wrap qbar-in">{children}</div>
    </div>
  )
}

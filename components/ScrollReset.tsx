'use client'
import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

/** Every page change starts at the top (unless the link points to an anchor). */
export function ScrollReset() {
  const path = usePathname()
  useEffect(() => {
    if (!window.location.hash) window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior })
  }, [path])
  return null
}

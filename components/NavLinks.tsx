'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function NavLinks({ links, className }: { links: { href: string; label: string }[]; className?: string }) {
  const path = usePathname()
  return (
    <nav className={className} aria-label="main">
      {links.map((l) => (
        <Link key={l.href} href={l.href} aria-current={path?.startsWith(l.href) ? 'page' : undefined}>
          {l.label}
        </Link>
      ))}
    </nav>
  )
}

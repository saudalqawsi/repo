'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function NavLinks({ links, className }: { links: { href: string; label: string; exact?: boolean }[]; className?: string }) {
  const path = usePathname() ?? ''
  return (
    <nav className={className} aria-label="main">
      {links.map((l) => {
        const on = l.exact ? path === l.href : path.startsWith(l.href)
        return (
          <Link key={l.href} href={l.href} aria-current={on ? 'page' : undefined}>
            {l.label}
          </Link>
        )
      })}
    </nav>
  )
}

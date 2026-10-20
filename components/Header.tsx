import Link from 'next/link'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { t, type Locale } from '@/lib/i18n'
import { Brand } from './Logo'
import { LangSwitch } from './LangSwitch'
import { NavLinks } from './NavLinks'

export async function Header({ locale }: { locale: Locale }) {
  const d = t(locale)
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const signedIn = Boolean(data?.claims)
  const L = (p: string) => `/${locale}${p}`
  const links = [
    { href: L('/equipment'), label: d.nav.equipment },
    { href: L('/how-it-works'), label: d.nav.how },
    { href: L('/providers'), label: d.nav.providers },
  ]

  return (
    <header className="hdr">
      <div className="wrap hdr-in">
        <Link href={L('')} className="brand" aria-label={locale === 'ar' ? 'شيول، الرئيسية' : 'Shayul home'}>
          <Brand label={locale === 'ar' ? 'شيول' : 'Shayul'} />
        </Link>
        <NavLinks links={links} className="nav" />
        <div className="hdr-end">
          <Suspense fallback={null}>
            <LangSwitch locale={locale} label={d.nav.switchTo} />
          </Suspense>
          {signedIn ? (
            <Link className="btn btn-ghost btn-sm hide-m" href={L('/account')}>{d.nav.myRequests}</Link>
          ) : (
            <Link className="btn btn-ghost btn-sm hide-m" href={L('/login')}>{d.nav.signIn}</Link>
          )}
          <Link className="btn btn-primary btn-sm hide-m" href={L('/request')}>{d.nav.request}</Link>
          <details className="menu-btn">
            <summary aria-label={d.nav.menu}>
              <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
            </summary>
            <nav className="mnav" aria-label={d.nav.menu}>
              {links.map((l) => (
                <Link key={l.href} href={l.href}>{l.label}</Link>
              ))}
              <Link href={signedIn ? L('/account') : L('/login')}>{signedIn ? d.nav.myRequests : d.nav.signIn}</Link>
              <Link className="btn btn-primary" href={L('/request')}>{d.nav.request}</Link>
            </nav>
          </details>
        </div>
      </div>
    </header>
  )
}

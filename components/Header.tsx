import Link from 'next/link'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { t, type Locale } from '@/lib/i18n'
import { Brand } from './Logo'
import { LangSwitch } from './LangSwitch'
import { NavLinks } from './NavLinks'
import { ContactLinks, IconPhone } from './Contact'
import { PHONE } from '@/lib/contact'

export async function Header({ locale }: { locale: Locale }) {
  const d = t(locale)
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const signedIn = Boolean(data?.claims)
  const L = (p: string) => `/${locale}${p}`
  const links = [
    { href: L(''), label: d.ui.home, exact: true },
    { href: L('/equipment'), label: d.nav.equipment },
    { href: L('/how-it-works'), label: d.nav.how },
    { href: L('/providers'), label: d.nav.providers },
  ]
  const account = signedIn ? { href: L('/account'), label: d.nav.myRequests } : { href: L('/login'), label: d.nav.signIn }

  return (
    <header className="hdr">
      <div className="wrap">
        <div className="hdr-box">
          <Link href={L('')} className="hdr-brand" aria-label={locale === 'ar' ? 'شيول، الرئيسية' : 'Shayul home'}>
            <Brand label={locale === 'ar' ? 'شيول' : 'Shayul'} sub={locale === 'ar' ? 'معدات بمشغّليها' : 'Equipment with operators'} />
          </Link>
          <div className="hdr-main">
            <div className="topbar">
              <ul>
                {d.ui.topbar.map((x) => <li key={x}>{x}</li>)}
              </ul>
              <div className="topbar-end">
                <ContactLinks locale={locale} variant="top" />
                <Link href={account.href}>{account.label}</Link>
                <Suspense fallback={null}>
                  <LangSwitch locale={locale} label={d.nav.switchTo} />
                </Suspense>
              </div>
            </div>
            <div className="navrow">
              <NavLinks links={links} className="nav" />
              <Link className="btn btn-primary btn-sm" href={L('/request')}>{d.nav.request}</Link>
            </div>
          </div>
          <a className="hdr-call" href={PHONE.tel} aria-label={`${d.contact.callLabel} ${PHONE.intl}`}>
            <IconPhone size={18} />
            <bdi dir="ltr">{PHONE.display}</bdi>
          </a>
          <details className="menu-btn">
            <summary aria-label={d.nav.menu}>
              <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
            </summary>
            <nav className="mnav" aria-label={d.nav.menu}>
              {links.map((l) => <Link key={l.href} href={l.href}>{l.label}</Link>)}
              <Link href={account.href}>{account.label}</Link>
              <div className="mnav-contact">
                <ContactLinks locale={locale} variant="buttons" />
              </div>
              <div className="mnav-lang">
                <Suspense fallback={null}>
                  <LangSwitch locale={locale} label={d.nav.switchTo} />
                </Suspense>
              </div>
              <Link className="btn btn-primary" href={L('/request')}>{d.nav.request}</Link>
            </nav>
          </details>
        </div>
      </div>
    </header>
  )
}

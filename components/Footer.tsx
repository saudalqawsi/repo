import Link from 'next/link'
import { t, type Locale } from '@/lib/i18n'
import { Brand, Mark } from './Logo'
import { ContactLinks } from './Contact'
import { IconRenter } from './Icons'
import { COMPANY } from '@/lib/company'

export function Footer({ locale }: { locale: Locale }) {
  const d = t(locale)
  const L = (p: string) => `/${locale}${p}`
  const email = process.env.NEXT_PUBLIC_CONTACT_EMAIL
  return (
    <footer className="ftr">
      <div className="wrap ftr-in">
        <div className="ftr-brand">
          <span className="brand"><Brand label={locale === 'ar' ? 'شيول' : 'Shayul'} /></span>
          <p>{d.footer.tagline}</p>
        </div>
        <nav aria-label={d.ui.explore}>
          <h2>{d.ui.explore}</h2>
          <Link href={L('/equipment')}>{d.nav.equipment}</Link>
          <Link href={L('/how-it-works')}>{d.nav.how}</Link>
          <Link href={L('/about')}>{d.nav.about}</Link>
        </nav>
        <nav aria-label={d.ui.renters} className="ftr-role ftr-renter">
          <h2><IconRenter /> {d.ui.renters}</h2>
          <Link href={L('/request')}>{d.nav.request}</Link>
          <Link href={L('/account')}>{d.nav.myRequests}</Link>
        </nav>
        <nav aria-label={d.ui.owners} className="ftr-role ftr-owner">
          <h2><Mark size={22} /> {d.ui.owners}</h2>
          <Link href={L('/providers')}>{d.home.providerCta}</Link>
          <Link href={L('/providers#needs')}>{d.prov.needTitle}</Link>
        </nav>
        <div className="ftr-contact">
          <h2>{d.contact.title}</h2>
          <ContactLinks locale={locale} variant="footer" />
          {email ? <a href={`mailto:${email}`}>{email}</a> : null}
        </div>
      </div>
      <div className="ftr-bar">
        <div className="wrap ftr-bar-in">
          <span>© 2026 · {d.footer.entity}</span>
          {COMPANY.unn || COMPANY.vat || COMPANY.zatcaCert ? (
            <span className="ftr-reg">
              {COMPANY.unn ? <span>{d.footer.unn} <bdi dir="ltr">{COMPANY.unn}</bdi></span> : null}
              {COMPANY.zatcaCert ? <span>{d.footer.zatca} <bdi dir="ltr">{COMPANY.zatcaCert}</bdi></span> : null}
              {COMPANY.vat ? <span>{d.footer.vat} <bdi dir="ltr">{COMPANY.vat}</bdi></span> : null}
            </span>
          ) : null}
        </div>
      </div>
    </footer>
  )
}

import Link from 'next/link'
import { photoProps } from '@/lib/photos'

export default function NotFound() {
  return (
    <>
      <section className="banner banner-slim">
        <img className="banner-img" alt="" {...photoProps('flow')} />
        <div className="wrap banner-in">
          <h1>الصفحة غير موجودة · Page not found</h1>
          <span className="dash" aria-hidden="true"><i /><i /></span>
        </div>
      </section>
      <div className="flow" style={{ textAlign: 'center' }}>
        <p className="muted" style={{ margin: '12px 0 4px' }}>الرابط غير صحيح أو نُقلت الصفحة.</p>
        <p className="muted" lang="en" dir="ltr" style={{ margin: '0 0 24px' }}>The link is wrong or the page has moved.</p>
        <div className="center-row" style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12, marginTop: 0 }}>
          <Link className="btn btn-primary" href="/ar">الرئيسية</Link>
          <Link className="btn btn-dark" href="/en" lang="en">Home</Link>
        </div>
      </div>
    </>
  )
}

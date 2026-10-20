import Link from 'next/link'

export default function NotFound() {
  return (
    <>
      <section className="banner banner-slim">
        <img className="banner-img" src="/img/hero.jpg" alt="" />
        <div className="wrap banner-in">
          <h1>الصفحة غير موجودة · Page not found</h1>
          <span className="dash" aria-hidden="true"><i /><i /></span>
        </div>
      </section>
      <div className="flow" style={{ textAlign: 'center' }}>
        <p className="muted" style={{ margin: '12px 0 24px' }}>الرابط غير صحيح أو نُقلت الصفحة.</p>
        <Link className="btn btn-primary" href="/ar">الرئيسية</Link>
      </div>
    </>
  )
}

import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flow" style={{ textAlign: 'center' }}>
      <h1>الصفحة غير موجودة · Page not found</h1>
      <p className="muted" style={{ margin: '12px 0 24px' }}>الرابط غير صحيح أو نُقلت الصفحة.</p>
      <Link className="btn btn-primary" href="/ar">الرئيسية</Link>
    </div>
  )
}

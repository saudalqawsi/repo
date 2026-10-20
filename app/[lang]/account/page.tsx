import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { isLocale, t } from '@/lib/i18n'
import { createClient } from '@/lib/supabase/server'
import { CancelButton } from '@/components/CancelButton'

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params
  return isLocale(lang) ? { title: t(lang).acc.title, robots: { index: false } } : {}
}

type Row = {
  id: string
  ref: string
  status: keyof ReturnType<typeof t>['acc']['status']
  start_date: string
  site_label: string
  request_items: { qty: number; equipment: { name_ar: string; name_en: string } | null }[]
}

export default async function AccountPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  if (!isLocale(lang)) notFound()
  const d = t(lang)
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getClaims()
  if (!auth?.claims) redirect(`/${lang}/login?next=/${lang}/account`)

  const { data } = await supabase
    .from('rental_requests')
    .select('id,ref,status,start_date,site_label,request_items(qty,equipment(name_ar,name_en))')
    .order('created_at', { ascending: false })
    .limit(50)
  const rows = (data ?? []) as unknown as Row[]
  const fmt = new Intl.DateTimeFormat(lang === 'ar' ? 'ar-SA-u-ca-gregory' : 'en-GB', { day: 'numeric', month: 'long' })

  return (
    <div className="wrap" style={{ maxWidth: 880, paddingBlock: '40px 64px' }}>
      <div className="sec-h">
        <h1 style={{ fontSize: 'clamp(1.8rem, 3.4vw, 2.6rem)' }}>{d.acc.title}</h1>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link className="btn btn-primary btn-sm" href={`/${lang}/request`}>{d.acc.newRequest}</Link>
          <form action="/auth/signout" method="post">
            <input type="hidden" name="lang" value={lang} />
            <button className="btn btn-ghost btn-sm" type="submit">{d.nav.signOut}</button>
          </form>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="panel" style={{ textAlign: 'center' }}>
          <p className="muted" style={{ marginBottom: 16 }}>{d.acc.empty}</p>
          <Link className="btn btn-primary" href={`/${lang}/request`}>{d.acc.emptyCta}</Link>
        </div>
      ) : (
        <ul className="reqs" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {rows.map((r) => (
            <li className="req" key={r.id}>
              <div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                  <b>{r.request_items.map((i) => `${lang === 'ar' ? i.equipment?.name_ar : i.equipment?.name_en} × ${i.qty}`).join('، ')}</b>
                  <span className="status" data-s={r.status}>{d.acc.status[r.status]}</span>
                </div>
                <p className="small muted" style={{ marginTop: 4 }}>
                  {r.ref} · {r.site_label} · {d.acc.starts} {fmt.format(new Date(r.start_date))}
                </p>
              </div>
              {['submitted', 'reviewing', 'matched'].includes(r.status) ? <CancelButton id={r.id} label={d.acc.cancel} /> : <span />}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

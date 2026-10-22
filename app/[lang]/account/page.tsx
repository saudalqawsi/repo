import type { Metadata } from 'next'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { PageBanner } from '@/components/PageBanner'
import { NextSteps } from '@/components/NextSteps'
import { notFound, redirect } from 'next/navigation'
import { isLocale, t, type Locale } from '@/lib/i18n'
import { createClient } from '@/lib/supabase/server'
import { CancelButton } from '@/components/CancelButton'
import { AdminRequestControls, AdminReviewApp, ProviderRespond } from '@/components/DashActions'
import { IconRenter } from '@/components/Icons'
import { Mark } from '@/components/Logo'

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params
  return isLocale(lang) ? { title: t(lang).nav.dashboard, robots: { index: false } } : {}
}

type Dict = ReturnType<typeof t>
type Status = keyof Dict['acc']['status']
type Role = 'customer' | 'provider' | 'admin'
type Row = {
  id: string
  ref: string
  status: Status
  start_date: string
  site_label: string
  provider_id?: string | null
  request_items: { qty: number; equipment: { name_ar: string; name_en: string } | null }[]
}
type App = { id: string; user_id: string; company_name: string; cr_number: string | null; city: string | null; fleet_size: string | null; status: 'new' | 'approved' | 'rejected'; created_at: string }

const SELECT = 'id,ref,status,start_date,site_label,request_items(qty,equipment(name_ar,name_en))'

function RequestRow({ r, lang, d, children }: { r: Row; lang: Locale; d: Dict; children?: ReactNode }) {
  const nf = new Intl.NumberFormat(lang === 'ar' ? 'ar-SA' : 'en-US')
  const fmt = new Intl.DateTimeFormat(lang === 'ar' ? 'ar-SA-u-ca-gregory' : 'en-GB', { day: 'numeric', month: 'long' })
  return (
    <li className="req">
      <div>
        <div className="req-head">
          <b>{r.request_items.map((i) => `${lang === 'ar' ? i.equipment?.name_ar : i.equipment?.name_en} × ${nf.format(i.qty)}`).join(lang === 'ar' ? '، ' : ', ')}</b>
          <span className="status" data-s={r.status}>{d.acc.status[r.status]}</span>
        </div>
        <p className="small muted req-meta">
          {r.ref} · {r.site_label} · {d.acc.starts} {fmt.format(new Date(r.start_date))}
        </p>
      </div>
      {children ? <div className="req-actions">{children}</div> : null}
    </li>
  )
}

function Section({ title, count, children }: { title: string; count?: number; children: ReactNode }) {
  return (
    <section className="dash-sec">
      <h2 className="dash-h">
        {title}
        {typeof count === 'number' ? <span className="dash-count">{count}</span> : null}
      </h2>
      {children}
    </section>
  )
}

function Empty({ text }: { text: string }) {
  return <p className="dash-empty">{text}</p>
}

export default async function AccountPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  if (!isLocale(lang)) notFound()
  const d = t(lang)
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getClaims()
  if (!auth?.claims) redirect(`/${lang}/login?next=/${lang}/account`)
  const uid = auth.claims.sub as string

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', uid).maybeSingle()
  const role: Role = (profile?.role as Role) ?? 'customer'
  const L = (p: string) => `/${lang}${p}`

  const roleIcon = role === 'customer' ? <IconRenter size={20} /> : <Mark size={26} color={role === 'admin' ? 'var(--ink)' : 'var(--sun)'} />

  let body: ReactNode = null

  if (role === 'customer') {
    const [{ data }, { data: apps }] = await Promise.all([
      supabase.from('rental_requests').select(SELECT).eq('customer_id', uid).order('created_at', { ascending: false }).limit(50),
      supabase.from('provider_applications').select('id,status,company_name').eq('user_id', uid).order('created_at', { ascending: false }).limit(1),
    ])
    const rows = (data ?? []) as unknown as Row[]
    const app = apps?.[0] as { status: App['status']; company_name: string } | undefined
    body = (
      <>
        {app ? (
          <div className="dash-note">
            <Mark size={24} />
            <span>{d.dash.app}: <b>{app.company_name}</b></span>
            <span className="status" data-s={app.status === 'approved' ? 'completed' : app.status === 'rejected' ? 'cancelled' : 'reviewing'}>{d.dash.appStatus[app.status]}</span>
          </div>
        ) : null}
        {rows.length === 0 ? (
          <div className="panel" style={{ textAlign: 'center' }}>
            <p className="muted" style={{ marginBottom: 16 }}>{d.acc.empty}</p>
            <Link className="btn btn-primary" href={L('/request')}>{d.acc.emptyCta}</Link>
          </div>
        ) : (
          <ul className="reqs">
            {rows.map((r) => (
              <RequestRow key={r.id} r={r} lang={lang} d={d}>
                {['matched', 'contracted'].includes(r.status) ? (
                  <>
                    <button className="btn btn-ghost btn-sm" type="button" disabled title={d.after.soon}>{d.after.contract} · {d.after.soon}</button>
                    <button className="btn btn-ghost btn-sm" type="button" disabled title={d.after.soon}>{d.after.payment} · {d.after.soon}</button>
                  </>
                ) : null}
                {['submitted', 'reviewing', 'matched'].includes(r.status) ? (
                  <CancelButton id={r.id} label={d.acc.cancel} confirm={d.acc.cancelConfirm} keep={d.acc.cancelKeep} />
                ) : null}
              </RequestRow>
            ))}
          </ul>
        )}
        <div style={{ marginTop: 28 }}>
          <NextSteps d={d.after} locale={lang} />
        </div>
      </>
    )
  }

  if (role === 'provider') {
    const { data } = await supabase.from('rental_requests').select(SELECT).eq('provider_id', uid).order('start_date', { ascending: true }).limit(100)
    const rows = (data ?? []) as unknown as Row[]
    const offered = rows.filter((r) => r.status === 'reviewing')
    const accepted = rows.filter((r) => r.status !== 'reviewing')
    body = (
      <>
        <Section title={d.dash.offered} count={offered.length}>
          {offered.length === 0 ? (
            <Empty text={d.dash.noOffers} />
          ) : (
            <ul className="reqs">
              {offered.map((r) => (
                <RequestRow key={r.id} r={r} lang={lang} d={d}>
                  <ProviderRespond id={r.id} accept={d.dash.accept} decline={d.dash.decline} failed={d.dash.failed} />
                </RequestRow>
              ))}
            </ul>
          )}
        </Section>
        <Section title={d.dash.accepted} count={accepted.length}>
          {accepted.length === 0 ? (
            <Empty text={d.dash.noAccepted} />
          ) : (
            <ul className="reqs">
              {accepted.map((r) => <RequestRow key={r.id} r={r} lang={lang} d={d} />)}
            </ul>
          )}
        </Section>
        <Section title={d.dash.fleet}>
          <div className="dash-note">
            <span>{d.dash.fleetSoon}</span>
            <span className="soon">{d.after.soon}</span>
          </div>
        </Section>
      </>
    )
  }

  if (role === 'admin') {
    const [{ data }, { data: appsData }, { data: provs }] = await Promise.all([
      supabase.from('rental_requests').select(SELECT + ',provider_id').order('created_at', { ascending: false }).limit(200),
      supabase.from('provider_applications').select('id,user_id,company_name,cr_number,city,fleet_size,status,created_at').order('created_at', { ascending: false }).limit(100),
      supabase.from('profiles').select('id,full_name,company').eq('role', 'provider'),
    ])
    const rows = (data ?? []) as unknown as Row[]
    const apps = (appsData ?? []) as App[]
    const companyOf = new Map(apps.filter((a) => a.status === 'approved').map((a) => [a.user_id, a.company_name]))
    const providers = (provs ?? []).map((p) => ({ id: p.id as string, name: (p.company as string) || companyOf.get(p.id as string) || (p.full_name as string) || (p.id as string).slice(0, 8) }))
    const statusKeys = Object.keys(d.acc.status) as Status[]
    const statuses = statusKeys.map((s) => ({ value: s, label: d.acc.status[s] }))
    const nf = new Intl.NumberFormat(lang === 'ar' ? 'ar-SA' : 'en-US')
    const count = (s: Status[]) => rows.filter((r) => s.includes(r.status)).length
    const tiles = [
      { label: d.dash.open, n: count(['submitted', 'reviewing']) },
      { label: d.acc.status.matched, n: count(['matched', 'contracted']) },
      { label: d.acc.status.active, n: count(['active']) },
      { label: d.dash.applications, n: apps.filter((a) => a.status === 'new').length },
    ]
    const newApps = apps.filter((a) => a.status === 'new')
    const labels = { offerTo: d.dash.offerTo, notOffered: d.dash.notOffered, noProviders: d.dash.noProviders, setStatus: d.dash.setStatus, failed: d.dash.failed }
    body = (
      <>
        <ul className="dash-tiles" aria-label={d.dash.overview}>
          {tiles.map((x) => (
            <li key={x.label}><b>{nf.format(x.n)}</b><span>{x.label}</span></li>
          ))}
        </ul>
        <Section title={d.dash.applications} count={newApps.length}>
          {newApps.length === 0 ? (
            <Empty text={d.dash.noApps} />
          ) : (
            <ul className="reqs">
              {newApps.map((a) => (
                <li className="req req-owner" key={a.id}>
                  <div>
                    <div className="req-head"><b>{a.company_name}</b></div>
                    <p className="small muted req-meta">
                      {[a.cr_number && `${d.dash.cr} ${a.cr_number}`, a.city, a.fleet_size && `${d.dash.fleetSize} ${a.fleet_size}`].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                  <div className="req-actions">
                    <AdminReviewApp id={a.id} approve={d.dash.approve} reject={d.dash.reject} failed={d.dash.failed} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Section>
        <Section title={d.dash.allRequests} count={rows.length}>
          {rows.length === 0 ? (
            <Empty text={d.dash.noRequests} />
          ) : (
            <ul className="reqs">
              {rows.map((r) => (
                <RequestRow key={r.id} r={r} lang={lang} d={d}>
                  <AdminRequestControls id={r.id} status={r.status} providerId={r.provider_id ?? null} providers={providers} statuses={statuses} labels={labels} />
                </RequestRow>
              ))}
            </ul>
          )}
        </Section>
      </>
    )
  }

  return (
    <>
      <PageBanner locale={lang} title={d.dash.title[role]} slim />
      <div className="wrap dashboard" data-role={role}>
        <div className="acc-bar">
          <span className="dash-role">{roleIcon} {d.dash.role[role]}</span>
          <div className="acc-bar-end">
            {role === 'customer' ? <Link className="btn btn-primary btn-sm" href={L('/request')}>{d.acc.newRequest}</Link> : null}
            <form action="/auth/signout" method="post">
              <input type="hidden" name="lang" value={lang} />
              <button className="btn btn-ghost btn-sm" type="submit">{d.nav.signOut}</button>
            </form>
          </div>
        </div>
        {body}
      </div>
    </>
  )
}

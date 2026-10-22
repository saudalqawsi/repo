'use client'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { useState } from 'react'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import type { Dict, Locale } from '@/lib/i18n'
import { HUBS, RADII } from '@/lib/hubs'
import type { Pin } from './SiteMap'

const SiteMap = dynamic(() => import('./SiteMap').then((m) => m.SiteMap), { ssr: false, loading: () => <div className="map-inline"><div className="map-box" /></div> })

const Schema = z.object({
  company_name: z.string().trim().min(2).max(160),
  cr_number: z.string().regex(/^\d{10}$/),
  city: z.string().trim().min(2).max(60),
  fleet_size: z.enum(['1-5', '6-20', '21+']),
  hub: z.string().trim().min(2).max(80),
  hub_lat: z.number().min(16).max(33),
  hub_lng: z.number().min(34).max(56),
  radius_km: z.number().int().min(5).max(500),
})

const toWestern = (s: string) => s.replace(/[٠-٩]/g, (c) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(c)))

export function ProviderForm({ locale, d, signedIn }: { locale: Locale; d: Dict['prov']; signedIn: boolean }) {
  const [state, setState] = useState<'idle' | 'busy' | 'done'>('idle')
  const [err, setErr] = useState<string | null>(null)
  const [company, setCompany] = useState('')
  const [cr, setCr] = useState('')
  const [crCheck, setCrCheck] = useState<{ state: 'idle' | 'busy' | 'ok' | 'notfound' | 'manual'; status?: string | null }>({ state: 'idle' })
  const [hub, setHub] = useState<string>(HUBS[0].id)
  const [pin, setPin] = useState<Pin | null>(null)
  const [radius, setRadius] = useState<number>(50)

  if (!signedIn) {
    return (
      <div className="panel">
        <h2 style={{ fontSize: 20, marginBottom: 10 }}>{d.formTitle}</h2>
        <p className="muted" style={{ marginBottom: 16 }}>{d.signInFirst}</p>
        <Link className="btn btn-primary btn-block" href={`/${locale}/login?next=/${locale}/providers%23apply`}>
          {locale === 'ar' ? 'تسجيل الدخول' : 'Sign in'}
        </Link>
      </div>
    )
  }
  if (state === 'done') return <div className="panel alert-ok" role="status">{d.done}</div>

  async function lookUp(value: string) {
    const n = toWestern(value)
    if (!/^\d{10}$/.test(n)) return
    setCrCheck({ state: 'busy' })
    try {
      const res = await fetch(`/api/cr?cr=${n}&lang=${locale}`)
      if (res.status === 501) return setCrCheck({ state: 'manual' })
      const j = (await res.json().catch(() => ({}))) as { found?: boolean; name?: string | null; status?: string | null }
      if (res.ok && j.found && j.name) {
        setCompany(j.name)
        setCrCheck({ state: 'ok', status: j.status })
      } else if (res.ok) setCrCheck({ state: 'notfound' })
      else setCrCheck({ state: 'manual' })
    } catch {
      setCrCheck({ state: 'manual' })
    }
  }

  const chosen = HUBS.find((h) => h.id === hub)
  const base = chosen ? { lat: chosen.lat, lng: chosen.lng } : pin

  return (
    <form
      className="panel"
      id="apply"
      style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
      onSubmit={async (e) => {
        e.preventDefault()
        setErr(null)
        const f = new FormData(e.currentTarget)
        if (!base) {
          setErr(d.errHub)
          return
        }
        const hubName = chosen ? (locale === 'ar' ? chosen.ar : chosen.en) : d.hubOther
        const parsed = Schema.safeParse({
          company_name: company,
          cr_number: toWestern(cr),
          city: String(f.get('city') ?? ''),
          fleet_size: String(f.get('fleet_size') ?? ''),
          hub: hubName,
          hub_lat: base.lat,
          hub_lng: base.lng,
          radius_km: radius,
        })
        if (!parsed.success) {
          setErr(parsed.error.issues.some((i) => i.path[0] === 'cr_number') ? d.errCr : d.errGeneric)
          return
        }
        setState('busy')
        const { error } = await createClient()
          .from('provider_applications')
          .insert({ ...parsed.data, coverage: `${hubName} · ${radius} km` })
        if (error) {
          setErr(d.errGeneric)
          setState('idle')
        } else setState('done')
      }}
    >
      <h2 style={{ fontSize: 20 }}>{d.formTitle}</h2>
      <label className="field">
        <span>{d.cr}</span>
        <input
          className="input"
          name="cr_number"
          required
          inputMode="numeric"
          maxLength={10}
          dir="ltr"
          value={cr}
          onChange={(e) => {
            setCr(e.target.value)
            setCrCheck({ state: 'idle' })
            if (toWestern(e.target.value).length === 10) void lookUp(e.target.value)
          }}
          aria-describedby="cr-note"
        />
        <small id="cr-note" className={`cr-note cr-${crCheck.state}`} role="status">
          {crCheck.state === 'busy' ? d.crChecking : crCheck.state === 'ok' ? `${d.crOk}${crCheck.status ? ` · ${crCheck.status}` : ''}` : crCheck.state === 'notfound' ? d.crNotFound : crCheck.state === 'manual' ? d.crManual : d.crHint}
        </small>
      </label>
      <label className="field">
        <span>{d.company}</span>
        <input className="input" name="company_name" required maxLength={160} autoComplete="organization" value={company} onChange={(e) => setCompany(e.target.value)} readOnly={crCheck.state === 'ok'} />
      </label>
      <label className="field"><span>{d.city}</span>
        <select className="input" name="city" defaultValue={d.riyadh}><option>{d.riyadh}</option></select>
      </label>
      <label className="field"><span>{d.fleet}</span>
        <select className="input" name="fleet_size" defaultValue="1-5"><option>1-5</option><option>6-20</option><option>21+</option></select>
      </label>
      <label className="field">
        <span>{d.hub}</span>
        <select className="input" value={hub} onChange={(e) => setHub(e.target.value)}>
          {HUBS.map((h) => <option key={h.id} value={h.id}>{locale === 'ar' ? h.ar : h.en}</option>)}
          <option value="other">{d.hubOther}</option>
        </select>
        <small className="muted">{d.hubHint}</small>
      </label>
      {hub === 'other' ? (
        <div className="field">
          <span>{d.hubPin}</span>
          <SiteMap
            query=""
            pin={pin}
            locale={locale}
            labels={{ hint: d.hubPinHint, notFound: d.hubPinHint, searching: d.hubPinHint, pinned: d.hubPinned, empty: d.hubPinHint }}
            onPin={setPin}
          />
        </div>
      ) : null}
      <label className="field">
        <span>{d.radius}</span>
        <select className="input" value={radius} onChange={(e) => setRadius(+e.target.value)}>
          {RADII.map((r) => <option key={r} value={r}>{d.radiusOpt.replace('{n}', new Intl.NumberFormat(locale === 'ar' ? 'ar-SA' : 'en-US').format(r))}</option>)}
        </select>
      </label>
      {err ? <p className="alert alert-err" role="alert">{err}</p> : null}
      <button className="btn btn-primary" type="submit" disabled={state === 'busy'}>{d.submit}</button>
    </form>
  )
}

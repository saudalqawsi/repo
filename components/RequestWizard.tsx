'use client'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cutout, formatSar, rateFor, type Basis, type Category, type Equipment } from '@/lib/catalog'
import { durationPhrase, fill, type Dict, type Locale } from '@/lib/i18n'
import { SampleContract } from './SampleContract'
import { NextSteps } from './NextSteps'

type DetailKey = 'ground' | 'access' | 'shift' | 'permits' | 'flex'
type Draft = {
  items: Record<string, number>
  site: string
  lat: number | null
  lng: number | null
  start: string
  basis: Basis
  duration: number
  details: Partial<Record<DetailKey, number>>
  contact: string
  notes: string
  source: 'form' | 'assistant'
}

const DRAFT_KEY = 'shayul.request.draft'
const DETAIL_KEYS: DetailKey[] = ['ground', 'access', 'shift', 'permits', 'flex']
const today = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10)

function fromParams(sp: URLSearchParams | null): Draft {
  const items: Record<string, number> = {}
  for (const part of (sp?.get('items') ?? '').split(',')) {
    const [slug, q] = part.split(':')
    if (slug && /^[a-z0-9-]{2,60}$/.test(slug)) items[slug] = Math.min(10, Math.max(1, parseInt(q || '1', 10) || 1))
  }
  const basis = (['daily', 'weekly', 'monthly', 'lump_sum'] as const).find((b) => b === sp?.get('basis')) ?? 'weekly'
  const dur = parseInt(sp?.get('dur') ?? '1', 10)
  const details: Partial<Record<DetailKey, number>> = {}
  for (const part of (sp?.get('det') ?? '').split(',')) {
    const [k, v] = part.split(':')
    const i = parseInt(v ?? '', 10)
    if ((DETAIL_KEYS as string[]).includes(k) && Number.isInteger(i) && i >= 0 && i < 4) details[k as DetailKey] = i
  }
  const start = sp?.get('start') ?? ''
  return {
    items,
    site: (sp?.get('site') ?? '').slice(0, 200),
    lat: null,
    lng: null,
    start: /^\d{4}-\d{2}-\d{2}$/.test(start) && start >= today() ? start : '',
    basis,
    duration: Number.isFinite(dur) ? Math.min(365, Math.max(1, dur)) : 1,
    details,
    contact: '',
    notes: (sp?.get('notes') ?? '').slice(0, 2000),
    source: sp?.get('src') === 'assistant' ? 'assistant' : 'form',
  }
}

export function RequestWizard({
  locale,
  d,
  eqd,
  equipment,
  categories,
  signedIn,
  cd,
  ad,
}: {
  locale: Locale
  d: Dict['req']
  eqd: Dict['eq']
  cd: Dict['contract']
  ad: Dict['after']
  equipment: Equipment[]
  categories: Category[]
  signedIn: boolean
}) {
  const router = useRouter()
  const sp = useSearchParams()
  const [draft, setDraft] = useState<Draft>(() => fromParams(sp))
  const [step, setStep] = useState(() => (Object.keys(fromParams(sp).items).length ? 1 : 0))
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [geo, setGeo] = useState<'idle' | 'busy' | 'ok' | 'fail'>('idle')
  const [done, setDone] = useState<string | null>(null)

  // restore draft after sign-in
  useEffect(() => {
    if (sp?.get('resume') !== '1') return
    try {
      const raw = sessionStorage.getItem(DRAFT_KEY)
      if (raw) {
        setDraft(JSON.parse(raw) as Draft)
        setStep(4)
      }
    } catch {}
  }, [sp])

  const bySlug = useMemo(() => new Map(equipment.map((e) => [e.slug, e])), [equipment])
  const chosen = Object.entries(draft.items).filter(([s]) => bySlug.has(s))
  const name = (e: Equipment) => (locale === 'ar' ? e.name_ar : e.name_en)
  const num = (n: number) => new Intl.NumberFormat(locale === 'ar' ? 'ar-SA' : 'en-US').format(n)
  const totalQty = chosen.reduce((a, [, q]) => a + q, 0)
  const set = (patch: Partial<Draft>) => setDraft((x) => ({ ...x, ...patch }))

  const accuracy = Math.min(
    100,
    40 + DETAIL_KEYS.filter((k) => draft.details[k] !== undefined).length * 10 + (draft.contact ? 5 : 0) + (draft.lat ? 5 : 0),
  )

  const estimate = useMemo(() => {
    if (draft.basis === 'lump_sum') return null
    let sum = 0
    for (const [slug, qty] of chosen) {
      const r = rateFor(bySlug.get(slug)!, draft.basis)
      if (!r) return null
      sum += r * qty * draft.duration
    }
    return sum ? { sub: sum, vat: sum * 0.15, total: sum * 1.15 } : null
  }, [chosen, draft.basis, draft.duration, bySlug])

  function validate(s: number) {
    if (s === 0 && chosen.length === 0) return d.errEquipment
    if (s === 1 && draft.site.trim().length < 2) return d.errSite
    if (s === 2 && (!draft.start || draft.start < today())) return d.errDate
    return null
  }
  function go(to: number) {
    if (to > step) {
      for (let s = step; s < to; s++) {
        const e = validate(s)
        if (e) {
          setErr(e)
          return
        }
      }
    }
    setErr(null)
    setStep(to)
    window.scrollTo({ top: 0 })
  }

  async function submit() {
    for (let s = 0; s < 3; s++) {
      const e = validate(s)
      if (e) {
        setErr(e)
        setStep(s)
        return
      }
    }
    if (!signedIn) {
      try {
        sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
      } catch {}
      router.push(`/${locale}/login?next=${encodeURIComponent(`/${locale}/request?resume=1`)}`)
      return
    }
    setBusy(true)
    setErr(null)
    const details: Record<string, string> = {}
    for (const k of DETAIL_KEYS) {
      const i = draft.details[k]
      if (i !== undefined) details[k] = d.fields[k].o[i]
    }
    if (draft.contact) details.site_contact = draft.contact.slice(0, 20)
    const { data, error } = await createClient().rpc('submit_rental_request', {
      p_source: draft.source,
      p_basis: draft.basis,
      p_site_label: draft.site.trim().slice(0, 200),
      p_site_lat: draft.lat,
      p_site_lng: draft.lng,
      p_start_date: draft.start,
      p_duration: draft.basis === 'lump_sum' ? null : draft.duration,
      p_details: details,
      p_notes: draft.notes.trim().slice(0, 2000) || null,
      p_accuracy: accuracy,
      p_items: chosen.map(([slug, qty]) => ({ slug, qty })),
    })
    setBusy(false)
    if (error || !data?.[0]) {
      setErr(d.errSubmit)
      return
    }
    try {
      sessionStorage.removeItem(DRAFT_KEY)
    } catch {}
    setDone(data[0].ref)
  }

  if (done) {
    return (
      <div className="panel" role="status">
        <h2 className="flow-h">{d.done}</h2>
        <p className="muted" style={{ marginBottom: 20 }}>{fill(d.doneText, { ref: done })}</p>
        <NextSteps d={ad} />
        <Link className="btn btn-primary" style={{ marginTop: 20 }} href={`/${locale}/account`}>{d.toAccount}</Link>
      </div>
    )
  }

  const unit =
    draft.basis === 'lump_sum' ? '' : locale === 'ar' ? durationPhrase(locale, draft.basis, draft.duration) : draft.duration === 1 ? d.unitOne[draft.basis] : d.units[draft.basis]

  return (
    <div className="panel">
      <div className="progress" aria-hidden="true">
        {d.steps.map((_, i) => (
          <span key={i} data-on={i <= step} />
        ))}
      </div>
      <p className="step-label">{d.steps[step]} · {num(step + 1)}/{num(d.steps.length)}</p>

      {step === 0 && (
        <>
          <h2 className="flow-h">{d.qEquipment}</h2>
          <p className="muted">{d.hintEquipment}</p>
          {categories.map((c) => {
            const list = equipment.filter((e) => e.category === c.slug)
            if (!list.length) return null
            return (
              <div key={c.slug} style={{ marginTop: 22 }}>
                <h2 className="pick-cat">{locale === 'ar' ? c.name_ar : c.name_en}</h2>
                <div className="pick-grid">
                  {list.map((e) => {
                    const q = draft.items[e.slug] ?? 0
                    return (
                      <div key={e.slug} className="pick" aria-pressed={q > 0}>
                        <button
                          type="button"
                          className="pick-btn"
                          onClick={() => set({ items: { ...draft.items, [e.slug]: q > 0 ? 0 : 1 } })}
                          aria-pressed={q > 0}
                        >
                          <span className="pick-img"><img src={cutout(e).src} alt="" loading="lazy" /></span>
                          <b>{name(e)}</b>
                          <dl className="meta">
                            <div><dt>{eqd.model}</dt><dd>{e.model ?? '—'}</dd></div>
                            <div><dt>{eqd.year}</dt><dd>{e.model_year ? num(e.model_year).replace(/[,٬]/g, '') : '—'}</dd></div>
                            <div><dt>{eqd.plate}</dt><dd>{e.plate ?? '—'}</dd></div>
                          </dl>
                        </button>
                        <span className="qty" data-hidden={q === 0}>
                          <button type="button" aria-label="−" tabIndex={q ? 0 : -1} onClick={() => set({ items: { ...draft.items, [e.slug]: q - 1 } })}>−</button>
                          <output aria-live="polite">{num(q)}</output>
                          <button type="button" aria-label="+" tabIndex={q ? 0 : -1} onClick={() => set({ items: { ...draft.items, [e.slug]: Math.min(10, q + 1) } })}>+</button>
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </>
      )}

      {step === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h2 className="flow-h">{d.qSite}</h2>
          <label className="field">
            <span className="vh">{d.qSite}</span>
            <input className="input" value={draft.site} maxLength={200} placeholder={d.sitePlaceholder} onChange={(e) => set({ site: e.target.value })} autoFocus />
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-ghost"
              disabled={geo === 'busy'}
              onClick={() => {
                if (!('geolocation' in navigator)) return setGeo('fail')
                setGeo('busy')
                navigator.geolocation.getCurrentPosition(
                  (p) => {
                    set({ lat: +p.coords.latitude.toFixed(6), lng: +p.coords.longitude.toFixed(6), site: draft.site || `${p.coords.latitude.toFixed(5)}, ${p.coords.longitude.toFixed(5)}` })
                    setGeo('ok')
                  },
                  () => setGeo('fail'),
                  { timeout: 10000 },
                )
              }}
            >
              {geo === 'busy' ? d.locating : d.useLocation}
            </button>
            {geo === 'ok' ? <span className="alert alert-ok small">{d.located}</span> : null}
            {geo === 'fail' ? <span className="alert alert-err small">{d.locFail}</span> : null}
          </div>
        </div>
      )}

      {step === 2 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <h2 className="flow-h">{d.qWhen}</h2>
          <label className="field">
            <span>{d.start}</span>
            <input className="input" type="date" min={today()} value={draft.start} onChange={(e) => set({ start: e.target.value })} />
          </label>
          <div className="field">
            <span>{d.basis}</span>
            <div className="opts" role="radiogroup" aria-label={d.basis}>
              {(Object.keys(d.basisOpts) as Basis[]).map((b) => (
                <button key={b} type="button" role="radio" aria-checked={draft.basis === b} aria-pressed={draft.basis === b} className="chip" onClick={() => set({ basis: b })}>
                  {d.basisOpts[b]}
                </button>
              ))}
            </div>
          </div>
          {draft.basis !== 'lump_sum' ? (
            <label className="field">
              <span>{d.duration}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span className="qty">
                  <button type="button" aria-label="−" onClick={() => set({ duration: Math.max(1, draft.duration - 1) })}>−</button>
                  <output>{num(draft.duration)}</output>
                  <button type="button" aria-label="+" onClick={() => set({ duration: Math.min(365, draft.duration + 1) })}>+</button>
                </span>
                <span className="muted">{unit}</span>
              </div>
            </label>
          ) : null}
        </div>
      )}

      {step === 3 && (
        <>
          <h2 className="flow-h">{d.qDetails}</h2>
          <p className="muted">{d.hintDetails}</p>
          <div className="meter">
            <span className="small">{d.accuracy}</span>
            <span className="meter-bar"><i style={{ width: `${accuracy}%` }} /></span>
            <b>{num(accuracy)}%</b>
          </div>
          {DETAIL_KEYS.map((k) => (
            <div className="q" key={k} role="radiogroup" aria-label={d.fields[k].q}>
              <span>{d.fields[k].q}</span>
              <div className="opts">
                {d.fields[k].o.map((o, i) => (
                  <button
                    key={o}
                    type="button"
                    role="radio"
                    aria-checked={draft.details[k] === i}
                    aria-pressed={draft.details[k] === i}
                    className="chip"
                    onClick={() => set({ details: { ...draft.details, [k]: draft.details[k] === i ? undefined : i } })}
                  >
                    {o}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <div style={{ display: 'grid', gap: 16, marginTop: 18 }}>
            <label className="field">
              <span>{d.contact}</span>
              <input className="input" type="tel" inputMode="numeric" dir="ltr" maxLength={20} placeholder="05XXXXXXXX" value={draft.contact} onChange={(e) => set({ contact: e.target.value.replace(/[^\d+٠-٩ ]/g, '') })} />
            </label>
            <label className="field">
              <span>{d.notes}</span>
              <textarea className="input" maxLength={2000} placeholder={d.notesPh} value={draft.notes} onChange={(e) => set({ notes: e.target.value })} />
            </label>
          </div>
        </>
      )}

      {step === 4 && (
        <>
          <h2 className="flow-h">{d.qReview}</h2>
          <div className="rows" style={{ marginTop: 14 }}>
            {chosen.map(([slug, qty]) => {
              const e = bySlug.get(slug)!
              const r = rateFor(e, draft.basis)
              return (
                <div className="row" key={slug}>
                  <span>{name(e)} × {num(qty)}</span>
                  <span className="muted">{r && draft.basis !== 'lump_sum' ? `${formatSar(r * qty * draft.duration, locale)} ${eqd.sar}` : eqd.onRequest}</span>
                </div>
              )
            })}
            <div className="row"><span className="muted">{d.steps[1]}</span><span>{draft.site}</span></div>
            <div className="row"><span className="muted">{d.start}</span><span>{draft.start}</span></div>
            <div className="row"><span className="muted">{d.basis}</span><span>{d.basisOpts[draft.basis]}{draft.basis !== 'lump_sum' ? ` · ${durationPhrase(locale, draft.basis, draft.duration)}` : ''}</span></div>
            <div className="row"><span className="muted">{d.accuracy}</span><span>{num(accuracy)}%</span></div>
          </div>

          <div className="estimate">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <b>{d.estimate}</b>
              <span className="tag">{eqd.indicative}</span>
            </div>
            {estimate ? (
              <div className="rows">
                <div className="row"><span>{d.subtotal}</span><span>{formatSar(estimate.sub, locale)} {eqd.sar}</span></div>
                <div className="row"><span>{d.vat}</span><span>{formatSar(estimate.vat, locale)} {eqd.sar}</span></div>
                <div className="row row-total"><span>{d.total}</span><span>{formatSar(estimate.total, locale)} {eqd.sar}</span></div>
              </div>
            ) : (
              <p className="muted">{eqd.onRequest}</p>
            )}
            <p className="small muted" style={{ marginTop: 8 }}>{d.estimateNote}</p>
            <p className="small muted" style={{ marginTop: 4 }}>{d.included}</p>
          </div>
          <details className="contract-wrap">
            <summary>{cd.title}</summary>
            <SampleContract
              locale={locale}
              d={cd}
              input={{
                items: chosen.map(([slug, qty]) => ({ name: name(bySlug.get(slug)!), qty })),
                site: draft.site || null,
                start: draft.start || null,
                duration: draft.basis === 'lump_sum' ? d.basisOpts.lump_sum : durationPhrase(locale, draft.basis, draft.duration),
                estimate: estimate ? { sub: estimate.sub, total: estimate.total } : null,
                conditions: DETAIL_KEYS.filter((k) => k !== 'flex' && draft.details[k] !== undefined).map((k) => `${d.fields[k].q}: ${d.fields[k].o[draft.details[k]!]}`),
              }}
            />
          </details>
          <NextSteps d={ad} />
        </>
      )}

      {err ? <p className="alert alert-err" role="alert" style={{ marginTop: 18 }}>{err}</p> : null}

      <div className="flow-actions">
        {step > 0 ? (
          <button type="button" className="btn btn-ghost" onClick={() => go(step - 1)}>{d.back}</button>
        ) : (
          <span className="sel-count" aria-live="polite">{totalQty ? fill(d.selectedCount, { n: num(totalQty) }) : d.hintEquipment}</span>
        )}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {step === 3 ? <button type="button" className="btn-link" onClick={() => go(4)}>{d.skip}</button> : null}
          {step < 4 ? (
            <button type="button" className="btn btn-dark" onClick={() => go(step + 1)}>
              {fill(d.nextTo, { step: d.steps[step + 1] })}
            </button>
          ) : (
            <button type="button" className="btn btn-primary" disabled={busy} onClick={submit}>
              {busy ? d.submitting : signedIn ? d.submit : d.signInToSubmit}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

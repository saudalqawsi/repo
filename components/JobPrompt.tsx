'use client'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { formatSar, rateFor, type Basis, type Equipment } from '@/lib/catalog'
import type { Dict, Locale } from '@/lib/i18n'

type Suggestion = { slug: string; qty: number; why?: string }
type Result = { items: Suggestion[]; basis: Basis; duration_value: number | null }

const MAX = 500

export function JobPrompt({
  locale,
  d,
  eqd,
  equipment,
  heroImage,
  heroAlt,
}: {
  locale: Locale
  d: Dict['home']
  eqd: Dict['eq']
  equipment: Equipment[]
  heroImage: string
  heroAlt: string
}) {
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<Result | null>(null)
  const [error, setError] = useState<string | null>(null)
  const areaRef = useRef<HTMLTextAreaElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!result && !error) return
    const el = cardRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    if (r.bottom > window.innerHeight || r.top < 0) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [result, error])
  const bySlug = new Map(equipment.map((e) => [e.slug, e]))

  async function ask(q: string) {
    const value = q.trim().slice(0, MAX)
    if (value.length < 3 || busy) return
    setBusy(true)
    setError(null)
    setResult(null)
    try {
      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ text: value, lang: locale }),
      })
      const json = await res.json().catch(() => ({}))
      if (res.status === 429) setError(d.limit)
      else if (!res.ok || !json.items?.length) setError(d.noMatch)
      else setResult(json as Result)
    } catch {
      setError(d.noMatch)
    } finally {
      setBusy(false)
    }
  }

  const name = (e: Equipment) => (locale === 'ar' ? e.name_ar : e.name_en)
  const featured = bySlug.get('loader-66') ?? equipment[0]

  const continueHref = result
    ? `/${locale}/request?` +
      new URLSearchParams({
        items: result.items.map((i) => `${i.slug}:${i.qty}`).join(','),
        basis: result.basis,
        ...(result.duration_value ? { dur: String(result.duration_value) } : {}),
        notes: text.trim().slice(0, MAX),
        src: 'assistant',
      }).toString()
    : '#'

  return (
    <div className="hero-grid">
      <div>
        <h1>{d.title}</h1>
        <p className="hero-lead">{d.lead}</p>

        <form
          className="prompt"
          onSubmit={(e) => {
            e.preventDefault()
            ask(text)
          }}
        >
          <label htmlFor="job" className="vh">{d.title}</label>
          <textarea
            id="job"
            ref={areaRef}
            value={text}
            maxLength={MAX}
            placeholder={d.placeholder}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                ask(text)
              }
            }}
          />
          <div className="prompt-bar">
            <span className="count" aria-hidden="true">{text.length}/{MAX}</span>
            <button className="btn btn-primary" type="submit" disabled={busy || text.trim().length < 3}>
              {busy ? <><span className="spinner" aria-hidden="true" />{d.thinking}</> : d.suggest}
            </button>
          </div>
        </form>

        <div className="chips" role="group" aria-label={d.or}>
          {d.jobs.map((j) => (
            <button
              key={j.label}
              type="button"
              className="chip"
              onClick={() => {
                setText(j.q)
                ask(j.q)
              }}
            >
              {j.label}
            </button>
          ))}
        </div>

        <ul className="promises">
          {d.promises.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      </div>

      <div className="stage">
        <img src={heroImage} alt={heroAlt} />
        <div className="stage-card" aria-live="polite" ref={cardRef}>
          {error ? (
            <div className="result">
              <p>{error}</p>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <Link className="btn btn-dark btn-sm" href={`/${locale}/equipment`}>{eqd.title}</Link>
                <button className="btn btn-ghost btn-sm" type="button" onClick={() => { setError(null); areaRef.current?.focus() }}>{d.tryAgain}</button>
              </div>
            </div>
          ) : result ? (
            <div className="result">
              <div className="result-h">
                <b>{d.resultTitle}</b>
                <span className="tag">{eqd.indicative}</span>
              </div>
              {result.items.map((s) => {
                const e = bySlug.get(s.slug)
                if (!e) return null
                const r = rateFor(e, result.basis === 'lump_sum' ? 'daily' : result.basis) ?? e.daily_rate_indicative
                const per = result.basis === 'weekly' ? eqd.perWeek : result.basis === 'monthly' ? eqd.perMonth : eqd.perDay
                return (
                  <div className="ritem" key={s.slug}>
                    <img src={e.image} alt="" />
                    <div>
                      <b>{name(e)}{s.qty > 1 ? ` × ${s.qty}` : ''}</b>
                      {s.why ? <span className="why">{s.why}</span> : null}
                    </div>
                    <div className="price">
                      {r ? (
                        <>
                          <strong>{formatSar(r, locale)}</strong> <span className="small muted">{eqd.sar}</span>
                          <div className="small muted">{per}</div>
                        </>
                      ) : (
                        <span className="small muted">{eqd.onRequest}</span>
                      )}
                    </div>
                  </div>
                )
              })}
              <p className="small muted">{d.resultNote}</p>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <Link className="btn btn-primary" href={continueHref}>{d.continue}</Link>
                <button className="btn btn-ghost" type="button" onClick={() => { setResult(null); areaRef.current?.focus() }}>{d.tryAgain}</button>
              </div>
            </div>
          ) : featured ? (
            <div className="ritem">
              <img src={featured.image} alt="" />
              <div>
                <b>{name(featured)}</b>
                <span className="why">{locale === 'ar' ? featured.spec_ar : featured.spec_en}</span>
              </div>
              <div className="price">
                <span className="small muted">{eqd.from} </span>
                <strong>{formatSar(featured.daily_rate_indicative ?? 0, locale)}</strong> <span className="small muted">{eqd.sar}</span>
                <div className="small muted">{eqd.perDay} · {eqd.indicative}</div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

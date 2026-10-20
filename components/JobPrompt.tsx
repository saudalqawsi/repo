'use client'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { cutout, formatSar, rateFor, type Basis, type Equipment } from '@/lib/catalog'
import type { Dict, Locale } from '@/lib/i18n'

type Suggestion = { slug: string; qty: number; why?: string }
type Result = { items: Suggestion[]; basis: Basis; duration_value: number | null }

const MAX = 500

export function JobPrompt({
  locale,
  d,
  eqd,
  equipment,
}: {
  locale: Locale
  d: Dict['home']
  eqd: Dict['eq']
  equipment: Equipment[]
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
    <div className="job">
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
        <span className="chips-label">{d.or}</span>
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

      <div className="answer" aria-live="polite" ref={cardRef}>
        {error ? (
          <div className="answer-box">
            <p>{error}</p>
            <div className="answer-actions">
              <Link className="btn btn-dark btn-sm" href={`/${locale}/equipment`}>{eqd.title}</Link>
              <button className="btn btn-ghost btn-sm" type="button" onClick={() => { setError(null); areaRef.current?.focus() }}>{d.tryAgain}</button>
            </div>
          </div>
        ) : result ? (
          <div className="answer-box">
            <div className="result-h">
              <b>{d.resultTitle}</b>
              <span className="tag">{eqd.indicative}</span>
            </div>
            <div className="ritems">
              {result.items.map((s) => {
                const e = bySlug.get(s.slug)
                if (!e) return null
                const r = rateFor(e, result.basis === 'lump_sum' ? 'daily' : result.basis) ?? e.daily_rate_indicative
                const per = result.basis === 'weekly' ? eqd.perWeek : result.basis === 'monthly' ? eqd.perMonth : eqd.perDay
                const img = cutout(e)
                return (
                  <div className="ritem" key={s.slug}>
                    <img src={img.src} alt="" className={img.cut ? 'is-cut' : ''} />
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
            </div>
            <p className="small muted">{d.resultNote}</p>
            <div className="answer-actions">
              <Link className="btn btn-primary" href={continueHref}>{d.continue}</Link>
              <button className="btn btn-ghost" type="button" onClick={() => { setResult(null); areaRef.current?.focus() }}>{d.tryAgain}</button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}

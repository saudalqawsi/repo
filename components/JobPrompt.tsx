'use client'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { cutout, formatSar, rateFor, type Basis, type Equipment } from '@/lib/catalog'
import { durationPhrase, type Dict, type Locale } from '@/lib/i18n'
import { DETAIL_ENUMS, type Attrs } from '@/lib/attrs'
import { SampleContract } from './SampleContract'

type Suggestion = { slug: string; qty: number; why?: string }
type Result = { items: Suggestion[]; basis: Basis; duration_value: number | null; attrs?: Partial<Attrs> }
type DetailKey = keyof typeof DETAIL_ENUMS

const MAX = 1000

/* Minimal typing for the browser speech API (Chrome/Edge/Safari). */
type SpeechRec = {
  lang: string
  continuous: boolean
  interimResults: boolean
  start(): void
  stop(): void
  onresult: ((e: { resultIndex: number; results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => void) | null
  onerror: ((e: { error: string }) => void) | null
  onend: (() => void) | null
}
function speechCtor(): (new () => SpeechRec) | null {
  if (typeof window === 'undefined') return null
  const w = window as unknown as { SpeechRecognition?: new () => SpeechRec; webkitSpeechRecognition?: new () => SpeechRec }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

export function JobPrompt({
  locale,
  d,
  eqd,
  rd,
  cd,
  equipment,
}: {
  locale: Locale
  d: Dict['home']
  eqd: Dict['eq']
  rd: Dict['req']
  cd: Dict['contract']
  equipment: Equipment[]
}) {
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<Result | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [listening, setListening] = useState(false)
  const [voiceMsg, setVoiceMsg] = useState<string | null>(null)
  const [showContract, setShowContract] = useState(false)
  const areaRef = useRef<HTMLTextAreaElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const recRef = useRef<SpeechRec | null>(null)
  const textRef = useRef('')
  textRef.current = text

  useEffect(() => {
    if (!result && !error) return
    cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [result, error])
  useEffect(() => () => recRef.current?.stop(), [])

  const bySlug = new Map(equipment.map((e) => [e.slug, e]))
  const num = (n: number) => new Intl.NumberFormat(locale === 'ar' ? 'ar-SA' : 'en-US').format(n)

  async function ask(q: string) {
    const value = q.trim().slice(0, MAX)
    if (value.length < 3 || busy) return
    setBusy(true)
    setError(null)
    setResult(null)
    setShowContract(false)
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

  function toggleVoice() {
    if (listening) {
      recRef.current?.stop()
      return
    }
    const Ctor = speechCtor()
    if (!Ctor) {
      setVoiceMsg(d.voiceUnsupported)
      return
    }
    const rec = new Ctor()
    rec.lang = locale === 'ar' ? 'ar-SA' : 'en-US'
    rec.continuous = true
    rec.interimResults = true
    const base = textRef.current ? textRef.current.trimEnd() + ' ' : ''
    rec.onresult = (e) => {
      let said = ''
      for (let i = 0; i < e.results.length; i++) said += e.results[i][0].transcript
      setText((base + said).slice(0, MAX))
    }
    rec.onerror = (e) => {
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') setVoiceMsg(d.voiceDenied)
    }
    rec.onend = () => {
      setListening(false)
      recRef.current = null
      if (textRef.current.trim().length >= 3) ask(textRef.current)
    }
    recRef.current = rec
    setVoiceMsg(null)
    setListening(true)
    try {
      rec.start()
    } catch {
      setListening(false)
      setVoiceMsg(d.voiceUnsupported)
    }
  }

  const name = (e: Equipment) => (locale === 'ar' ? e.name_ar : e.name_en)
  const attrs = result?.attrs ?? {}
  const detailLabel = (k: DetailKey) => {
    const v = attrs[k]
    if (!v) return null
    const i = (DETAIL_ENUMS[k] as readonly string[]).indexOf(v)
    return i >= 0 ? rd.fields[k].o[i] : null
  }
  const basis = result?.basis ?? 'weekly'
  const dur = result?.duration_value ?? null
  const durationText =
    result && basis !== 'lump_sum' && dur ? durationPhrase(locale, basis, dur) : result && basis === 'lump_sum' ? rd.basisOpts.lump_sum : null

  let estimate: { sub: number; total: number } | null = null
  if (result && basis !== 'lump_sum' && dur) {
    let sub = 0
    for (const s of result.items) {
      const e = bySlug.get(s.slug)
      const r = e ? rateFor(e, basis) : null
      if (!r) {
        sub = 0
        break
      }
      sub += r * s.qty * dur
    }
    if (sub) estimate = { sub, total: sub * 1.15 }
  }

  const detParam = (Object.keys(DETAIL_ENUMS) as DetailKey[])
    .map((k) => {
      const v = attrs[k]
      const i = v ? (DETAIL_ENUMS[k] as readonly string[]).indexOf(v) : -1
      return i >= 0 ? `${k}:${i}` : null
    })
    .filter(Boolean)
    .join(',')

  const continueHref = result
    ? `/${locale}/request?` +
      new URLSearchParams({
        items: result.items.map((i) => `${i.slug}:${i.qty}`).join(','),
        basis,
        ...(dur ? { dur: String(dur) } : {}),
        ...(attrs.site ? { site: attrs.site } : {}),
        ...(attrs.start_date ? { start: attrs.start_date } : {}),
        ...(detParam ? { det: detParam } : {}),
        notes: text.trim().slice(0, MAX),
        src: 'assistant',
      }).toString()
    : '#'

  const attrRows: { k: string; v: string | null }[] = result
    ? [
        { k: d.attrs.work, v: attrs.summary ?? null },
        { k: d.attrs.site, v: attrs.site ?? null },
        {
          k: d.attrs.start,
          v: attrs.start_date
            ? new Intl.DateTimeFormat(locale === 'ar' ? 'ar-SA-u-ca-gregory' : 'en-GB', { day: 'numeric', month: 'long' }).format(new Date(attrs.start_date))
            : null,
        },
        { k: d.attrs.duration, v: durationText },
        { k: d.attrs.ground, v: detailLabel('ground') },
        { k: d.attrs.access, v: detailLabel('access') },
        { k: d.attrs.shift, v: detailLabel('shift') },
        { k: d.attrs.permits, v: detailLabel('permits') },
      ]
    : []

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
          placeholder={listening ? d.listening : d.placeholder}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              ask(text)
            }
          }}
        />
        <div className="prompt-bar">
          <button
            type="button"
            className={`mic${listening ? ' on' : ''}`}
            onClick={toggleVoice}
            aria-pressed={listening}
            title={listening ? d.voiceStop : d.voice}
          >
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <rect x="9" y="3" width="6" height="11" rx="3" />
              <path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" />
            </svg>
            <span>{listening ? d.voiceStop : d.voice}</span>
          </button>
          <span className="count" aria-hidden="true">{num(text.length)}/{num(MAX)}</span>
          <button className="btn btn-primary" type="submit" disabled={busy || text.trim().length < 3}>
            {busy ? <><span className="spinner" aria-hidden="true" />{d.thinking}</> : d.suggest}
          </button>
        </div>
      </form>
      {listening ? <p className="voice-live" role="status"><i aria-hidden="true" />{d.listening}</p> : null}
      {voiceMsg ? <p className="alert alert-info small" role="status" style={{ marginTop: 10 }}>{voiceMsg}</p> : null}
      {!listening && !voiceMsg ? <p className="small muted voice-hint">{d.voiceHint}</p> : null}

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
                const r = rateFor(e, basis === 'lump_sum' ? 'daily' : basis) ?? e.daily_rate_indicative
                const per = basis === 'weekly' ? eqd.perWeek : basis === 'monthly' ? eqd.perMonth : eqd.perDay
                const img = cutout(e)
                return (
                  <div className="ritem" key={s.slug}>
                    <img src={img.src} alt="" className={img.cut ? 'is-cut' : ''} />
                    <div>
                      <b>{name(e)}{s.qty > 1 ? ` × ${num(s.qty)}` : ''}</b>
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

            <div>
              <b className="sub-h">{d.attrsTitle}</b>
              <dl className="attrs">
                {attrRows.map((r) => (
                  <div key={r.k} data-empty={!r.v}>
                    <dt>{r.k}</dt>
                    <dd>{r.v ?? d.notStated}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <p className="small muted">{d.resultNote}</p>
            <div className="answer-actions">
              <Link className="btn btn-primary" href={continueHref}>{d.continue}</Link>
              <button className="btn btn-ghost" type="button" aria-expanded={showContract} onClick={() => setShowContract((x) => !x)}>
                {showContract ? d.hideContract : d.showContract}
              </button>
              <button className="btn-link" type="button" onClick={() => { setResult(null); areaRef.current?.focus() }}>{d.tryAgain}</button>
            </div>
            {showContract ? (
              <SampleContract
                locale={locale}
                d={cd}
                input={{
                  items: result.items.flatMap((s) => {
                    const e = bySlug.get(s.slug)
                    return e ? [{ name: name(e), qty: s.qty }] : []
                  }),
                  site: attrs.site ?? null,
                  start: attrs.start_date ?? null,
                  duration: durationText,
                  estimate,
                  conditions: (['ground', 'access', 'shift', 'permits'] as DetailKey[])
                    .map((k) => {
                      const v = detailLabel(k)
                      return v ? `${rd.fields[k].q}: ${v}` : null
                    })
                    .filter((x): x is string => Boolean(x)),
                }}
              />
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  )
}

'use client'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { cutout, formatSar, rateFor, type Basis, type Equipment } from '@/lib/catalog'
import { durationPhrase, type Dict, type Locale } from '@/lib/i18n'
import { DETAIL_ENUMS, type Attrs } from '@/lib/attrs'
import { SampleContract } from './SampleContract'
import type { Pin } from './SiteMap'

const SiteMap = dynamic(() => import('./SiteMap').then((m) => m.SiteMap), { ssr: false })

type Suggestion = { slug: string; qty: number; why?: string }
type Result = { items: Suggestion[]; basis: Basis; duration_value: number | null; note?: string | null; clean_text?: string | null; attrs?: Partial<Attrs> }
type DetailKey = keyof typeof DETAIL_ENUMS
/** What the customer sees and can edit after the assistant answers. */
type Edit = {
  qty: Record<string, number>
  summary: string
  site: string
  pin: Pin | null
  start: string
  basis: Basis
  dur: number | null
  details: Partial<Record<DetailKey, string>>
  assumed: DetailKey[]
}
const DETAIL_KEYS = Object.keys(DETAIL_ENUMS) as DetailKey[]
const todayIso = () => new Date(Date.now() + 3 * 3600_000).toISOString().slice(0, 10)

function toEdit(r: Result): Edit {
  const a = r.attrs ?? {}
  const details: Partial<Record<DetailKey, string>> = {}
  const assumed: DetailKey[] = []
  for (const k of DETAIL_KEYS) if (a[k]) details[k] = a[k] as string
  // safe assumption: one standard shift is a day shift
  if (!details.shift) {
    details.shift = 'day'
    assumed.push('shift')
  }
  return {
    qty: Object.fromEntries(r.items.map((i) => [i.slug, i.qty])),
    summary: a.summary ?? '',
    site: a.site ?? '',
    pin: null,
    start: a.start_date ?? '',
    basis: r.basis,
    dur: r.duration_value,
    details,
    assumed,
  }
}

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
  const [edit, setEdit] = useState<Edit | null>(null)
  const [mapOpen, setMapOpen] = useState(false)
  const areaRef = useRef<HTMLTextAreaElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const recRef = useRef<SpeechRec | null>(null)
  const textRef = useRef('')
  const askOnEnd = useRef(true)
  const endTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  textRef.current = text

  useEffect(() => {
    if (!result && !error) return
    cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [result, error])
  useEffect(() => () => recRef.current?.stop(), [])

  const bySlug = new Map(equipment.map((e) => [e.slug, e]))
  const num = (n: number) => new Intl.NumberFormat(locale === 'ar' ? 'ar-SA' : 'en-US').format(n)

  /** Suggest button / Enter: if a voice note is running, stop it and suggest from what was said. */
  function submit(override?: string) {
    if (recRef.current) {
      if (override) {
        textRef.current = override
        setText(override)
      }
      askOnEnd.current = true
      const rec = recRef.current
      rec.stop()
      // some phones are slow to report the end of recording: finish it ourselves
      endTimer.current = setTimeout(() => finishRecording(rec), 1500)
      return
    }
    void ask(override ?? textRef.current)
  }

  function finishRecording(rec: SpeechRec) {
    if (endTimer.current) clearTimeout(endTimer.current)
    endTimer.current = null
    if (recRef.current !== rec) return // already finished
    recRef.current = null
    setListening(false)
    if (askOnEnd.current && textRef.current.trim().length >= 3) void ask(textRef.current)
    askOnEnd.current = true
  }

  async function ask(q: string) {
    const value = q.trim().slice(0, MAX)
    if (value.length < 3 || busy) return
    setBusy(true)
    setError(null)
    setResult(null)
    setEdit(null)
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
      else {
        const r = json as Result
        setResult(r)
        setEdit(toEdit(r))
        // show the tidied transcript so the customer reads what we understood
        if (r.clean_text && r.clean_text.trim() && r.clean_text.trim() !== value) {
          textRef.current = r.clean_text.trim()
          setText(r.clean_text.trim())
        }
      }
    } catch {
      setError(d.noMatch)
    } finally {
      setBusy(false)
    }
  }

  function toggleVoice() {
    if (listening) {
      askOnEnd.current = false
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
      const next = (base + said).slice(0, MAX)
      textRef.current = next
      setText(next)
    }
    rec.onerror = (e) => {
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') setVoiceMsg(d.voiceDenied)
    }
    rec.onend = () => finishRecording(rec)
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
  const ed = edit
  const patch = (p: Partial<Edit>) => setEdit((x) => (x ? { ...x, ...p } : x))
  const setDetail = (k: DetailKey, v: string) =>
    setEdit((x) => (x ? { ...x, details: { ...x.details, [k]: v || undefined }, assumed: x.assumed.filter((a) => a !== k) } : x))
  const optLabel = (k: DetailKey, v?: string) => {
    if (!v) return null
    const i = (DETAIL_ENUMS[k] as readonly string[]).indexOf(v)
    return i >= 0 ? rd.fields[k].o[i] : null
  }
  const basis: Basis = ed?.basis ?? 'weekly'
  const dur = ed?.dur ?? null
  const durationText = ed ? (basis === 'lump_sum' ? rd.basisOpts.lump_sum : dur ? durationPhrase(locale, basis, dur) : null) : null
  const items = result ? result.items.map((s) => ({ ...s, qty: ed?.qty[s.slug] ?? s.qty })).filter((s) => s.qty > 0) : []

  // indicative cost: rate x quantity x duration for every machine
  const lines = items.flatMap((s) => {
    const e = bySlug.get(s.slug)
    if (!e) return []
    const rate = basis === 'lump_sum' ? null : rateFor(e, basis)
    return [{ e, qty: s.qty, rate, line: rate && dur ? rate * s.qty * dur : null }]
  })
  const priced = basis !== 'lump_sum' && dur && lines.length > 0 && lines.every((l) => l.line)
  const sub = priced ? lines.reduce((a, l) => a + (l.line ?? 0), 0) : 0
  const estimate = priced ? { sub, total: sub * 1.15 } : null

  const detParam = DETAIL_KEYS.map((k) => {
    const v = ed?.details[k]
    const i = v ? (DETAIL_ENUMS[k] as readonly string[]).indexOf(v) : -1
    return i >= 0 ? `${k}:${i}` : null
  })
    .filter(Boolean)
    .join(',')

  const continueHref =
    result && ed
      ? `/${locale}/request?` +
        new URLSearchParams({
          items: items.map((i) => `${i.slug}:${i.qty}`).join(','),
          basis,
          ...(dur ? { dur: String(dur) } : {}),
          ...(ed.site ? { site: ed.site } : {}),
          ...(ed.pin ? { lat: String(ed.pin.lat), lng: String(ed.pin.lng) } : {}),
          ...(ed.start ? { start: ed.start } : {}),
          ...(detParam ? { det: detParam } : {}),
          notes: (ed.summary && ed.summary !== text.trim() ? ed.summary + '\n' : '') + text.trim().slice(0, MAX),
          src: 'assistant',
        }).toString()
      : '#'
  const sar = (n: number) => `${formatSar(n, locale)} ${eqd.sar}`
  const unitWord = (b: Basis) => (b === 'weekly' ? eqd.perWeek : b === 'monthly' ? eqd.perMonth : eqd.perDay)

  return (
    <div className="job">
      <form
        className="prompt"
        onSubmit={(e) => {
          e.preventDefault()
          submit()
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
              submit()
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
          <button className="btn btn-primary" type="submit" disabled={busy || (!listening && text.trim().length < 3)}>
            {busy ? <><span className="spinner" aria-hidden="true" />{d.thinking}</> : listening ? d.stopAndSuggest : d.suggest}
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
              submit(j.q)
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
              {lines.map(({ e, qty, rate }) => {
                const img = cutout(e)
                const shown = rate ?? rateFor(e, 'daily')
                return (
                  <div className="ritem" key={e.slug}>
                    <img src={img.src} alt="" className={img.cut ? 'is-cut' : ''} />
                    <div>
                      <b>{name(e)}</b>
                      {result.items.find((x) => x.slug === e.slug)?.why ? <span className="why">{result.items.find((x) => x.slug === e.slug)?.why}</span> : null}
                      <div className="qty qty-sm" role="group" aria-label={d.qty}>
                        <button type="button" aria-label="−" onClick={() => patch({ qty: { ...ed!.qty, [e.slug]: Math.max(1, qty - 1) } })}>−</button>
                        <span>{num(qty)}</span>
                        <button type="button" aria-label="+" onClick={() => patch({ qty: { ...ed!.qty, [e.slug]: Math.min(10, qty + 1) } })}>+</button>
                      </div>
                    </div>
                    <div className="price">
                      {shown ? (
                        <>
                          <strong>{formatSar(shown, locale)}</strong> <span className="small muted">{eqd.sar}</span>
                          <div className="small muted">{unitWord(rate ? basis : 'daily')}</div>
                        </>
                      ) : (
                        <span className="small muted">{eqd.onRequest}</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {result.note ? <p className="plan-note">{result.note}</p> : null}

            <div className="cost">
              <b className="sub-h">{d.costTitle}</b>
              {estimate ? (
                <table className="cost-t">
                  <tbody>
                    {lines.map((l) => (
                      <tr key={l.e.slug}>
                        <th scope="row">
                          {name(l.e)}
                          <span className="cost-calc">
                            {formatSar(l.rate!, locale)} × {num(l.qty)} × {durationText}
                          </span>
                        </th>
                        <td>{sar(l.line!)}</td>
                      </tr>
                    ))}
                    <tr className="cost-sub"><th scope="row">{rd.subtotal}</th><td>{sar(estimate.sub)}</td></tr>
                    <tr><th scope="row">{rd.vat}</th><td>{sar(estimate.total - estimate.sub)}</td></tr>
                    <tr className="cost-total"><th scope="row">{rd.total}</th><td>{sar(estimate.total)}</td></tr>
                  </tbody>
                </table>
              ) : (
                <p className="cost-empty">{basis === 'lump_sum' ? d.lumpNote : d.needDuration}</p>
              )}
            </div>

            {ed ? (
              <div>
                <b className="sub-h">{d.attrsTitle}</b>
                <p className="small muted attrs-hint">{d.attrsHint}</p>
                <div className="attrs attrs-edit">
                  <div className="attrs-wide" data-empty={!ed.summary}>
                    <label htmlFor="a-work">{d.attrs.work}</label>
                    <input id="a-work" className="input" value={ed.summary} maxLength={200} onChange={(e) => patch({ summary: e.target.value })} placeholder={d.notStated} />
                  </div>
                  <div className="attrs-wide" data-empty={!ed.site}>
                    <label htmlFor="a-site">{d.attrs.site}</label>
                    <div className="site-row">
                      <input id="a-site" className="input" value={ed.site} maxLength={200} onChange={(e) => patch({ site: e.target.value, pin: null })} placeholder={rd.sitePlaceholder} />
                      <button type="button" className="btn btn-ghost btn-sm map-btn" onClick={() => setMapOpen(true)}>
                        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0C18.5 15.4 12 21 12 21z" /><circle cx="12" cy="10" r="2.4" /></svg>
                        {ed.pin ? d.mapPinned : d.mapOpen}
                      </button>
                    </div>
                  </div>
                  <div data-empty={!ed.start}>
                    <label htmlFor="a-start">{d.attrs.start}</label>
                    <input id="a-start" className="input" type="date" min={todayIso()} value={ed.start} onChange={(e) => patch({ start: e.target.value })} />
                  </div>
                  <div data-empty={basis !== 'lump_sum' && !dur}>
                    <label htmlFor="a-basis">{d.attrs.duration}</label>
                    <div className="dur-row">
                      {basis !== 'lump_sum' ? (
                        <input
                          id="a-dur"
                          className="input"
                          type="number"
                          inputMode="numeric"
                          min={1}
                          max={365}
                          value={dur ?? ''}
                          aria-label={d.attrs.duration}
                          onChange={(e) => {
                            const n = parseInt(e.target.value, 10)
                            patch({ dur: Number.isFinite(n) ? Math.min(365, Math.max(1, n)) : null })
                          }}
                        />
                      ) : null}
                      <select id="a-basis" className="input" value={basis} onChange={(e) => patch({ basis: e.target.value as Basis })}>
                        {(['daily', 'weekly', 'monthly', 'lump_sum'] as Basis[]).map((b) => (
                          <option key={b} value={b}>{rd.basisOpts[b]}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  {DETAIL_KEYS.map((k) => (
                    <div key={k} data-empty={!ed.details[k]}>
                      <label htmlFor={`a-${k}`}>
                        {d.attrs[k]}
                        {ed.assumed.includes(k) ? <span className="assumed">{d.assumed}</span> : null}
                      </label>
                      <select id={`a-${k}`} className="input" value={ed.details[k] ?? ''} onChange={(e) => setDetail(k, e.target.value)}>
                        <option value="">{d.choose}</option>
                        {(DETAIL_ENUMS[k] as readonly string[]).map((v) => (
                          <option key={v} value={v}>{optLabel(k, v)}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <p className="small muted">{d.resultNote}</p>
            <div className="answer-actions">
              <Link className="btn btn-primary" href={continueHref}>{d.continue}</Link>
              <button className="btn btn-ghost" type="button" aria-expanded={showContract} onClick={() => setShowContract((x) => !x)}>
                {showContract ? d.hideContract : d.showContract}
              </button>
            </div>
            {showContract ? (
              <SampleContract
                locale={locale}
                d={cd}
                input={{
                  items: lines.map((l) => ({ name: name(l.e), qty: l.qty })),
                  site: ed?.site || null,
                  start: ed?.start || null,
                  duration: durationText,
                  estimate,
                  conditions: DETAIL_KEYS
                    .map((k) => {
                      const v = optLabel(k, ed?.details[k])
                      return v ? `${rd.fields[k].q}: ${v}` : null
                    })
                    .filter((x): x is string => Boolean(x)),
                }}
              />
            ) : null}
          </div>
        ) : null}
      </div>
      {mapOpen && ed ? (
        <SiteMap
          query={ed.site}
          initial={ed.pin}
          locale={locale}
          labels={{ title: d.mapTitle, hint: d.mapHint, notFound: d.mapNotFound, use: d.mapUse, close: d.mapClose, searching: d.mapSearching }}
          onClose={() => setMapOpen(false)}
          onUse={(p) => {
            patch({ pin: p, site: ed.site || `${p.lat.toFixed(5)}, ${p.lng.toFixed(5)}` })
            setMapOpen(false)
          }}
        />
      ) : null}
    </div>
  )
}

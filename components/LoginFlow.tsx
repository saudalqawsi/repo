'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { fill, type Dict, type Locale } from '@/lib/i18n'

import { safeNext } from '@/lib/safe-next'

const toWestern = (s: string) => s.replace(/[٠-٩]/g, (c) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(c)))

export function LoginFlow({ locale, d, next }: { locale: Locale; d: Dict['auth']; next: string | null }) {
  const router = useRouter()
  const [step, setStep] = useState<'phone' | 'code'>('phone')
  const [local, setLocal] = useState('')
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [wait, setWait] = useState(0)
  const codeRef = useRef<HTMLInputElement>(null)

  const digits = toWestern(local).replace(/\D/g, '').replace(/^0/, '')
  const e164 = `+966${digits}`
  const valid = /^5\d{8}$/.test(digits)

  useEffect(() => {
    if (wait <= 0) return
    const id = setTimeout(() => setWait((w) => w - 1), 1000)
    return () => clearTimeout(id)
  }, [wait])

  useEffect(() => {
    if (step === 'code') codeRef.current?.focus()
  }, [step])

  async function send() {
    if (!valid) {
      setErr(d.errPhone)
      return
    }
    setBusy(true)
    setErr(null)
    const { error } = await createClient().auth.signInWithOtp({ phone: e164, options: { channel: 'sms' } })
    setBusy(false)
    if (error) {
      setErr(d.errSend)
      return
    }
    setStep('code')
    setWait(60)
  }

  async function verify(token: string) {
    if (!/^\d{6}$/.test(token)) return
    setBusy(true)
    setErr(null)
    const { error } = await createClient().auth.verifyOtp({ phone: e164, token, type: 'sms' })
    if (error) {
      setBusy(false)
      setErr(d.errCode)
      setCode('')
      return
    }
    router.replace(safeNext(next, locale))
    router.refresh()
  }

  const pretty = `+966 ${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5)}`

  return (
    <div className="panel">
      <div className="progress" aria-hidden="true">
        <span data-on="true" />
        <span data-on={step === 'code'} />
      </div>

      {step === 'phone' ? (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            send()
          }}
          style={{ display: 'flex', flexDirection: 'column', gap: 18 }}
        >
          <div>
            <h1>{d.title}</h1>
            <p className="muted">{d.phoneLead}</p>
          </div>
          <label className="field">
            <span>{d.phone}</span>
            <div className="tel-wrap">
              <span className="cc">+966</span>
              <input
                className="input"
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                placeholder="5X XXX XXXX"
                value={local}
                onChange={(e) => setLocal(e.target.value)}
                aria-invalid={Boolean(err)}
                aria-describedby={err ? 'perr' : undefined}
                autoFocus
              />
            </div>
          </label>
          {err ? <p id="perr" className="alert alert-err" role="alert">{err}</p> : null}
          <button className="btn btn-primary btn-block" type="submit" disabled={busy}>
            {busy ? d.sending : d.send}
          </button>
          <p className="small muted">{d.terms}</p>
        </form>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            verify(code)
          }}
          style={{ display: 'flex', flexDirection: 'column', gap: 18 }}
        >
          <div>
            <h1>{d.codeTitle}</h1>
            <p className="muted">{fill(d.codeLead, { phone: pretty })}</p>
          </div>
          <label className="field">
            <span>{d.code}</span>
            <input
              ref={codeRef}
              className="input otp"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(e) => {
                const v = toWestern(e.target.value).replace(/\D/g, '').slice(0, 6)
                setCode(v)
                if (v.length === 6) verify(v)
              }}
              aria-invalid={Boolean(err)}
            />
          </label>
          {err ? <p className="alert alert-err" role="alert">{err}</p> : null}
          <button className="btn btn-primary btn-block" type="submit" disabled={busy || code.length !== 6}>
            {busy ? d.verifying : d.verify}
          </button>
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <button type="button" className="btn-link" onClick={() => { setStep('phone'); setCode(''); setErr(null) }}>{d.change}</button>
            <button type="button" className="btn-link" disabled={wait > 0 || busy} onClick={send} style={wait > 0 ? { color: 'var(--steel)', textDecoration: 'none' } : undefined}>
              {wait > 0 ? fill(d.resendIn, { s: wait }) : d.resend}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

'use client'
import Link from 'next/link'
import { useState } from 'react'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import type { Dict, Locale } from '@/lib/i18n'

const Schema = z.object({
  company_name: z.string().trim().min(2).max(160),
  cr_number: z.string().regex(/^\d{10}$/),
  city: z.string().trim().min(2).max(60),
  fleet_size: z.enum(['1-5', '6-20', '21+']),
  coverage: z.string().trim().max(200).optional(),
})

export function ProviderForm({ locale, d, signedIn }: { locale: Locale; d: Dict['prov']; signedIn: boolean }) {
  const [state, setState] = useState<'idle' | 'busy' | 'done'>('idle')
  const [err, setErr] = useState<string | null>(null)

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

  return (
    <form
      className="panel"
      id="apply"
      style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
      onSubmit={async (e) => {
        e.preventDefault()
        setErr(null)
        const f = new FormData(e.currentTarget)
        const raw = Object.fromEntries(f.entries())
        const toWestern = (s: string) => s.replace(/[٠-٩]/g, (c) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(c)))
        const parsed = Schema.safeParse({ ...raw, cr_number: toWestern(String(raw.cr_number ?? '')) })
        if (!parsed.success) {
          setErr(parsed.error.issues.some((i) => i.path[0] === 'cr_number') ? d.errCr : d.errGeneric)
          return
        }
        setState('busy')
        const { error } = await createClient().from('provider_applications').insert(parsed.data)
        if (error) {
          setErr(d.errGeneric)
          setState('idle')
        } else setState('done')
      }}
    >
      <h2 style={{ fontSize: 20 }}>{d.formTitle}</h2>
      <label className="field"><span>{d.company}</span><input className="input" name="company_name" required maxLength={160} autoComplete="organization" /></label>
      <label className="field"><span>{d.cr}</span><input className="input" name="cr_number" required inputMode="numeric" maxLength={10} dir="ltr" /></label>
      <label className="field"><span>{d.city}</span>
        <select className="input" name="city" defaultValue={d.riyadh}><option>{d.riyadh}</option></select>
      </label>
      <label className="field"><span>{d.fleet}</span>
        <select className="input" name="fleet_size" defaultValue="1-5"><option>1-5</option><option>6-20</option><option>21+</option></select>
      </label>
      <label className="field"><span>{d.coverage}</span><input className="input" name="coverage" maxLength={200} placeholder={d.coveragePh} /></label>
      {err ? <p className="alert alert-err" role="alert">{err}</p> : null}
      <button className="btn btn-primary" type="submit" disabled={state === 'busy'}>{d.submit}</button>
    </form>
  )
}

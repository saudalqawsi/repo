'use client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

function useRpc(failed: string) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const run = async (fn: string, args: Record<string, unknown>) => {
    setBusy(true)
    setErr('')
    const { error } = await createClient().rpc(fn, args)
    setBusy(false)
    if (error) setErr(failed)
    else router.refresh()
  }
  return { busy, err, run }
}

export function ProviderRespond({ id, accept, decline, failed }: { id: string; accept: string; decline: string; failed: string }) {
  const { busy, err, run } = useRpc(failed)
  return (
    <div className="dash-act">
      <button type="button" className="btn btn-primary btn-sm" disabled={busy} onClick={() => run('provider_respond', { p_id: id, p_accept: true })}>
        {accept}
      </button>
      <button type="button" className="btn-link" disabled={busy} onClick={() => run('provider_respond', { p_id: id, p_accept: false })}>
        {decline}
      </button>
      {err ? <p className="dash-err" role="alert">{err}</p> : null}
    </div>
  )
}

export function AdminRequestControls({
  id,
  status,
  providerId,
  providers,
  statuses,
  labels,
}: {
  id: string
  status: string
  providerId: string | null
  providers: { id: string; name: string }[]
  statuses: { value: string; label: string }[]
  labels: { offerTo: string; notOffered: string; noProviders: string; setStatus: string; failed: string }
}) {
  const { busy, err, run } = useRpc(labels.failed)
  const canOffer = status === 'submitted' || status === 'reviewing'
  return (
    <div className="dash-act dash-act-col">
      <label className="dash-field">
        <span>{labels.offerTo}</span>
        <select
          id={`offer-${id}`}
          value={providerId ?? ''}
          disabled={busy || !canOffer || providers.length === 0}
          onChange={(e) => run('admin_offer_request', { p_id: id, p_provider: e.target.value || null })}
        >
          <option value="">{providers.length ? labels.notOffered : labels.noProviders}</option>
          {providers.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </label>
      <label className="dash-field">
        <span>{labels.setStatus}</span>
        <select id={`status-${id}`} value={status} disabled={busy} onChange={(e) => run('admin_set_request_status', { p_id: id, p_status: e.target.value })}>
          {statuses.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </label>
      {err ? <p className="dash-err" role="alert">{err}</p> : null}
    </div>
  )
}

export function AdminReviewApp({ id, approve, reject, failed }: { id: string; approve: string; reject: string; failed: string }) {
  const { busy, err, run } = useRpc(failed)
  return (
    <div className="dash-act">
      <button type="button" className="btn btn-dark btn-sm" disabled={busy} onClick={() => run('admin_review_application', { p_id: id, p_approve: true })}>
        {approve}
      </button>
      <button type="button" className="btn-link" disabled={busy} onClick={() => run('admin_review_application', { p_id: id, p_approve: false })}>
        {reject}
      </button>
      {err ? <p className="dash-err" role="alert">{err}</p> : null}
    </div>
  )
}

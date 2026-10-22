'use client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function CancelButton({ id, label, confirm, keep }: { id: string; label: string; confirm: string; keep: string }) {
  const router = useRouter()
  const [asking, setAsking] = useState(false)
  const [busy, setBusy] = useState(false)
  if (!asking)
    return (
      <button type="button" className="btn-link" onClick={() => setAsking(true)}>
        {label}
      </button>
    )
  return (
    <span className="cancel-ask" role="group">
      <button
        type="button"
        className="btn-link"
        disabled={busy}
        autoFocus
        onClick={async () => {
          setBusy(true)
          await createClient().rpc('cancel_my_request', { p_id: id })
          setBusy(false)
          setAsking(false)
          router.refresh()
        }}
      >
        {confirm}
      </button>
      <button type="button" className="btn-link" disabled={busy} onClick={() => setAsking(false)}>
        {keep}
      </button>
    </span>
  )
}

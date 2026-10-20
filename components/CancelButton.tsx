'use client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function CancelButton({ id, label }: { id: string; label: string }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  return (
    <button
      type="button"
      className="btn-link"
      disabled={busy}
      onClick={async () => {
        setBusy(true)
        await createClient().rpc('cancel_my_request', { p_id: id })
        setBusy(false)
        router.refresh()
      }}
    >
      {label}
    </button>
  )
}

'use client'
import { usePathname } from 'next/navigation'
import { PHONE } from '@/lib/contact'
import { IconWhatsApp } from './Contact'

/** Floating WhatsApp button; hidden on the request and sign-in forms, where a sticky bar sits at the bottom. */
export function WhatsAppFab({ label, text }: { label: string; text: string }) {
  const path = usePathname() ?? ''
  if (/\/(request|login)(\/|$)/.test(path)) return null
  return (
    <a className="wa-fab" href={PHONE.wa(text)} target="_blank" rel="noopener noreferrer" aria-label={label} title={label}>
      <IconWhatsApp size={28} />
    </a>
  )
}

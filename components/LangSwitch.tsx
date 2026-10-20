'use client'
import { usePathname, useSearchParams } from 'next/navigation'
import type { Locale } from '@/lib/i18n'

// Same bilingual speech-bubble icon as tnasuq.com
export function LangSwitch({ locale, label }: { locale: Locale; label: string }) {
  const pathname = usePathname() ?? `/${locale}`
  const search = useSearchParams()
  const other: Locale = locale === 'ar' ? 'en' : 'ar'
  const rest = pathname.replace(/^\/(ar|en)(?=\/|$)/, '')
  const qs = search?.toString()
  const href = `/${other}${rest}${qs ? `?${qs}` : ''}`
  return (
    <a className="lang" href={href} hrefLang={other} lang={other}>
      <span>{label}</span>
      <svg viewBox="0 0 26 24" aria-hidden="true" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3.5 1.5h8a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H7l-3 2.6v-2.6h-.5a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2z" stroke="currentColor" strokeWidth="1.3" />
        <path d="M5 9.3 7.5 3.8 10 9.3M5.9 7.4h3.2" stroke="currentColor" strokeWidth="1.3" />
        <path className="lang-b" d="M13 8h9a2 2 0 0 1 2 2v7.2a2 2 0 0 1-2 2h-.6v3l-3.4-3h-5a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2z" stroke="#fff" strokeWidth="1.6" paintOrder="stroke" />
        <path d="M19.6 10.9c-.9-.5-2.3-.2-2.3.9 0 1 1.2 1.3 2.3 1.1-1.8.3-3 1.1-3 2.4 0 1.2 1.2 1.8 2.9 1.8" stroke="#fff" strokeWidth="1.3" />
      </svg>
    </a>
  )
}

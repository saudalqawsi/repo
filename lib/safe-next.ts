import type { Locale } from './i18n'

/** Only allow same-site paths under a locale: never absolute or protocol-relative URLs. */
export function safeNext(next: string | null | undefined, locale: Locale) {
  if (next && /^\/(ar|en)(\/[A-Za-z0-9\-_/?=&%#.:,]*)?$/.test(next) && !next.startsWith('//') && !next.includes('\\')) {
    return next
  }
  return `/${locale}/account`
}

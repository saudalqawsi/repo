import { normalize } from './matcher'

/** Job attributes the assistant pulls out of a description or voice note. */
export const GROUND = ['sand', 'rock', 'paved', 'clay'] as const
export const ACCESS = ['wide', 'medium', 'narrow'] as const
export const SHIFT = ['day', 'extended', 'night'] as const
export const PERMITS = ['ready', 'pending', 'not_required'] as const

export type Attrs = {
  summary: string | null
  site: string | null
  start_date: string | null
  ground: (typeof GROUND)[number] | null
  access: (typeof ACCESS)[number] | null
  shift: (typeof SHIFT)[number] | null
  permits: (typeof PERMITS)[number] | null
}

/** Order matches the option lists in the request form (req.fields.*.o). */
export const DETAIL_ENUMS = { ground: GROUND, access: ACCESS, shift: SHIFT, permits: PERMITS } as const

export function riyadhToday() {
  return new Date(Date.now() + 3 * 3600_000).toISOString().slice(0, 10)
}
const addDays = (iso: string, n: number) => new Date(Date.parse(iso) + n * 86400_000).toISOString().slice(0, 10)

/** Keyword fallback for when no AI key is configured. */
export function extractAttrs(text: string): Attrs {
  const n = normalize(text)
  const site =
    text.match(/(حي\s+[^\s،,.؛]+)/)?.[1] ??
    text.match(/\b(?:in|at)\s+((?:Al[\s-])?[A-Z][\w-]+(?:\s[A-Z][\w-]+)?)/)?.[1] ??
    null
  const today = riyadhToday()
  let start: string | null = null
  if (/(بكره|بكرا|غدا|tomorrow)/.test(n)) start = addDays(today, 1)
  else if (/(الاسبوع القادم|الاسبوع الجاي|next week)/.test(n)) start = addDays(today, 7)
  else if (/(اليوم|today)/.test(n)) start = today
  const ground = /(صخر|rock)/.test(n) ? 'rock' : /(رمل|sand)/.test(n) ? 'sand' : /(طين|clay|mud)/.test(n) ? 'clay' : /(اسفلت|معبد|paved|asphalt)/.test(n) ? 'paved' : null
  const shift = /(ليل|night)/.test(n) ? 'night' : null
  return { summary: text.trim().slice(0, 200), site, start_date: start, ground, access: null, shift, permits: null }
}

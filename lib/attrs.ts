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

const DAYS: [RegExp, number][] = [
  [/(الاحد|sunday)/, 0],
  [/(الاثنين|الاتنين|monday)/, 1],
  [/(الثلاثاء|الثلاثا|tuesday)/, 2],
  [/(الاربعاء|الاربعا|wednesday)/, 3],
  [/(الخميس|thursday)/, 4],
  [/(الجمعه|friday)/, 5],
  [/(السبت|saturday)/, 6],
]
export const weekdayOf = (iso: string) => new Date(iso + 'T12:00:00Z').getUTCDay()

/**
 * Reads a start date from everyday phrasing, in Riyadh time:
 * today, tomorrow, the day after tomorrow, in N days, (next) Sunday…, next week, next month, or a date like 3/11.
 */
export function parseStart(n: string, today: string): string | null {
  if (/(بعد بكره|بعد بكرا|بعد غد|day after tomorrow)/.test(n)) return addDays(today, 2)
  if (/(بكره|بكرا|غدا|tomorrow)/.test(n)) return addDays(today, 1)
  const inDays = n.match(/(?:بعد|in)\s*(\d+)\s*(?:يوم|ايام|days?)/)
  if (inDays) return addDays(today, Math.min(120, +inDays[1]))
  if (/(بعد يومين|in two days)/.test(n)) return addDays(today, 2)
  for (const [re, day] of DAYS) {
    if (!re.test(n)) continue
    let diff = (day - weekdayOf(today) + 7) % 7
    if (diff === 0) diff = 7 // "Sunday" said on a Sunday means the coming one
    // "الأحد بعد الجاي" / "Sunday after next": one more week
    if (/(بعد الجاي|بعد القادم|after next)/.test(n)) diff += 7
    return addDays(today, diff)
  }
  if (/(الاسبوع القادم|الاسبوع الجاي|next week)/.test(n)) {
    // the coming Sunday, when the Saudi working week starts
    const diff = (7 - weekdayOf(today)) % 7 || 7
    return addDays(today, diff)
  }
  if (/(الشهر القادم|الشهر الجاي|next month)/.test(n)) {
    const d = new Date(today + 'T12:00:00Z')
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1)).toISOString().slice(0, 10)
  }
  const dm = n.match(/(?<![\d/])(\d{1,2})\s*\/\s*(\d{1,2})(?![\d/])/)
  if (dm) {
    const d = new Date(today + 'T12:00:00Z')
    const day = +dm[1]
    const month = +dm[2] - 1
    if (day >= 1 && day <= 31 && month >= 0 && month <= 11) {
      let y = d.getUTCFullYear()
      let iso = new Date(Date.UTC(y, month, day)).toISOString().slice(0, 10)
      if (iso < today) iso = new Date(Date.UTC(++y, month, day)).toISOString().slice(0, 10)
      return iso
    }
  }
  if (/(اليوم|today)/.test(n)) return today
  return null
}

/** Keyword fallback for when no AI key is configured. */
export function extractAttrs(text: string): Attrs {
  const n = normalize(text)
  const site =
    text.match(/(حي\s+[^\s،,.؛]+)/)?.[1] ??
    text.match(/\b(?:in|at)\s+((?:Al[\s-])?[A-Z][\w-]+(?:\s[A-Z][\w-]+)?)/)?.[1] ??
    null
  const start = parseStart(n, riyadhToday())
  const ground = /(صخر|rock)/.test(n) ? 'rock' : /(رمل|sand)/.test(n) ? 'sand' : /(طين|clay|mud)/.test(n) ? 'clay' : /(اسفلت|معبد|paved|asphalt)/.test(n) ? 'paved' : null
  const shift = /(ليل|night)/.test(n) ? 'night' : null
  return { summary: text.trim().slice(0, 200), site, start_date: start, ground, access: null, shift, permits: null }
}

export type Equipment = {
  id: string
  slug: string
  category: string
  name_ar: string
  name_en: string
  spec_ar: string | null
  spec_en: string | null
  image: string
  daily_rate_indicative: number | null
  weekly_rate_indicative: number | null
  monthly_rate_indicative: number | null
  keywords: string[]
  sort: number
}
export type Category = { slug: string; name_ar: string; name_en: string; sort: number }

export const EQUIPMENT_COLUMNS =
  'id,slug,category,name_ar,name_en,spec_ar,spec_en,image,daily_rate_indicative,weekly_rate_indicative,monthly_rate_indicative,keywords,sort'

export function formatSar(n: number, locale: 'ar' | 'en') {
  return new Intl.NumberFormat(locale === 'ar' ? 'ar-SA' : 'en-US', { maximumFractionDigits: 0 }).format(n)
}

export type Basis = 'daily' | 'weekly' | 'monthly' | 'lump_sum'

export function rateFor(e: Equipment, basis: Basis): number | null {
  if (basis === 'daily') return e.daily_rate_indicative
  if (basis === 'weekly') return e.weekly_rate_indicative ?? (e.daily_rate_indicative ? e.daily_rate_indicative * 6 : null)
  if (basis === 'monthly') return e.monthly_rate_indicative ?? null
  return null
}

// Studio cut-outs (transparent background) exist for most machines.
const CUTOUTS = new Set([
  'bobcat-cutter', 'bobcat-sweeper', 'bobcat-trencher', 'crusher-excavator', 'excavator', 'grader-g14',
  'jcb-backhoe', 'jcb-forklift', 'loader-36', 'loader-50', 'loader-66', 'loader-80', 'loader-920',
  'man-lift', 'scissor-lift', 'telehandler', 'vibratory-roller', 'walk-roller', 'dump-truck',
])
export function cutout(e: Pick<Equipment, 'slug' | 'image'>): { src: string; cut: boolean } {
  return CUTOUTS.has(e.slug) ? { src: `/img/cut/${e.slug}.webp`, cut: true } : { src: e.image, cut: false }
}

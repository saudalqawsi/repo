import type { Basis, Equipment } from './catalog'

export function normalize(s: string) {
  return s
    .toLowerCase()
    .replace(/[ً-ْـ]/g, '') // tashkeel, tatweel
    .replace(/[إأآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[٠-٩]/g, (c) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(c)))
}

export function guessBasis(text: string): { basis: Basis; duration_value: number | null } {
  const n = normalize(text)
  const num = (re: RegExp) => {
    const m = n.match(re)
    return m ? Math.min(365, Math.max(1, parseInt(m[1], 10))) : null
  }
  if (/(مقطوع|lump|fixed price)/.test(n)) return { basis: 'lump_sum', duration_value: null }
  if (/(شهر|month)/.test(n)) return { basis: 'monthly', duration_value: num(/(\d+)\s*(شهر|اشهر|month)/) ?? (/شهرين/.test(n) ? 2 : 1) }
  if (/(اسبوع|week)/.test(n)) return { basis: 'weekly', duration_value: num(/(\d+)\s*(اسبوع|اسابيع|week)/) ?? (/اسبوعين/.test(n) ? 2 : 1) }
  if (/(يوم|ايام|day)/.test(n)) return { basis: 'daily', duration_value: num(/(\d+)\s*(يوم|ايام|day)/) ?? (/يومين/.test(n) ? 2 : 1) }
  return { basis: 'weekly', duration_value: 1 }
}

/** Keyword fallback used when no AI key is configured or the AI call fails. */
export function matchEquipment(text: string, equipment: Equipment[]) {
  const n = normalize(text)
  const scored = equipment
    .map((e) => {
      let score = 0
      for (const k of e.keywords) if (k && n.includes(normalize(k))) score += k.length > 3 ? 2 : 1
      if (n.includes(normalize(e.name_ar)) || n.includes(normalize(e.name_en))) score += 4
      return { e, score }
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || a.e.sort - b.e.sort)

  // one machine per category, top two categories
  const seen = new Set<string>()
  const picks: Equipment[] = []
  for (const { e } of scored) {
    if (seen.has(e.category)) continue
    seen.add(e.category)
    picks.push(e)
    if (picks.length === 2) break
  }
  return picks.map((e) => ({ slug: e.slug, qty: 1 }))
}

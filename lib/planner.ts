import type { Basis, Equipment } from './catalog'
import { guessBasis, normalize } from './matcher'

/**
 * Rule-based job planner: reads what the job is, how big it is, and where,
 * then picks machines and estimates how long the work takes.
 * Used when the AI is unavailable, and its rules are given to the AI as guidance.
 */

type Lang = 'ar' | 'en'
type Pick = { slug: string; qty: number; why: string }
export type Plan = { items: Pick[]; basis: Basis; duration_value: number | null; note: string | null; jobs: Job[] }
export type Job = 'excavate' | 'trench' | 'level' | 'load' | 'break' | 'lift' | 'height' | 'compact' | 'sweep' | 'mill' | 'clear'

const JOB_RX: Record<Job, RegExp> = {
  excavate: /(حفر|يحفر|احفر|حفريات|قبو|بدروم|سرداب|اساسات|قواعد|خزان|بياره|بيارات|مسبح|excavat|\bdig|digging|basement|foundation|footing|pool|\btank|septic)/,
  trench: /(خندق|خنادق|تمديد|مواسير|انابيب|كيابل|كابل|صرف صحي|trench|pipe|cable|conduit)/,
  level: /(تسويه|تمهيد|منسوب|ردم|دفان|سويه|level|grading|\bgrade|backfill|flatten)/,
  load: /(تحميل|مخلفات|ركام|نقل تراب|نقل الرمل|ازاله التراب|load|debris|rubble|haul|spoil)/,
  break: /(تكسير|كسر|صخر|صخور|خرسانه|هدم|break|rock|concrete|demoli)/,
  lift: /(رفع مواد|رفع البلك|رفع الحديد|رفع الطوب|طبليات|الدور الثاني|الدور الثالث|السطح|lift material|pallet|upper floor|second floor|roof)/,
  height: /(واجهه|واجهات|سقف|اسقف|ارتفاع|انار|لوحه|لوحات|دهان خارجي|facade|ceiling|height|signage|lighting)/,
  compact: /(دك|رص|ضغط التربه|طبقات|اسفلت|compact|roller|asphalt)/,
  sweep: /(كنس|تنظيف (ال)?موقع|تنظيف (ال)?ارض|تنظيف (ال)?شارع|تنظيف (ال)?ساحه|sweep|clean (the )?site)/,
  mill: /(قشط|كشط|milling|planing|plane)/,
  clear: /(ازاله جبل|جبل|تجريف|ازاله صخور كبيره|land clearing|clear(ing)? land|push)/,
}

const SMALL_SITE = /(فيلا|فيلتي|فله|منزل|بيت|بيتي|استراحه|حوش|ملحق|حديقه|villa|house|home|yard|garden)/
const LARGE_SITE = /(مخطط|مشروع|مصنع|طريق|شارع|مستودع|مجمع|plot of|subdivision|project|factory|road|street|warehouse|compound)/

function num(n: string, rx: RegExp) {
  const m = n.match(rx)
  return m ? parseFloat(m[1].replace(/,/g, '')) : null
}

function sizes(n: string) {
  const dims = n.match(/(\d+(?:\.\d+)?)\s*(?:x|×|\*|في)\s*(\d+(?:\.\d+)?)/)
  const area =
    num(n, /(\d[\d,]*(?:\.\d+)?)\s*(?:م2|م²|m2|m²|sqm|متر مربع|مترمربع|square met)/) ??
    (dims ? parseFloat(dims[1]) * parseFloat(dims[2]) : null)
  const volume = num(n, /(\d[\d,]*(?:\.\d+)?)\s*(?:م3|م³|m3|m³|متر مكعب|cubic)/)
  const depth = num(n, /(?:عمق|depth|deep)\s*(\d+(?:\.\d+)?)/) ?? num(n, /(\d+(?:\.\d+)?)\s*(?:م|m|متر)\s*(?:عمق|deep)/)
  const length = num(n, /(?:طول|بطول|length|long)\s*(\d[\d,]*)/) ?? num(n, /(\d[\d,]*)\s*(?:متر|م|m)(?![a-z0-9²³ء-ي])(?!\s*(?:مربع|مكعب))/)
  return { area, volume, depth, length }
}

const arDays = (d: number) =>
  d === 1 ? 'يوم عمل واحد' : d === 2 ? 'يومَي عمل' : d <= 10 ? `${d.toLocaleString('ar-SA')} أيام عمل` : `${d.toLocaleString('ar-SA')} يوم عمل`

const T = {
  ar: {
    excavator: 'للحفر وإخراج التربة',
    excavatorRock: 'لتكسير الصخر أثناء الحفر',
    loaderSpoil: 'لتحميل ناتج الحفر وترتيب الموقع',
    backhoe: 'لحفر الخنادق والتمديدات وردمها',
    trencher: 'لخنادق الكيابل الضيقة بسرعة',
    grader: 'لتسوية المساحات الكبيرة بدقة المنسوب',
    loaderLevel: 'لنقل التربة وتسويتها في المساحات الصغيرة',
    roller: 'لدك الطبقات بعد التسوية',
    walkRoller: 'للدك في المساحات الضيقة',
    loader: 'للتحميل ونقل التربة والمخلفات داخل الموقع',
    breaker: 'لتكسير الصخر والخرسانة',
    tele: 'لرفع المواد إلى الأدوار والأسطح',
    scissor: 'للعمل على ارتفاع داخل المباني',
    boom: 'للوصول إلى الواجهات والارتفاعات الخارجية',
    sweeper: 'لكنس الموقع وتنظيفه',
    planer: 'لقشط الأسفلت',
    dozer: 'لدفع وإزالة الكميات الكبيرة',
    est: (v: number, d: number) => `تقدير المدة: حوالي ${v.toLocaleString('ar-SA')} م³ من الحفر، أي نحو ${arDays(d)}.`,
    estArea: (a: number, d: number) => `تقدير المدة: مساحة ${a.toLocaleString('ar-SA')} م² تحتاج نحو ${arDays(d)}.`,
    estLen: (l: number, d: number) => `تقدير المدة: ${l.toLocaleString('ar-SA')} متر من الخنادق تحتاج نحو ${arDays(d)}.`,
    estDefault: (d: number) => `تقدير المدة: نحو ${arDays(d)} لعمل بهذا الحجم. أضف المساحة أو العمق لتقدير أدق.`,
  },
  en: {
    excavator: 'Digs and lifts out the soil',
    excavatorRock: 'Breaks rock met while digging',
    loaderSpoil: 'Loads the dug soil and keeps the site clear',
    backhoe: 'Digs trenches for services and backfills them',
    trencher: 'Cuts narrow cable trenches quickly',
    grader: 'Levels large areas to an exact grade',
    loaderLevel: 'Moves and spreads soil on smaller plots',
    roller: 'Compacts the layers after levelling',
    walkRoller: 'Compacts in tight areas',
    loader: 'Loads and moves soil and debris on site',
    breaker: 'Breaks rock and concrete',
    tele: 'Lifts materials to upper floors and roofs',
    scissor: 'Work at height inside buildings',
    boom: 'Reaches facades and outdoor heights',
    sweeper: 'Sweeps and cleans the site',
    planer: 'Planes asphalt',
    dozer: 'Pushes and clears large volumes',
    est: (v: number, d: number) => `Duration estimate: about ${v.toLocaleString('en-US')} m³ to dig, roughly ${d} working day${d === 1 ? '' : 's'}.`,
    estArea: (a: number, d: number) => `Duration estimate: ${a.toLocaleString('en-US')} m² takes roughly ${d} working day${d === 1 ? '' : 's'}.`,
    estLen: (l: number, d: number) => `Duration estimate: ${l.toLocaleString('en-US')} m of trench takes roughly ${d} working day${d === 1 ? '' : 's'}.`,
    estDefault: (d: number) => `Duration estimate: roughly ${d} working day${d === 1 ? '' : 's'} for a job of this size. Add the area or depth for a closer estimate.`,
  },
}

/** Productivity used for estimates (per machine, standard shift). */
export const RATES = {
  excavator_m3_day: 120,
  trench_m_day: 80,
  grader_m2_day: 5000,
  loader_level_m2_day: 800,
  loader_m3_day: 400,
  roller_m2_day: 3000,
}

function toBasis(days: number): { basis: Basis; duration_value: number } {
  if (days <= 10) return { basis: 'daily', duration_value: Math.max(1, days) }
  if (days <= 60) return { basis: 'weekly', duration_value: Math.ceil(days / 6) }
  return { basis: 'monthly', duration_value: Math.min(12, Math.ceil(days / 26)) }
}

export function detectJobs(text: string): Job[] {
  const n = normalize(text)
  const jobs = (Object.keys(JOB_RX) as Job[]).filter((j) => JOB_RX[j].test(n))
  // a trench is a dig, but a narrower one: do not double up
  if (jobs.includes('trench') && jobs.includes('excavate') && !/(قبو|بدروم|سرداب|اساسات|قواعد|خزان|مسبح|basement|foundation|footing|pool|tank)/.test(n)) {
    jobs.splice(jobs.indexOf('excavate'), 1)
  }
  // "rock" alone inside a dig means rocky ground, not a breaking job
  if (jobs.includes('break') && jobs.includes('excavate') && !/(تكسير|كسر|هدم|break|demoli)/.test(n)) jobs.splice(jobs.indexOf('break'), 1)
  // asphalt with planing words is milling, not compaction
  if (jobs.includes('mill') && jobs.includes('compact') && !/(دك|رص|compact|roller)/.test(n)) jobs.splice(jobs.indexOf('compact'), 1)
  return jobs
}

export function planJob(text: string, lang: Lang, equipment: Equipment[]): Plan {
  const n = normalize(text)
  const t = T[lang]
  const have = new Set(equipment.map((e) => e.slug))
  const items: Pick[] = []
  const add = (slug: string, qty: number, why: string) => {
    if (!have.has(slug)) return
    const ex = items.find((i) => i.slug === slug)
    if (ex) ex.qty = Math.max(ex.qty, qty)
    else items.push({ slug, qty, why })
  }
  const jobs = detectJobs(text)
  const small = SMALL_SITE.test(n)
  const large = LARGE_SITE.test(n)
  const rocky = /(صخر|صخري|صخريه|rock)/.test(n)
  const { area, volume, depth, length } = sizes(n)
  let days: number | null = null
  let note: string | null = null
  let noteDays = 0
  const setNote = (d: number, text: string) => {
    if (d >= noteDays) {
      noteDays = d
      note = text
    }
  }

  for (const job of jobs) {
    if (job === 'excavate') {
      const basement = /(قبو|بدروم|سرداب|basement)/.test(n)
      const pool = /(مسبح|pool)/.test(n)
      const d = depth ?? (basement ? 3.5 : pool ? 2 : 1.5)
      const footprint = area ?? (small ? (pool ? 50 : basement ? 300 : 400) : large ? 2000 : 300)
      const v = Math.round(volume ?? footprint * d * (basement || pool ? 1 : 0.35))
      const qty = v > 1000 ? 2 : 1
      add('excavator', qty, t.excavator)
      if (rocky) add('crusher-excavator', 1, t.excavatorRock)
      add(v > 1500 ? 'loader-50' : 'loader-36', 1, t.loaderSpoil)
      const dd = Math.max(2, Math.ceil(v / (RATES.excavator_m3_day * qty)) + (rocky ? 2 : 0))
      days = Math.max(days ?? 0, dd)
      setNote(dd, area || volume || depth ? t.est(v, dd) : t.estDefault(dd))
    }
    if (job === 'trench') {
      const narrow = /(كيابل|كابل|cable|conduit|ضيق|narrow)/.test(n)
      add(narrow ? 'bobcat-trencher' : 'jcb-backhoe', 1, narrow ? t.trencher : t.backhoe)
      const L = length ?? 60
      const dd = Math.max(1, Math.ceil(L / RATES.trench_m_day))
      days = Math.max(days ?? 0, dd)
      setNote(dd, length ? t.estLen(L, dd) : t.estDefault(dd))
    }
    if (job === 'level') {
      const A = area ?? (small ? 600 : large ? 5000 : 1000)
      if (A > 1500 || large) add('grader-g14', 1, t.grader)
      else add(small ? 'loader-920' : 'loader-36', 1, t.loaderLevel)
      const dd = Math.max(1, Math.ceil(A / (A > 1500 || large ? RATES.grader_m2_day : RATES.loader_level_m2_day)))
      days = Math.max(days ?? 0, dd)
      setNote(dd, area ? t.estArea(A, dd) : t.estDefault(dd))
    }
    if (job === 'compact') {
      const A = area ?? (small ? 300 : 1500)
      add(A < 400 || /(ضيق|tight|narrow)/.test(n) ? 'walk-roller' : 'vibratory-roller', 1, A < 400 ? t.walkRoller : t.roller)
      const dc = Math.max(1, Math.ceil(A / RATES.roller_m2_day))
      days = Math.max(days ?? 0, dc)
      setNote(dc, area ? t.estArea(A, dc) : t.estDefault(dc))
    }
    if (job === 'load') {
      const big = (volume ?? 0) > 1500 || large
      add(big ? 'loader-66' : small ? 'loader-36' : 'loader-50', 1, t.loader)
      if (volume) days = Math.max(days ?? 0, Math.max(1, Math.ceil(volume / RATES.loader_m3_day)))
    }
    if (job === 'break') {
      add('crusher-excavator', 1, t.breaker)
      add('loader-36', 1, t.loaderSpoil)
      days = Math.max(days ?? 0, 3)
    }
    if (job === 'lift') add('jcb-forklift', 1, t.tele)
    if (job === 'height') {
      const indoor = /(داخل|سقف|اسقف|indoor|inside|ceiling)/.test(n)
      add(indoor ? 'scissor-lift' : 'man-lift', 1, indoor ? t.scissor : t.boom)
    }
    if (job === 'sweep') add('bobcat-sweeper', 1, t.sweeper)
    if (job === 'mill') add('bobcat-cutter', 1, t.planer)
    if (job === 'clear') add('bulldozer-d9', 1, t.dozer)
  }
  // levelling a plot normally ends with compaction
  if (jobs.includes('level') && !jobs.includes('compact') && /(اسفلت|بلاط|انترلوك|asphalt|paving|interlock)/.test(n)) add('vibratory-roller', 1, t.roller)

  const stated = /(\d+\s*(يوم|ايام|اسبوع|اسابيع|شهر|اشهر|day|week|month))|يومين|اسبوعين|شهرين|مقطوع|lump|fixed price/.test(n)
  const timing = stated ? guessBasis(text) : days ? toBasis(days) : guessBasis(text)
  return { items: items.slice(0, 4), ...timing, note: stated ? null : note, jobs }
}

/** Plain-language rules handed to the AI so it plans the same way. */
export const PLANNING_RULES = `
Planning rules (Riyadh construction practice):
- Bulk digging (foundations, footings, basements, pools, tanks, septic pits): an excavator plus a wheel loader to load the spoil. For a villa use the 5 t excavator and a small loader (36). Add the breaker excavator only if the ground is rocky or there is concrete to break. Never suggest a grader or a bulldozer for digging at a villa.
- Trenches for pipes and services: a backhoe loader. Narrow cable trenches: the skid steer trencher.
- Levelling: up to about 1,500 m² use a wheel loader (920 or 36); larger plots, roads and subdivisions use the motor grader. Add the vibratory roller when compaction, asphalt or paving follows.
- Compaction: vibratory roller; walk-behind roller for tight spots under ~400 m².
- Loading and moving soil or debris on site: a wheel loader sized to the volume (36/50 small, 66/80 large).
- Breaking rock or concrete, demolition: breaker excavator plus a loader to clear.
- Lifting materials to upper floors or roofs: the JCB telehandler. Indoor work at height: scissor lift. Facades and outdoor height: boom lift.
- Sweeping: skid steer sweeper. Asphalt planing: skid steer planer. Large earth pushing or land clearing: bulldozer.
Duration, when the customer does not state it: estimate from the size of the work and the productivity of one machine on a standard shift:
excavator ~${RATES.excavator_m3_day} m³/day; trench ~${RATES.trench_m_day} m/day; grader ~${RATES.grader_m2_day} m²/day; loader levelling ~${RATES.loader_level_m2_day} m²/day; loader moving ~${RATES.loader_m3_day} m³/day; roller ~${RATES.roller_m2_day} m²/day.
Typical depths: foundations 1.5 m over ~35% of the footprint; basement 3.5 m; pool 2 m. Typical villa footprint 300–400 m².
Use daily basis up to 10 days, weekly up to about 8 weeks, monthly beyond. Explain the estimate in "note" in one sentence.
`.trim()

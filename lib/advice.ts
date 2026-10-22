import type { Basis } from './catalog'
import type { Scope } from './planner'

/**
 * Plain guidance shown under the request summary: the size of the work in terms a client can picture,
 * whether the chosen duration fits it, and what to arrange before the machines arrive.
 * Figures are planning rules of thumb, worded as such.
 */

type Lang = 'ar' | 'en'
const TRUCK_M3 = 16 // a typical tipper load
const BULKING = 1.25 // dug soil takes up about a quarter more space

export const workingDays = (basis: Basis, n: number | null) =>
  n == null || basis === 'lump_sum' ? null : basis === 'daily' ? n : basis === 'weekly' ? n * 6 : n * 26

export function neededDays(scope: Scope, qty: number) {
  return Math.max(1, Math.ceil(scope.amount / (scope.rate * Math.max(1, qty))) + scope.extraDays)
}

const fmt = (lang: Lang, n: number) => new Intl.NumberFormat(lang === 'ar' ? 'ar-SA' : 'en-US').format(n)
const daysAr = (lang: Lang, d: number) =>
  lang === 'ar'
    ? d === 1 ? 'يوم عمل واحد' : d === 2 ? 'يومي عمل' : d <= 10 ? `${fmt(lang, d)} أيام عمل` : `${fmt(lang, d)} يوم عمل`
    : `${d} working day${d === 1 ? '' : 's'}`

/** One sentence on how big the job is. */
export function scopeLine(lang: Lang, s: Scope, qty: number, machineName: string): string {
  const d = neededDays(s, qty)
  const n = (x: number) => fmt(lang, Math.round(x))
  const who = qty > 1 ? (lang === 'ar' ? `باستخدام ${n(qty)} من ${machineName}` : `with ${qty} × ${machineName}`) : lang === 'ar' ? `باستخدام ${machineName} واحد` : `with one ${machineName}`
  if (s.kind === 'excavate') {
    const loads = Math.ceil((s.amount * BULKING) / TRUCK_M3)
    const basis =
      s.typical && s.area && s.depth
        ? lang === 'ar'
          ? ` (على أساس مساحة نحو ${n(s.area)} م² وعمق ${fmt(lang, s.depth)} م، وهي قيم معتادة؛ عدّلها في الوصف إن اختلفت)`
          : ` (based on a typical ${n(s.area)} m² footprint, ${s.depth} m deep; describe yours if it differs)`
        : ''
    return lang === 'ar'
      ? `حجم العمل: نحو ${n(s.amount)} م³ حفر${basis}، أي قرابة ${n(loads)} نقلة قلاب لناتج الحفر. ${who} يحتاج العمل نحو ${daysAr(lang, d)}.`
      : `Size of the job: about ${n(s.amount)} m³ to dig${basis}, roughly ${loads} truckloads of soil. ${who[0].toUpperCase() + who.slice(1)} it takes about ${daysAr(lang, d)}.`
  }
  const what =
    s.kind === 'trench'
      ? lang === 'ar' ? `نحو ${n(s.amount)} متر خنادق` : `about ${n(s.amount)} m of trench`
      : s.kind === 'load'
        ? lang === 'ar' ? `نحو ${n(s.amount)} م³ للتحميل والنقل` : `about ${n(s.amount)} m³ to load and move`
        : lang === 'ar' ? `مساحة نحو ${n(s.amount)} م² ${s.kind === 'level' ? 'للتسوية' : 'للدك'}` : `about ${n(s.amount)} m² to ${s.kind === 'level' ? 'level' : 'compact'}`
  const typ = s.typical ? (lang === 'ar' ? ' (قيمة معتادة لهذا النوع من الأعمال)' : ' (a typical size for this kind of job)') : ''
  return lang === 'ar'
    ? `حجم العمل: ${what}${typ}. ${who} يحتاج العمل نحو ${daysAr(lang, d)}.`
    : `Size of the job: ${what}${typ}. ${who[0].toUpperCase() + who.slice(1)} it takes about ${daysAr(lang, d)}.`
}

export type AdviceInput = {
  lang: Lang
  scope: Scope | null
  qty: number
  machineName: string
  basis: Basis
  dur: number | null
  jobs: string[]
  text: string
  start: string
  today: string
  details: { ground?: string; access?: string; shift?: string; permits?: string }
  hasBreaker: boolean
}

/** Short pointers, most important first. */
export function advice(a: AdviceInput): string[] {
  const { lang } = a
  const ar = lang === 'ar'
  const out: string[] = []
  const chosen = workingDays(a.basis, a.dur)
  if (a.scope && chosen) {
    const need = neededDays(a.scope, a.qty)
    if (chosen < need) {
      const usable = Math.max(1, chosen - a.scope.extraDays)
      const more = Math.ceil(a.scope.amount / (a.scope.rate * usable))
      out.push(
        ar
          ? `المدة المختارة (${daysAr(lang, chosen)}) أقصر من المتوقع لهذا الحجم (${daysAr(lang, need)}). لإنجازه في المدة نفسها ارفع عدد ${a.machineName} إلى ${fmt(lang, more)}، أو مدّد المدة.`
          : `The chosen duration (${daysAr(lang, chosen)}) is shorter than this job usually needs (${daysAr(lang, need)}). To finish in time, raise the ${a.machineName} count to ${more}, or extend the duration.`,
      )
    } else if (chosen >= need * 2 && chosen - need >= 3) {
      out.push(
        ar
          ? `المدة المختارة أطول من حاجة العمل على الأرجح (نحو ${daysAr(lang, need)}). يمكنك تقليلها لخفض التكلفة، مع ترك يوم أو يومين احتياطًا.`
          : `The chosen duration is probably longer than the work needs (about ${daysAr(lang, need)}). You could shorten it to cut the cost, keeping a day or two in reserve.`,
      )
    }
  }
  const digs = a.jobs.some((j) => ['excavate', 'trench', 'clear', 'break', 'mill'].includes(j))
  if (digs && a.details.permits !== 'ready') {
    const soon = a.start && Date.parse(a.start) - Date.parse(a.today) < 7 * 86400_000
    out.push(
      ar
        ? `الحفر داخل الأرض يتم عادة ضمن رخصة البناء، أما الحفر في الشارع أو الرصيف فيحتاج تصريح حفرية من منصة بلدي. خصّص أسبوعًا على الأقل لتجهيز التصاريح${soon ? '، وموعد البدء المختار قريب' : ''}.`
        : `Digging inside the plot is usually covered by the building licence; digging in the street or pavement needs an excavation permit through Balady. Allow at least a week to get permits in place${soon ? ', and the chosen start is close' : ''}.`,
    )
  }
  if (/(قبو|بدروم|سرداب|basement)/i.test(a.text))
    out.push(
      ar
        ? 'حفر القبو بجوار مبانٍ قائمة قد يحتاج تدعيم جوانب الحفر وتقرير تربة قبل البدء؛ جهّزهما مع المهندس المشرف.'
        : 'A basement next to existing buildings may need shoring and a soil report before digging; arrange both with your site engineer.',
    )
  if (a.jobs.includes('excavate') || a.jobs.includes('trench'))
    out.push(
      ar
        ? 'نقل ناتج الحفر خارج الموقع يحتاج قلابات ومردمًا معتمدًا، وهو غير مشمول في هذا التقدير.'
        : 'Hauling the dug soil off site needs tipper trucks and an approved dump site, which this estimate does not include.',
    )
  if (a.details.ground === 'rock' && !a.hasBreaker && digs)
    out.push(
      ar
        ? 'الأرض الصخرية تحتاج غالبًا حفارًا بكسّارة، وقد تضيف يومين أو أكثر؛ أضفه من صفحة المعدات إن لزم.'
        : 'Rocky ground usually needs a breaker excavator and can add two days or more; add one from the equipment page if needed.',
    )
  if (a.details.access === 'narrow')
    out.push(
      ar
        ? 'مدخل أقل من 3 م لا يتسع لمعظم الشيولات والحفارات؛ المعدات المدمجة مثل البوبكات أنسب.'
        : 'An entrance under 3 m is too tight for most loaders and excavators; compact machines such as skid steers fit better.',
    )
  if (a.details.shift === 'night')
    out.push(
      ar
        ? 'العمل الليلي داخل الأحياء السكنية قد يحتاج موافقة البلدية بسبب الضوضاء.'
        : 'Night work inside residential districts may need municipal approval because of noise.',
    )
  if (a.start) {
    const d = new Date(a.start + 'T12:00:00Z')
    const md = (d.getUTCMonth() + 1) * 100 + d.getUTCDate()
    if (md >= 615 && md <= 915)
      out.push(
        ar
          ? 'من 15 يونيو إلى 15 سبتمبر يُمنع العمل تحت الشمس من 12 ظهرًا إلى 3 عصرًا، فاحسب ساعات العمل على هذا الأساس.'
          : 'From 15 June to 15 September, outdoor work in the sun is banned from 12 noon to 3 pm, so plan working hours around it.',
      )
  }
  return out
}

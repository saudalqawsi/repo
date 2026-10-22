/**
 * Tidies a voice-note transcript before we read it: drops hesitation sounds,
 * repeated words and stray punctuation, and turns spoken numbers into digits
 * ("اسبوعين" stays, "عشر ايام" becomes "10 ايام", "ten days" becomes "10 days").
 */

const AR_FILLERS = ['امم+', 'اه+', 'ااه+', 'آه+', 'مم+', 'ههه+', 'همم+', 'إمم+', 'يعني يعني', 'شلون اقول', 'وش اسمه', 'ايش اسمه']
const EN_FILLERS = ['u+m+', 'u+h+', 'e+r+m*', 'hmm+', 'you know', 'i mean', 'like,']

const AR_NUM: [string, number][] = [
  ['اثنين|اثنان|ثنين|اتنين', 2],
  ['ثلاث|ثلاثه|ثلاثة|ثلاثا', 3],
  ['اربع|أربع|اربعه|أربعة|اربعة', 4],
  ['خمس|خمسه|خمسة', 5],
  ['ست|سته|ستة', 6],
  ['سبع|سبعه|سبعة', 7],
  ['ثمان|ثماني|ثمانيه|ثمانية', 8],
  ['تسع|تسعه|تسعة', 9],
  ['عشر|عشره|عشرة', 10],
  ['احدعش|احد عشر|حدعش|إحدى عشر', 11],
  ['اثنعش|اطنعش|اثنا عشر|اثني عشر', 12],
  ['ربعطعش|اربعتعش|اربعة عشر|أربعة عشر', 14],
  ['خمستعش|خمسطعش|خمسة عشر', 15],
  ['عشرين', 20],
  ['ثلاثين', 30],
  ['اربعين|أربعين', 40],
  ['خمسين', 50],
  ['ستين', 60],
  ['مية|مئة|ميه|مائة', 100],
  ['ميتين|مئتين|مائتين', 200],
  ['ثلاثمية|ثلاثمئة|ثلاثمائة|ثلاث مية', 300],
  ['اربعمية|أربعمئة|اربعمائة|اربع مية', 400],
  ['خمسمية|خمسمئة|خمسمائة|خمس مية', 500],
  ['ستمية|ستمئة|ستمائة', 600],
  ['سبعمية|سبعمئة|سبعمائة', 700],
  ['ثمانمية|ثمانمئة|ثمانمائة', 800],
  ['تسعمية|تسعمئة|تسعمائة', 900],
  ['الف|ألف', 1000],
  ['الفين|ألفين', 2000],
]
const EN_NUM: [string, number][] = [
  ['two', 2], ['three', 3], ['four', 4], ['five', 5], ['six', 6], ['seven', 7], ['eight', 8], ['nine', 9],
  ['ten', 10], ['eleven', 11], ['twelve', 12], ['fifteen', 15], ['twenty', 20], ['thirty', 30],
  ['forty', 40], ['fifty', 50], ['hundred', 100], ['thousand', 1000],
]

// letters that count as part of an Arabic or Latin word
const W = 'A-Za-z\\u0621-\\u064A'
const word = (alts: string) => new RegExp(`(?<![${W}])(?:${alts})(?![${W}])`, 'gi')

export function cleanTranscript(input: string): string {
  let s = ` ${input} `
  for (const f of [...AR_FILLERS, ...EN_FILLERS]) s = s.replace(word(f), ' ')
  // "500 الف" or "خمس الاف"
  // multi-word numbers first, so "احد عشر" is not read as "احد 10"
  const arNums = [...AR_NUM].sort((a, b) => Number(b[0].includes(' ')) - Number(a[0].includes(' ')))
  for (const [alts, n] of arNums) s = s.replace(word(alts), String(n))
  for (const [alts, n] of EN_NUM) s = s.replace(word(alts), String(n))
  s = s
    .replace(/(\d+)\s*(?:الاف|آلاف|ألف|الف|thousand)/g, (_, a) => String(+a * 1000))
    .replace(/(\d+)\s*(?:hundred)/gi, (_, a) => String(+a * 100))
    .replace(/(\d+)\s+(?:و|and)\s*(\d+)/g, (m, a, b) => (+a >= 100 && +b < +a ? String(+a + +b) : m))
  // repeated words from stuttering: "في في الموقع"
  s = s.replace(new RegExp(`(?<![${W}])([${W}]+)(?:\\s+\\1)+(?![${W}])`, 'giu'), '$1')
  return s.replace(/\s+([،,.؟?!])/g, '$1').replace(/([،,])\1+/g, '$1').replace(/\s{2,}/g, ' ').trim()
}

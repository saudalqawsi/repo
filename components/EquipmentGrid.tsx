'use client'
import Link from 'next/link'
import { useState } from 'react'
import { cutout, formatSar, type Category, type Equipment } from '@/lib/catalog'
import type { Dict, Locale } from '@/lib/i18n'

export function EquipmentGrid({
  locale,
  d,
  equipment,
  categories,
  limit,
  initial = 'all',
}: {
  locale: Locale
  d: Dict['eq']
  equipment: Equipment[]
  categories: Category[]
  limit?: number
  initial?: string
}) {
  const used = categories.filter((c) => equipment.some((e) => e.category === c.slug))
  const [cat, setCat] = useState<string>(used.some((c) => c.slug === initial) ? initial : 'all')
  const catName = (slug: string) => {
    const c = categories.find((x) => x.slug === slug)
    return c ? (locale === 'ar' ? c.name_ar : c.name_en) : ''
  }
  let list = equipment.filter((e) => cat === 'all' || e.category === cat)
  if (limit && cat === 'all') {
    // a varied first view: one of each category before repeating
    const byCat = used.map((c) => list.filter((e) => e.category === c.slug))
    const mixed: Equipment[] = []
    for (let i = 0; mixed.length < list.length; i++) for (const g of byCat) if (g[i]) mixed.push(g[i])
    list = mixed
  }
  const shown = limit ? list.slice(0, limit) : list

  return (
    <>
      <div className="tabs" role="group" aria-label={d.title}>
        {[{ slug: 'all', name_ar: d.all, name_en: d.all, sort: 0 }, ...used].map((c) => (
          <button key={c.slug} type="button" className="tab" aria-pressed={cat === c.slug} onClick={() => setCat(c.slug)}>
            {locale === 'ar' ? c.name_ar : c.name_en}
          </button>
        ))}
      </div>
      <div className="eq-grid">
        {shown.map((e) => {
          const img = cutout(e)
          return (
            <Link key={e.slug} className="eq-card" href={`/${locale}/request?items=${e.slug}:1`}>
              <div className={`eq-img${img.cut ? ' is-cut' : ''}`}>
                <img src={img.src} alt="" loading="lazy" width={380} height={260} />
                <span className="eq-price">
                  {e.daily_rate_indicative ? (
                    <>
                      {d.from} <b>{formatSar(e.daily_rate_indicative, locale)}</b> {d.sar} {d.perDay}
                    </>
                  ) : (
                    d.onRequest
                  )}
                </span>
              </div>
              <div className="eq-body">
                <span className="eq-cat">{catName(e.category)}</span>
                <h3>{locale === 'ar' ? e.name_ar : e.name_en}</h3>
                <p className="eq-spec">{locale === 'ar' ? e.spec_ar : e.spec_en}</p>
                <span className="dots" aria-hidden="true"><i /><i /></span>
                <span className="eq-add">{d.request}</span>
              </div>
            </Link>
          )
        })}
      </div>
    </>
  )
}

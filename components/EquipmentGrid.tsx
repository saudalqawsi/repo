'use client'
import Link from 'next/link'
import { useState } from 'react'
import { formatSar, type Category, type Equipment } from '@/lib/catalog'
import type { Dict, Locale } from '@/lib/i18n'

export function EquipmentGrid({
  locale,
  d,
  equipment,
  categories,
  limit,
}: {
  locale: Locale
  d: Dict['eq']
  equipment: Equipment[]
  categories: Category[]
  limit?: number
}) {
  const [cat, setCat] = useState<string>('all')
  let list = equipment.filter((e) => cat === 'all' || e.category === cat)
  if (limit && cat === 'all') {
    // a varied first view: interleave categories instead of showing five loaders in a row
    const byCat = categories.map((c) => list.filter((e) => e.category === c.slug))
    const mixed: Equipment[] = []
    for (let i = 0; mixed.length < list.length; i++) for (const g of byCat) if (g[i]) mixed.push(g[i])
    list = mixed
  }
  const shown = limit ? list.slice(0, limit) : list

  return (
    <>
      <div className="chips" role="group" aria-label={d.title} style={{ marginTop: 0, marginBottom: 20 }}>
        {[{ slug: 'all', name_ar: d.all, name_en: d.all, sort: 0 }, ...categories].map((c) => (
          <button
            key={c.slug}
            type="button"
            className="chip"
            aria-pressed={cat === c.slug}
            onClick={() => setCat(c.slug)}
          >
            {locale === 'ar' ? c.name_ar : c.name_en}
          </button>
        ))}
      </div>
      <div className="eq-grid">
        {shown.map((e) => (
          <Link key={e.slug} className="eq-card" href={`/${locale}/request?items=${e.slug}:1`}>
            <div className="eq-img">
              <img src={e.image} alt="" loading="lazy" width={450} height={338} />
            </div>
            <div className="eq-body">
              <h3>{locale === 'ar' ? e.name_ar : e.name_en}</h3>
              <span className="eq-spec">{locale === 'ar' ? e.spec_ar : e.spec_en}</span>
              <div className="eq-foot">
                <span className="eq-rate">
                  {e.daily_rate_indicative ? (
                    <>
                      <small>{d.from} · {d.indicative}</small>
                      <b>{formatSar(e.daily_rate_indicative, locale)}</b> {d.sar} <span className="small muted">{d.perDay}</span>
                    </>
                  ) : (
                    <small style={{ fontSize: 14 }}>{d.onRequest}</small>
                  )}
                </span>
                <span className="eq-add">{d.request}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </>
  )
}

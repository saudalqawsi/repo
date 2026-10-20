import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { isLocale, t } from '@/lib/i18n'
import { getCatalog } from '@/lib/catalog.server'
import { EquipmentGrid } from '@/components/EquipmentGrid'

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params
  return isLocale(lang) ? { title: t(lang).eq.title } : {}
}

export default async function EquipmentPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  if (!isLocale(lang)) notFound()
  const d = t(lang)
  const { equipment, categories } = await getCatalog()
  return (
    <>
      <div className="wrap phead">
        <h1>{d.eq.title}</h1>
        <p>{d.eq.lead}</p>
      </div>
      <section className="wrap" style={{ padding: '28px var(--gutter) 40px' }}>
        <EquipmentGrid locale={lang} d={d.eq} equipment={equipment} categories={categories} />
        <p className="note">{d.eq.indicativeNote}</p>
      </section>
    </>
  )
}

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { isLocale, t } from '@/lib/i18n'
import { getCatalog } from '@/lib/catalog.server'
import { EquipmentGrid } from '@/components/EquipmentGrid'
import { PageBanner } from '@/components/PageBanner'

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params
  return isLocale(lang) ? { title: t(lang).eq.title } : {}
}

export default async function EquipmentPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>
  searchParams: Promise<{ cat?: string }>
}) {
  const { lang } = await params
  if (!isLocale(lang)) notFound()
  const { cat } = await searchParams
  const d = t(lang)
  const { equipment, categories } = await getCatalog()
  return (
    <>
      <PageBanner locale={lang} title={d.eq.title} lead={d.eq.lead} image="/img/eq/loader-66.jpg" />
      <section className="sec sec-grey">
        <div className="wrap">
          <EquipmentGrid
            key={cat ?? 'all'}
            locale={lang}
            d={d.eq}
            equipment={equipment}
            categories={categories}
            initial={typeof cat === 'string' ? cat : 'all'}
          />
          <p className="note">{d.eq.indicativeNote}</p>
        </div>
      </section>
    </>
  )
}

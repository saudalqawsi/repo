import 'server-only'
import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import { EQUIPMENT_COLUMNS, type Category, type Equipment } from '@/lib/catalog'

export const getCatalog = cache(async () => {
  const supabase = await createClient()
  const [{ data: equipment }, { data: categories }] = await Promise.all([
    supabase.from('equipment').select(EQUIPMENT_COLUMNS).eq('active', true).order('sort'),
    supabase.from('equipment_categories').select('slug,name_ar,name_en,sort').order('sort'),
  ])
  const cats = (categories ?? []) as Category[]
  const order = new Map(cats.map((c) => [c.slug, c.sort]))
  const list = ((equipment ?? []) as Equipment[]).sort(
    (a, b) => (order.get(a.category) ?? 99) - (order.get(b.category) ?? 99) || a.sort - b.sort,
  )
  return { equipment: list, categories: cats }
})

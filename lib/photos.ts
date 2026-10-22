/**
 * Banner photography (Unsplash licence: free to use, no attribution required).
 * Served from Unsplash's image CDN at the size each screen needs.
 * Chosen for having no visible brand logos: silhouettes and aerial views.
 */
export const PHOTOS = {
  hero: { id: 'photo-1545362154-4a7d3eba4b83', pos: 'center 72%', credit: 'https://unsplash.com/photos/three-excavators-during-day-YQiR4qsgiDI' },
  equipment: { id: 'photo-1517089596392-fb9a9033e05b', pos: 'center 55%', credit: 'https://unsplash.com/photos/top-view-photography-of-four-heavy-equipment-on-quarry-at-daytime-9jPJrfLTBi0' },
  how: { id: 'photo-1748848436533-f7583dce22b6', pos: 'center 45%', credit: 'https://unsplash.com/photos/an-excavator-works-in-a-sandy-terrain-FeO9AixmDt0' },
  owners: { id: 'photo-1517089152318-42ec560349c0', pos: 'center 40%', credit: 'https://unsplash.com/photos/aerial-photography-of-dump-trucks-EN1tF2EG-50' },
  flow: { id: 'photo-1623428454599-0b106ed85f67', pos: 'center 55%', credit: 'https://unsplash.com/photos/an-aerial-view-of-a-tractor-in-a-field-aZB25TEATEc' },
  about: { id: 'photo-1726087163038-2910e4de29e5', pos: 'center 50%', credit: 'https://unsplash.com/photos/an-aerial-view-of-a-construction-site-in-the-desert-mzF_aDw9l9Y' },
  riyadh: { id: 'photo-1506795213373-430e921fe2ed', pos: 'center 40%', credit: 'https://unsplash.com/photos/kingdom-centre-skyscraper-in-riyadh-f5ZB0LHwi0s' },
  ntp: { id: 'photo-1669101564304-1da32c23f8ec', pos: 'center 35%', credit: 'https://unsplash.com/photos/a-tall-building-with-a-pointy-top-YS23gFKcxRk' },
  economy: { id: 'photo-1674386491555-5b92161e4d04', pos: 'center 50%', credit: 'https://unsplash.com/photos/an-aerial-view-of-a-city-with-tall-buildings-MAPTe538-vA' },
  logistics: { id: 'photo-1758608307012-a43924fa0f90', pos: 'center 50%', credit: 'https://unsplash.com/photos/aerial-view-of-a-busy-highway-interchange-at-dusk-zzM7voOp6Tk' },
  housing: { id: 'photo-1726087162826-e6f42613a89e', pos: 'center 50%', credit: 'https://unsplash.com/photos/an-aerial-view-of-a-construction-site-sNPc-K_GfSE' },
} as const
export type PhotoKey = keyof typeof PHOTOS

const WIDTHS = [640, 960, 1280, 1920, 2560]
const url = (id: string, w: number) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=72`

export function photoProps(key: PhotoKey, sizes = '100vw') {
  const p = PHOTOS[key]
  return {
    src: url(p.id, 1920),
    srcSet: WIDTHS.map((w) => `${url(p.id, w)} ${w}w`).join(', '),
    sizes,
    style: { objectPosition: p.pos },
  }
}

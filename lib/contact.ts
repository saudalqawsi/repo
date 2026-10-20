/** Shayul's public phone, shown across the site. */
export const PHONE = {
  display: '050 960 2220',
  intl: '+966 50 960 2220',
  tel: 'tel:+966509602220',
  wa: (text?: string) => `https://wa.me/966509602220${text ? `?text=${encodeURIComponent(text)}` : ''}`,
}

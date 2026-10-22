/** Shayul's public phone, shown across the site. */
export const PHONE = {
  display: '0509602220',
  intl: '+966509602220',
  tel: 'tel:+966509602220',
  wa: (text?: string) => `https://wa.me/966509602220${text ? `?text=${encodeURIComponent(text)}` : ''}`,
}

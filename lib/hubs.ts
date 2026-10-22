/**
 * Where heavy-equipment yards cluster around Riyadh. A provider picks the one their fleet
 * leaves from (or pins their own yard), and service radius and transport are measured from it.
 * Coordinates are district centres from OpenStreetMap.
 */
export const HUBS = [
  { id: 'sulay', ar: 'السلي، مخرج ١٧ (جنوب شرق)', en: 'Al Sulay, Exit 17 (south-east)', lat: 24.6599, lng: 46.8349 },
  { id: 'industrial2', ar: 'المدينة الصناعية الثانية، طريق الخرج (جنوب شرق)', en: '2nd Industrial City, Al Kharj Road (south-east)', lat: 24.5493, lng: 46.8918 },
  { id: 'masane', ar: 'المصانع والصناعية (جنوب)', en: 'Al Masane and the old industrial area (south)', lat: 24.5789, lng: 46.73 },
  { id: 'naseem', ar: 'النظيم، الدائري الشرقي (شرق)', en: 'Al Nadhim, Eastern Ring Road (east)', lat: 24.8001, lng: 46.896 },
  { id: 'banban', ar: 'بنبان، طريق القصيم (شمال)', en: 'Banban, Qassim Road (north)', lat: 25.0017, lng: 46.5881 },
] as const
export const RADII = [25, 50, 75, 100, 150] as const

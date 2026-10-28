import type { Category } from '../../types/category'

export const seedCategories: Category[] = [
  { id: 'rempah', name: 'Rempah & Perencah', slug: 'rempah-perencah', active: true, sortOrder: 1 },
  { id: 'sos', name: 'Sos & Kicap', slug: 'sos-kicap', active: true, sortOrder: 2 },
  { id: 'minyak', name: 'Minyak Masak', slug: 'minyak-masak', active: true, sortOrder: 3 },
  { id: 'beras', name: 'Beras & Tepung', slug: 'beras-tepung', active: true, sortOrder: 4 },
  { id: 'gula', name: 'Gula & Garam', slug: 'gula-garam', active: true, sortOrder: 5 },
  { id: 'santan', name: 'Santan & Tin', slug: 'santan-tin', active: true, sortOrder: 6 },
  { id: 'mi', name: 'Mi & Bihun', slug: 'mi-bihun', active: true, sortOrder: 7 },
  { id: 'kering', name: 'Bahan Kering', slug: 'bahan-kering', active: true, sortOrder: 8 },
]

import type { Product, ProductArt, StockStatus } from '../../types/product'
import { slugify } from '../../utils/slug'

type Row = [
  name: string,
  label: string,
  categoryId: string,
  unit: string,
  packQty: number,
  size: string,
  price: number,
  stock: number,
  min: number,
  oldPrice: number,
  shape: ProductArt['shape'],
  color: string,
  motif: string,
]

// name, packshot label, category, bulk unit, packs per unit, pack size, price (sen), stock, MOQ, old price, shape, colour, motif
const rows: Row[] = [
  ['Serbuk Kari Daging', 'KARI DAGING', 'rempah', 'karton', 12, '1kg', 14520, 32, 1, 15900, 'pouch', '#de9731', 'spice'],
  ['Kicap Manis Premium', 'KICAP MANIS', 'sos', 'karton', 12, '650ml', 8800, 46, 2, 0, 'bottle', '#623125', 'soy'],
  ['Minyak Masak Tulen', 'MINYAK MASAK', 'minyak', 'karton', 4, '5kg', 12500, 18, 1, 13900, 'jug', '#efb931', 'leaf'],
  ['Beras Wangi', 'BERAS WANGI', 'beras', 'guni', 1, '10kg', 5590, 60, 2, 0, 'rice', '#519779', 'rice'],
  ['Serbuk Cili', 'SERBUK CILI', 'rempah', 'karton', 10, '1kg', 11900, 55, 1, 0, 'pouch', '#c94332', 'chili'],
  ['Sos Cili Asli', 'SOS CILI', 'sos', 'karton', 12, '1kg', 6720, 25, 1, 7440, 'bottle', '#c34a31', 'chili'],
  ['Santan Kelapa', 'SANTAN', 'santan', 'karton', 24, '200ml', 7200, 14, 1, 0, 'carton', '#347f64', 'coconut'],
  ['Tepung Gandum', 'TEPUNG GANDUM', 'beras', 'karton', 10, '1kg', 3150, 0, 2, 0, 'pouch', '#5080a6', 'wheat'],
  ['Serbuk Kunyit', 'KUNYIT', 'rempah', 'karton', 12, '500g', 7560, 38, 1, 0, 'pouch', '#dfb234', 'spice'],
  ['Gula Pasir Putih', 'GULA PASIR', 'gula', 'karton', 12, '1kg', 4140, 40, 2, 0, 'pouch', '#7097af', 'sugar'],
  ['Sos Tiram', 'SOS TIRAM', 'sos', 'karton', 12, '510g', 7920, 6, 1, 0, 'bottle', '#283d42', 'soy'],
  ['Bihun Beras', 'BIHUN BERAS', 'mi', 'karton', 20, '400g', 6400, 28, 2, 0, 'packet', '#e37840', 'noodle'],
  ['Lada Hitam Kisar', 'LADA HITAM', 'rempah', 'karton', 12, '250g', 10800, 22, 1, 12000, 'jar', '#485543', 'pepper'],
  ['Minyak Jagung', 'MINYAK JAGUNG', 'minyak', 'karton', 6, '1L', 8700, 20, 1, 0, 'bottle', '#d8a82a', 'leaf'],
  ['Tepung Jagung', 'TEPUNG JAGUNG', 'beras', 'karton', 24, '400g', 6960, 24, 1, 0, 'pouch', '#d19d46', 'wheat'],
  ['Garam Halus', 'GARAM HALUS', 'gula', 'karton', 20, '500g', 2400, 45, 3, 0, 'pouch', '#659c9e', 'sugar'],
  ['Sardin Sos Tomato', 'SARDIN', 'santan', 'karton', 24, '425g', 15840, 35, 1, 17280, 'can', '#bc4833', 'fish'],
  ['Mi Kuning Kering', 'MI KERING', 'mi', 'karton', 20, '500g', 7000, 17, 1, 0, 'packet', '#cba23e', 'noodle'],
  ['Kacang Dal', 'KACANG DAL', 'kering', 'guni', 1, '10kg', 7800, 19, 1, 0, 'rice', '#c47d41', 'beans'],
  ['Asam Jawa', 'ASAM JAWA', 'kering', 'karton', 24, '200g', 4800, 30, 2, 0, 'pouch', '#8b593a', 'beans'],
  ['Gula Perang', 'GULA PERANG', 'gula', 'karton', 12, '1kg', 6240, 12, 1, 0, 'pouch', '#b98350', 'sugar'],
  ['Kacang Panggang', 'KACANG PANGGANG', 'santan', 'karton', 24, '425g', 8640, 0, 1, 0, 'can', '#aa4834', 'beans'],
  ['Spageti', 'SPAGETI', 'mi', 'karton', 20, '500g', 7900, 26, 1, 8800, 'packet', '#9a763e', 'noodle'],
  ['Bawang Goreng', 'BAWANG GORENG', 'kering', 'karton', 12, '500g', 9600, 8, 1, 0, 'jar', '#a8743c', 'onion'],
]

export function stockStatusFor(stock: number | null, min: number): StockStatus {
  if (stock === null) return 'in_stock'
  if (stock < min) return 'out'
  if (stock < 10) return 'low'
  return 'in_stock'
}

export function buildSeedProducts(skuPrefix: string, brand: string): Product[] {
  return rows.map((r, i) => {
    const [name, label, categoryId, unit, packQty, size, price, stock, min, oldPrice, shape, color, motif] = r
    const id = String(i + 1)
    return {
      id,
      sku: `${skuPrefix}-${id.padStart(4, '0')}`,
      name,
      slug: slugify(`${name} ${size}`),
      categoryId,
      images: [],
      unit,
      packQty,
      size,
      price,
      oldPrice: oldPrice > price ? oldPrice : undefined,
      minimumQuantity: min,
      stock,
      stockStatus: stockStatusFor(stock, min),
      promo: oldPrice > price,
      featured: i < 4,
      brand,
      active: true,
      art: { shape, color, motif, label },
    }
  })
}

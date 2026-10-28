import type { Product, ProductQuery } from '../types/product'

/** Pure, side-effect-free filtering/sorting used by local mode and by views after loading. */
export function applyProductQuery(list: Product[], q: ProductQuery = {}): Product[] {
  let out = list.filter((p) => p.active)
  if (q.categoryId) out = out.filter((p) => p.categoryId === q.categoryId)
  if (q.ids) out = out.filter((p) => q.ids!.includes(p.id))
  if (q.inStockOnly) out = out.filter((p) => p.stock >= p.minimumQuantity)
  if (q.promoOnly) out = out.filter((p) => p.promo && !!p.oldPrice && p.oldPrice > p.price)
  if (q.search) {
    const term = q.search.trim().toLowerCase()
    if (term) out = out.filter((p) => `${p.name} ${p.sku ?? ''} ${p.brand ?? ''} ${p.size}`.toLowerCase().includes(term))
  }
  if (q.sort === 'price_asc') out = [...out].sort((a, b) => a.price - b.price)
  if (q.sort === 'price_desc') out = [...out].sort((a, b) => b.price - a.price)
  if (q.sort === 'name') out = [...out].sort((a, b) => a.name.localeCompare(b.name))
  return out
}

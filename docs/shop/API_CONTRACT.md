# Shop API contract (client-api ⇄ client-lzhub)

Shared by `FRONTEND_LOGIC.md` (Codex) and `BACKEND_PROMPT.md` (Claude). Both sides implement **this file**;
the data rules behind it are in `../../SHOP_DESIGN.md` (revision 3). When the two disagree, fix this file first.

Base URL: `VITE_API_BASE_URL` = `https://client-api.mybizgate.com/api/v1` (Laravel adds `/api`; routes live under
`Route::prefix('v1')`). Every request carries `X-Client-Code: <client_code>` (identifier only) and
`Accept: application/json`. Responses are JSON. Money is **integer sen**. Ids are **strings** in JSON
(`"12"`), even though the database uses integers. Dates are ISO-8601 strings; `requestedDate` is `YYYY-MM-DD`.

## 1. Envelopes and errors

| Case | Body |
| --- | --- |
| success, one object | `{ "data": { … } }` |
| success, list | `{ "data": [ … ] }` (no pagination anywhere in this phase) |
| success + guest token issued | `{ "data": { … }, "guestToken": "<64 hex chars>" }` (only on the call that created the profile) |
| validation error | HTTP 422 `{ "message": "<first error, Malay>", "errors": { "field": ["…"] } }` |
| not found | HTTP 404 `{ "message": "…" }` |
| unauthenticated | HTTP 401 `{ "message": "…" }` |
| forbidden / site not active | HTTP 403 `{ "message": "…", "status": "expired", "status_reason": "…", "remarks": "…" }` (the three extra keys only for a site that is not `active`) |
| bad or missing `X-Client-Code` | HTTP 400 (existing `ResolveTenant` behaviour); unknown code → 404 |

The frontend `HttpClient` reads `message` for toasts and treats `401` on `/customer/profile` as "no profile".

## 2. Authentication

Three bearer tokens can appear in `Authorization: Bearer …`:

| Token | Issued by | Used for |
| --- | --- | --- |
| guest token | `POST /orders` or `PUT /customer/profile` without a token | `/orders*`, `/customer/profile` |
| staff token (Sanctum) | `POST /auth/login` | `/auth/me`, `/auth/logout`, `/manage/*`, `/attachments/*` |
| none | – | public catalogue reads |

A staff token is **not** a customer token: `/orders` with a staff token behaves as if no token were sent.
The frontend sends the staff token when logged in, otherwise the guest token.

```text
POST /auth/login     { "email": "...", "password": "..." }
  200 { "token_type": "Bearer", "access_token": "…", "user": { "id": "1", "name": "…", "email": "…", "role": "owner" } }
  401 bad credentials · 403 role customer / user disabled · 403 + status keys when the site is not active
  throttle 5 per minute (existing)
POST /auth/logout    bearer → 204
GET  /auth/me        bearer → { "data": { "id": "1", "name": "…", "email": "…", "role": "owner" | "staff" } }

POST /auth/forgot-password  { "email": "..." }
  200 { "message": "Jika e-mel ini berdaftar sebagai pemilik atau staf, pautan tetapan semula telah dihantar. …" }
  (always the same answer; a mail with `{frontend}/reset-password?token=<64 hex>&email=…` is sent only when the
   e-mail belongs to an active owner/staff of this site. Link valid 60 min, single use, a new request replaces it.
   `{frontend}` = SHOP_FRONTEND_URL when set, otherwise https://<sites.domain>.) · throttle 5 per minute per IP
POST /auth/reset-password   { "email": "...", "token": "...", "password": "...", "password_confirmation": "..." }
  200 { "message": "Kata laluan telah ditetapkan semula. …" } and every existing staff token of the user is revoked
  422 errors.token (unknown / expired / used / another site) · errors.password (min 8, confirmed) · throttle 10 per minute
```

## 3. Public catalogue

```text
GET /client/config
  { "data": { "ordering": { "currency": "MYR", "minimumOrder": 15000, "deliveryFee": 1500,
              "freeDeliveryFrom": 50000, "allowWhatsappOrder": true, "referencePrefix": "LZ",
              "quantityDiscounts": [ { "minQty": 5, "rate": 0.02 }, { "minQty": 10, "rate": 0.04 } ],
              "paymentOptions": [ "Tunai semasa terima barang", "Pindahan bank selepas disahkan" ] } } }
  (Partial<ClientConfig>; the frontend merges it over its static config. `freeDeliveryFrom` omitted when NULL.
   `quantityDiscounts` = active tiers ascending; `paymentOptions` = active methods by sort_order.)

GET /categories                      → { "data": Category[] }  (active, by sortOrder then name)
GET /products?category=&search=&in_stock=&promo=&ids=&sort=   → { "data": Product[] } (all active products)
GET /products/{slug}                 → { "data": Product } | 404
```

```ts
Category = { id: string; name: string; slug: string; description?: string; image?: string; active: true; sortOrder: number }

Product = {
  id: string; sku?: string; name: string; slug: string; description?: string; categoryId: string;
  images: string[];            // media-api view_url: primary first, then gallery by sort_order; [] when none
  unit: string; packQty: number; size: string;
  price: number; oldPrice?: number;   // oldPrice only when promo
  minimumQuantity: number;
  stock: number | null;        // null = unlimited_stock (frontend: no upper bound)
  stockStatus: 'in_stock' | 'low' | 'out';
  featured?: boolean; promo?: boolean; brand?: string;
  active: boolean;             // always true on public endpoints
  art?: { shape: string; color: string; motif: string; label: string };
  updatedAt?: string;
}
```

Derivations (SHOP_DESIGN §5.2): `stockStatus` = `in_stock` when unlimited, else `out` if `stock < minimumQuantity`,
else `low` if `stock < low_stock_threshold`, else `in_stock`. `promo` = `oldPrice > price`. `sort=popular`
(default) = `sort_order, name`; `price_asc`, `price_desc`, `name`. `in_stock=1` = unlimited or
`stock >= minimumQuantity`. `search` matches name, SKU, brand, pack size (case-insensitive substring).
`ids` = comma-separated ids.

## 4. Customer (guest token)

```text
GET  /customer/profile          token → { "data": Customer } | 401 (unknown/no token) | 404 (never: a token always has a profile)
PUT  /customer/profile          body Customer → { "data": Customer, "guestToken"?: string }
GET  /orders                    token → { "data": Order[] } (newest first)
GET  /orders/{reference}        token → { "data": Order } | 404 (also 404 when the order belongs to another profile)
POST /orders                    body OrderDraft → 201 { "data": Order, "guestToken"?: string }
PATCH /orders/{reference}/status  token, body { "status": "pending_review" | "cancelled" } → { "data": Order } | 422 on an illegal transition
```

```ts
Customer   = { storeName: string; contactName: string; phone: string; address: string }  // address "" when none
OrderDraft = { customer: Customer; fulfilment: 'delivery' | 'pickup'; requestedDate: 'YYYY-MM-DD';
               paymentMethod: string /* label */; notes: string; items: { productId: string; qty: number }[] }
OrderItem  = { productId: string; sku?: string; name: string; slug: string; unit: string; packQty: number; size: string;
               qty: number; basePrice: number; unitPrice: number; image?: string; art?: Product['art'] }
Order      = { id: string /* reference_no e.g. LZ-20261031-0017 */; createdAt: string;
               status: 'draft_whatsapp'|'pending_review'|'confirmed'|'processing'|'delivered'|'completed'|'cancelled';
               customer: Customer; fulfilment: 'delivery'|'pickup'; requestedDate: string; paymentMethod: string;
               notes: string; items: OrderItem[]; subtotal: number; deliveryFee: number; total: number;
               history: { status: Order['status']; at: string }[] }
```

Validation and pricing are exactly SHOP_DESIGN §5.3–§5.5. `image`/`art` on items are resolved from the current
product at read time (image = primary attachment URL if any).

## 5. Management (staff token; `users.site_id` must equal the resolved site)

```text
GET    /manage/products?status=&category=&search=   → { "data": ManagedProduct[] } (all statuses, by sortOrder)
POST   /manage/products            body ProductInput → 201 { "data": ManagedProduct }
GET    /manage/products/{id}       → { "data": ManagedProduct }
PUT    /manage/products/{id}       body ProductInput (full) → { "data": ManagedProduct }
DELETE /manage/products/{id}       → 204 (soft delete; status becomes archived)
POST   /manage/products/{id}/inventory  body { "movementType": "restock"|"adjustment"|"return", "quantityDelta": int≠0, "note"?: string }
                                   → { "data": ManagedProduct } (422 when the balance would go negative or the product is unlimited)
GET    /manage/categories          → { "data": ManagedCategory[] } (all statuses)
POST   /manage/categories          body CategoryInput → 201 { "data": ManagedCategory }
PUT    /manage/categories/{id}     body CategoryInput → { "data": ManagedCategory }
DELETE /manage/categories/{id}     → 204 | 422 when products still use it
GET    /manage/orders?status=      → { "data": Order[] }  (all customers; each Order also carries "customerProfileId")
GET    /manage/orders/{reference}  → { "data": Order }
PATCH  /manage/orders/{reference}/status  body { "status": …, "note"?: string } → { "data": Order } | 422
GET|PUT /manage/shop/settings      owner only; { "data": Settings }
GET|POST|PUT|DELETE /manage/shop/discount-tiers[/{id}]    owner only
GET|POST|PUT|DELETE /manage/shop/payment-methods[/{id}]   owner only
```

```ts
ManagedProduct  = Product & { status: 'draft'|'active'|'archived'; sortOrder: number; stockQuantity: number;
                              unlimitedStock: boolean; lowStockThreshold: number; featured: boolean }
ProductInput    = { categoryId: string; name: string; slug?: string; sku?: string | null; description?: string | null;
                    brand?: string | null; unit: string; packQty: number; size: string; price: number;
                    oldPrice?: number | null; minimumQuantity: number; stockQuantity: number; unlimitedStock: boolean;
                    status: 'draft'|'active'|'archived'; sortOrder?: number; featured?: boolean; lowStockThreshold?: number }
ManagedCategory = Category & { status: 'draft'|'active'|'archived'; parentId: string | null }
CategoryInput   = { name: string; slug?: string; description?: string | null; sortOrder?: number; status?: 'draft'|'active'|'archived' }
Settings        = { currency: string; minimumOrder: number; deliveryFee: number; freeDeliveryFrom: number | null;
                    allowWhatsappOrder: boolean; deductStockOnConfirm: boolean; referencePrefix: string }
```

Rules for `PUT /manage/products/{id}`: when `stockQuantity` differs from the stored value and the product is not
unlimited, the API writes an `adjustment` inventory movement for the difference (SHOP_DESIGN §15.6). When
`oldPrice` ≤ `price` the API stores NULL (§5.2). `slug` is generated from `name + size` when absent and made
unique with a numeric suffix. `price`, `oldPrice` are integer sen ≥ 0; `packQty`, `minimumQuantity` ≥ 1;
`stockQuantity` ≥ 0; `unit`, `size` ≤ 50 chars; `name` ≤ 200.

## 6. Attachments (staff token)

Existing routes, now behind staff authentication; entity types `product` and `category`; roles `primary`
(singleton, replaces the previous primary) and `gallery`.

```text
GET    /attachments/product/{productId}                 → { "data": Attachment[] }
POST   /attachments/product/{productId}                 JSON { "media_id": "<26 chars>", "role": "primary" }
                                                        or multipart file=… role=…  → 201 { "data": Attachment }
DELETE /attachments/{attachmentId}                      → { "data": { "id", "media_id", "detached": true } }
Attachment = { id: string; entity_type: string; entity_id: string; media_id: string; role: string; sort_order: number;
               created_at: string; view_url: string; thumbnail_url: string | null; download_url: string; metadata_url: string }
```

Browser flow for a product image: upload the file to **media-api** with the existing `mediaApi.upload(file,
{ module: 'products', entityId })`, then link the returned `id` through `POST /attachments/product/{productId}`
with `role: 'primary'`. Uploads never go to client-api from the browser.

# Frontend logic & process changes — client-lzhub (task brief for Codex)

You are working in `clients/client-lzhub` (Vue 3 + Vite + TypeScript + Pinia + Tailwind). Read **`CLAUDE.md`**
in the repo root first and follow every architecture rule in it. Then read:

- `docs/shop/API_CONTRACT.md` — the exact JSON contract you must consume (shared with the backend).
- `SHOP_DESIGN.md` §5 (pricing/validation/status rules), §13 (decisions), §15 (edit mode).

**The customer UI/UX is confirmed and must not be redesigned.** Keep markup, Tailwind classes, Malay copy,
44 px tap targets, bottom nav and floating cart exactly as they are unless this brief says otherwise. You are
changing logic, data flow and adding the owner/staff edit mode. Mobile (360–430 px) is the primary viewport.

There is no test runner: verify with `npm run typecheck`, `npm run build`, and a browser check in **both**
`VITE_DATA_MODE=local` and `VITE_DATA_MODE=api` (the API may not be live yet; in that case verify `api` mode
only to the point of request shapes in the Network tab, and keep `local` mode fully working).

## 0. Deliverables at a glance

| # | Area | Outcome |
| --- | --- | --- |
| A | API mode correctness | Repositories consume `API_CONTRACT.md` exactly (envelopes, `stock: null`, `Order.id` = reference). |
| B | Guest token | Token returned by `POST /orders` / `PUT /customer/profile` is stored through `storage.ts` and sent on later customer calls. No screen change. |
| C | Staff login | New `/login` route, auth store, `/auth/login|logout|me`; token persisted through `storage.ts`. |
| D | Edit mode | Logged-in owner/staff can toggle "Mod edit": `[+]` card in the listing, edit affordance on every card, in-place product form card (image, category, name, packing, price, original price, stock, minimum order, Simpan). |
| E | Stock switches | `Product.stock` becomes `number \| null` (null = unlimited). All availability logic handles it. |
| F | Both data modes | Every new repository method exists in the interface, `Local*` and `Api*` implementations. Local mode keeps working offline. |

Out of scope (do not build): customer login, staff order management screens, settings/tiers/payment-method
screens, favourites sync, redesign of any existing view.

## 1. Types (`src/types/`)

1. `product.ts`
   - `stock: number | null` (null = unlimited). Add doc comment.
   - Add `export interface ManagedProduct extends Product { status: 'draft' | 'active' | 'archived'; sortOrder: number; stockQuantity: number; unlimitedStock: boolean; lowStockThreshold: number; featured: boolean }`.
   - Add `export interface ProductInput { categoryId: string; name: string; slug?: string; sku?: string | null; description?: string | null; brand?: string | null; unit: string; packQty: number; size: string; price: number; oldPrice?: number | null; minimumQuantity: number; stockQuantity: number; unlimitedStock: boolean; status: 'draft' | 'active' | 'archived'; sortOrder?: number; featured?: boolean }`.
2. `category.ts` — add `ManagedCategory` (`Category & { status; parentId: string | null }`) and `CategoryInput`.
3. New `auth.ts` — `AuthUser = { id: string; name: string; email: string; role: 'owner' | 'staff' }`,
   `LoginResult = { accessToken: string; user: AuthUser }`.
4. `order.ts` — unchanged. (`Order.id` is the API reference number; nothing to change.)

## 2. Stock = `number | null` (E)

Centralise the rule in `src/services/pricing.ts`:

```ts
export function hasStock(p: Pick<Product, 'stock' | 'minimumQuantity'>, qty = p.minimumQuantity) { return p.stock === null || p.stock >= qty }
export function isAvailable(p) { return p.active && hasStock(p) }
export function maxOrderable(p: Pick<Product, 'stock'>): number | undefined { return p.stock === null ? undefined : p.stock }
export function isLowStock(p) { return p.stock !== null && p.stock < 10 }   // mirrors stockStatusFor
```

Then update every place that compares `stock` numerically so `null` means "no limit":
`src/services/product-query.ts` (`inStockOnly`), `src/stores/cart.ts` (`issues`, `change`, `signature`),
`src/stores/order.ts` (`reorder`), `src/services/repositories/local.repository.ts` (`create` validation,
`adjustStock` must skip null), `src/data/seed/products.ts` (`stockStatusFor(stock: number | null, min)` →
`in_stock` for null), `src/components/catalogue/ProductCard.vue` (`stockText`: null → `Sentiasa ada`;
`dotClass` green; `QtyControl :max` → `maxOrderable(product)`), `src/views/ProductView.vue` and
`src/views/CartView.vue` / `src/components/cart/CartLine.vue` (same substitutions), `QtyControl.vue` (`max?:
number`, no upper bound when undefined). Keep the visible wording for numeric stock exactly as today.

## 3. Guest token (B)

1. New `src/services/session.ts` (no Vue imports): `getGuestToken()`, `setGuestToken(token)`,
   `clearGuestToken()`, `getStaffToken()`, `setStaffToken()`, `clearStaffToken()` using the shared `storage`
   from `src/services/repositories/index.ts`… **but** that module imports `http`; to avoid a cycle create
   the storage inside `session.ts` with `createStorage(env.clientCode)` (keys `guest-token` and `auth-token`,
   version 1, plain strings) and have `repositories/index.ts` reuse it: `export const storage = sessionStorageInstance`.
2. In `src/services/repositories/index.ts` (API branch only):
   `http.setTokenProvider(() => getStaffToken() ?? getGuestToken())`.
3. `ApiOrderRepository.create` and `ApiCustomerRepository.saveProfile`: the response may be
   `{ data, guestToken }`. Replace the generic `unwrap` for these two calls with code that reads
   `guestToken` and calls `setGuestToken()` **before** returning `data`. (`unwrap` stays for everything else.)
4. `ApiCustomerRepository.getProfile` already maps 401/404 to `null`; keep. When `GET /orders` returns 401
   (no token yet), return `[]` instead of throwing so the orders screen shows its empty state.
5. The account screen copy ("disimpan pada browser ini sahaja") stays unchanged.

## 4. Staff login (C)

1. Repository: `src/services/repositories/auth.repository.ts` interface
   `{ login(email, password): Promise<LoginResult>; logout(): Promise<void>; me(): Promise<AuthUser | null> }`.
   - `ApiAuthRepository`: `POST /auth/login` → map `{ access_token, user }`; `POST /auth/logout`; `GET /auth/me`
     (401 → `null`).
   - `LocalAuthRepository` (prototype): any non-empty email whose domain is `@lzhub.test` with password `demo`
     logs in as `{ id: '1', name: 'Pemilik Demo', email, role: 'owner' }`; store the fake token `local-owner` in
     storage so a refresh keeps the session. Anything else → `HttpError(401, 'E-mel atau kata laluan salah.')`.
   - Register `auth` in `Repositories` and in `build()` for both modes.
2. `src/services/auth.service.ts` → thin wrapper like `order.service.ts`.
3. Store `src/stores/auth.ts` (Pinia): `user: AuthUser | null`, `status`, `editMode` (persisted via
   `usePersistedRef('edit-mode', () => false, v => typeof v === 'boolean')`), getters `isStaff`
   (`user?.role === 'owner' || 'staff'`), `canEdit = isStaff && editMode`; actions `restore()` (if a staff token
   exists call `me()`; on `null` clear the token), `login(email, password)` (store token, set user, set
   `editMode = true`, toast "Selamat datang, {name}."), `logout()` (call API best-effort, clear token, `user =
   null`, `editMode = false`). Call `auth.restore()` from `src/main.ts` next to `client.init()`.
4. Route `/login` → `src/views/LoginView.vue`: `PageHead` ("Log masuk pengurusan"), a `panel` form with two
   `field`s (E-mel, Kata laluan), `btn-primary` "Log masuk", `validation-error` on failure, redirect to the
   `redirect` query or `/catalogue` on success. Already logged in → redirect to `/account`. Mobile-first, same
   components and classes as `AccountView.vue`; no new design language.
5. `AccountView.vue`: add a third `panel` **below** the existing content titled "Pengurusan kedai":
   - logged out → text "Untuk pemilik dan staf." + `RouterLink` to `/login` (`btn-secondary` or existing button
     class).
   - logged in → user name/role, a checkbox/switch "Mod edit" bound to `auth.editMode`, and a "Log keluar" button.
6. `DefaultLayout.vue`: when `auth.canEdit`, show a small chip in the topbar (`chip` class) with the text
   "Mod edit" that links to `/account`. No other layout change.

## 5. Edit mode (D)

### 5.1 Management repository

`src/services/repositories/manage.repository.ts` interface:

```ts
interface ManageRepository {
  listProducts(): Promise<ManagedProduct[]>
  createProduct(input: ProductInput): Promise<ManagedProduct>
  updateProduct(id: string, input: ProductInput): Promise<ManagedProduct>
  listCategories(): Promise<ManagedCategory[]>
  createCategory(input: CategoryInput): Promise<ManagedCategory>
  setPrimaryImage(productId: string, file: File): Promise<string>   // resolves to the image URL
}
```

- `ApiManageRepository`: `/manage/products`, `/manage/categories` per the contract. `setPrimaryImage` =
  `mediaApi.upload(file, { module: 'products', entityId: productId })` (existing `media.service.ts`) then
  `POST /attachments/product/{productId}` with `{ media_id, role: 'primary' }` and return `view_url`.
- `LocalManageRepository`: operates on `LocalCatalogueRepository` (add `upsert(product)` and `all()` there,
  persisting through the existing `PRODUCTS_KEY`), generates ids `String(max + 1)`, slugs with
  `src/utils/slug.ts` (`slugify(`${name} ${size}`)`, numeric suffix if taken), computes `stockStatus` with
  `stockStatusFor`, `promo`, and stores the image as a data URL (`FileReader`, reject files > 1 MB with a
  Malay message) in `images[0]`. Seed categories are read-only in local mode except that `createCategory`
  pushes into an in-memory list persisted under a new storage key `categories`.
- `src/services/manage.service.ts` wrapper; register `manage` in `Repositories`.
- In `useCatalogueStore` add `upsertProduct(p: Product)` (replace by id or push) and `addCategory(c)` so the
  grid updates without a reload after a save.

### 5.2 Components (`src/components/manage/`)

All three are rendered **only** when `auth.canEdit` is true. They reuse `panel`, `field`, `btn-primary`,
`btn-secondary`, `validation-error`, `chip`, `AppIcon` and the product card shell classes so they look native.
Add icons to `AppIcon.vue` only if `plus`, `pencil`, `image`, `close` do not exist.

1. **`AddProductCard.vue`** — the empty card. Same outer classes as `ProductCard.vue`'s `<article>`; the stage
   area shows a dashed rounded box with a large `[+]` glyph and the text "Tambah produk"; the body is empty.
   Whole card is a `button` (min 44 px). Emits `add`.
2. **`ProductEditorCard.vue`** — the form card used for **both add and edit** (`props: product?: ManagedProduct`).
   It replaces the card in the grid cell and spans two columns (`col-span-2`) so it reads like the guide image on
   a phone. Layout, top to bottom, matching the guide:
   - **Stage** (same height/background as the customer card): discount badge top-left computed live from the two
     price fields (`discountPercent`), the heart button is **not** rendered; centre = dashed drop zone
     `[+] Add Product Image` → copy in Malay: `[+] Tambah gambar produk`. Clicking opens a hidden
     `<input type="file" accept="image/*">`. When an image exists (existing `images[0]` or the just-picked file
     via `URL.createObjectURL`) show it with `ProductArt`'s sizing and a small "Tukar gambar" link.
   - **Fields** (`field` class each; labels in Malay, placeholders as in the guide):
     `Kategori` (select of catalogue categories + last option `+ Kategori baharu…` that reveals an inline text
     input and a small "Simpan kategori" button), `Nama produk` (placeholder `cth: Serbuk Kari Daging 1kg`),
     two-column row `Pembungkusan` (placeholder `12 x 1kg / karton`) and `Harga (RM)` (`145.20`),
     two-column row `Harga asal (RM)` (optional, `159.00`) and `Stok ({unit})` with a checkbox under it
     `Tanpa had` that disables the number input, two-column row `Pesanan minimum ({unit})` and the submit
     button `+ Simpan` (`btn-primary`, full width of its column). Below: `Aktif` checkbox (status active/draft)
     and a text button `Batal`.
   - `{unit}` in the labels updates live from the parsed Pembungkusan field (falls back to `unit`).
   - Validation (client-side, before calling the API), show the first error in `validation-error`:
     category required · name 2–200 chars · packing must match
     `/^\s*(\d+)\s*[x×X]\s*(\S+)\s*\/\s*(\S+)\s*$/` → `packQty`, `size`, `unit` · price > 0 · original price
     empty or > price · stock ≥ 0 integer unless unlimited · minimum ≥ 1 integer.
   - Money: add `parseMoney(input: string): number | null` (RM string → sen, 2 dp, rejects NaN/negative) and
     `toMoneyInput(cents): string` to `src/utils/money.ts`.
   - Save flow: build `ProductInput`; `create` or `update`; if a new file was picked call `setPrimaryImage`
     with the returned id; set `images[0]`; `catalogue.upsertProduct(result)`; toast "Produk disimpan."; emit
     `saved`. While saving, disable the form and label the button "Menyimpan…". On error show the API `message`.
     Server 422 `errors` → show the first message.
3. **Edit affordance on `ProductCard.vue`** — when `auth.canEdit`, render one extra absolutely positioned
   44 px round button (top-right, left of the heart; `pencil` icon, aria-label `Sunting {name}`) that emits
   `edit`. This is the **only** change to `ProductCard.vue`'s template besides the stock text in §2.

### 5.3 Grid integration (`CatalogueSection.vue`)

- Keep the existing filters/sort row untouched.
- State: `editing: string | 'new' | null`.
- When `auth.canEdit`: render `AddProductCard` as the **first** grid cell (or `ProductEditorCard` when
  `editing === 'new'`); for each product render `ProductEditorCard` instead of `ProductCard` when
  `editing === p.id`. Only one editor open at a time; opening another closes the first.
- In edit mode the list must also include **draft/archived** products of the site so they can be fixed:
  `CatalogueSection` receives products from the views; add a computed in the catalogue store
  `manageableProducts` (loaded from `manage.listProducts()` when edit mode turns on, kept in a separate ref,
  refreshed after each save) and let `CatalogueView.vue` pass `catalogue.manageableProducts` instead of
  `activeProducts` when `auth.canEdit && mode === 'all'`. Draft/archived cards show a small `chip` "Draf" /
  "Arkib" at the bottom of the card body (only in edit mode).
- Scroll the opened editor into view on mobile (`scrollIntoView({ block: 'start', behavior: 'smooth' })`).

## 6. Client config from the API

`ApiClientRepository.getConfig()` already merges `ordering`; verify the merge keeps `paymentOptions` from the
API (the order store defaults `paymentMethod` to `paymentOptions[0]`). Add a guard so an empty API array does
not wipe the static list (`remote.ordering?.paymentOptions?.length ? … : fallback`).

## 7. Local mode parity (F)

Everything above must work with `VITE_DATA_MODE=local`: login with `pemilik@lzhub.test` / `demo`, toggle edit
mode, add a product with a packshot-less card (no image), edit price/stock, mark unlimited, add a category.
Reloading keeps products, categories and session (storage keys are namespaced `mybizgate:lzhub:*`).

## 8. Acceptance checklist

1. `npm run typecheck` and `npm run build` pass; no `any`, no `localStorage` outside `storage.ts`, no `fetch`
   outside `http.ts`/`media.service.ts`.
2. Customer flows unchanged visually: home, catalogue, product, cart, checkout, orders, account, at 360 px and
   1280 px. Unlimited products show "Sentiasa ada" and can be added beyond any count.
3. API mode request shapes match `API_CONTRACT.md` (check `POST /orders`, `PUT /customer/profile`, token
   headers, `/manage/products` bodies, attachment link body).
4. Edit mode: `[+]` card first; editor card matches the guide (image zone, Category, Product Name, Packing +
   Price row, Original Price + Stock row, Minimum Order + `+ Simpan`), live `-N%` badge, Tanpa had, validation
   messages, two-step save with image, grid updates without reload, "Mod edit" chip visible.
5. Logout hides every edit affordance and clears the staff token; the guest token (if any) survives.
6. `README.md`: add a short "Pengurusan (edit mode)" paragraph and the local demo credentials.

## 9. File map (new or touched)

```text
src/types/{product,category,auth}.ts
src/services/{session,auth.service,manage.service}.ts
src/services/pricing.ts · product-query.ts · http.ts (unchanged API) · media.service.ts (unchanged)
src/services/repositories/{index,api.repository,local.repository,auth.repository,manage.repository}.ts
src/stores/{auth,catalogue,cart,order}.ts · src/main.ts · src/router/index.ts
src/views/{LoginView,AccountView,CatalogueView,ProductView,CartView}.vue
src/components/manage/{AddProductCard,ProductEditorCard}.vue
src/components/catalogue/{ProductCard,CatalogueSection}.vue · src/components/common/{QtyControl,AppIcon}.vue
src/utils/money.ts · src/data/seed/products.ts · src/layouts/DefaultLayout.vue · README.md
```

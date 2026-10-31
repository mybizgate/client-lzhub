# Backend implementation prompt — client-api shop domain (for Claude Code)

Run this in `~/Workspace/mybizgate/client-api` (Laravel 13, PHP 8.3, MariaDB 10.11, Sanctum). Read, in this
order, before writing code:

1. `CLAUDE.md` (all of it — especially **Tenancy model**, **Core tenant schema**, **Database change procedure**,
   **Dummy frontend-contract routes**, **Media attachments**).
2. `../clients/client-lzhub/SHOP_DESIGN.md` revision 3 — the approved data design. §2 tenant resolution, §5
   rules, §6 DDL, §7 media, §9 auth policy, §10 endpoints, §13 decisions, §15 edit mode.
3. `../clients/client-lzhub/docs/shop/API_CONTRACT.md` — the JSON contract the Vue frontend consumes. Implement
   it **exactly** (key names, envelopes, status codes, string ids, integer sen).
4. `database/schema/00_shop_schema_2026-10-31.sql` — already written and validated on MariaDB. Your migrations
   must produce this structure, with the migration file names listed at the end of that file.
5. `../clients/client-lzhub/docs/shop/shop_seed_lzhub.sql` — the lzhub data; use it to understand the seed, and
   mirror it in a seeder for local development/tests.
6. `../media-api/attachment_integration.md` (required by CLAUDE.md before touching attachments).

Do not change Composer dependencies. Do not touch `../media-api`. Keep the `/health` and `/info` contracts.
Run `vendor/bin/pint --dirty --format agent` before finishing. Tests must pass on sqlite `:memory:`
(CHECK constraints behind the mysql/mariadb driver guard, as the core migrations already do).

## Work packages (do them in order; each must leave the suite green)

### P1 — Migrations, models, enums, factories

- Create exactly these migrations (names fixed by the SQL file): `2026_10_31_100000_add_site_id_id_unique_to_users_table`
  … `2026_10_31_101100_create_shop_favourites_table`. Column types, defaults, indexes, foreign keys, column
  **comments** (`->comment()`) and named CHECK constraints must match SHOP_DESIGN §6 / the SQL file. Use
  `DB::statement` for the composite foreign keys `(site_id, x_id) REFERENCES … (site_id, id)` where the schema
  builder cannot express them; keep all `down()` methods working.
- Prove equivalence with the procedure in CLAUDE.md step 4 on the spare database `mybizgat_clientapi`
  (migrate from empty → `SHOW CREATE TABLE` capture → `migrate:reset` → apply `00_main_structure.sql` +
  `00_core_schema_2026-10-31.sql` + `00_shop_schema_2026-10-31.sql` → capture → diff). Report any difference and
  fix the **migration**, not the SQL file, unless the SQL file is wrong (then say so and update
  SHOP_DESIGN.md §6 too). Afterwards regenerate `00_main_structure.sql` with `schema:dump --path=…`.
- Models in `App\Models` with `Shop` prefix? **No** — use the table-aligned names `ShopSetting`, `ShopCategory`,
  `ShopProduct`, `ShopDiscountTier`, `ShopPaymentMethod`, `ShopCustomerProfile`, `ShopOrder`, `ShopOrderItem`,
  `ShopOrderStatusHistory`, `ShopInventoryMovement`, `ShopFavourite`. Soft deletes where the table has
  `deleted_at`. Casts for json, booleans, timestamps. Relationships both ways. A `BelongsToSite` trait with a
  `forSite(int $siteId)` scope; every query in the app goes through it.
- PHP enums mirroring the CHECK constraints: `PublicationStatus` (draft/active/archived), `OrderStatus`
  (the seven values), `FulfilmentMethod`, `ActorType`, `InventoryMovementType`. Use them in Form Request
  `in:` rules.
- Factories for every model (needed by tests), plus `SiteFactory`/`ClientFactory` if missing; fix
  `UserFactory` to set `site_id` through a `Site` (CLAUDE.md notes it is still stock).
- `ShopLzhubSeeder` that reproduces `shop_seed_lzhub.sql` for local use (`php artisan db:seed --class=…`), idempotent.

### P2 — Site resolution

- New middleware `ResolveSite` (alias `site`) that **wraps** the existing `tenant` behaviour: validate
  `X-Client-Code` like `ResolveTenant`, load `clients` → `sites` (one query, cached per request), `404` when the
  code is unknown, `403` with `status`, `status_reason`, `remarks` when `sites.status !== 'active'`. Expose
  `tenant` (string) and `site` (`Site` model) request attributes. Replace `tenant` with `site` on all shop routes
  and on `/attachments/*`; keep `ResolveTenant` for the legacy `/test/*` prototype.
- `EnsureSiteStaff` middleware (alias `site.staff`): requires `auth:sanctum`, user `status = active`, role
  `owner|staff`, and `users.site_id === site.id`; otherwise `401`/`403`. `EnsureSiteOwner` for owner-only routes.
- `ResolveShopCustomer` middleware (alias `shop.customer`): reads a bearer token that is **not** a Sanctum
  token, hashes it (SHA-256), loads the `ShopCustomerProfile` of the site, updates `last_seen_at`, exposes the
  `customerProfile` attribute; `401` when the token is unknown; passes through with `null` when no token is
  present (controllers decide whether that is allowed).

### P3 — Public catalogue (replaces the dummy routes)

- Remove `DummyDataController` routes for `/products`, `/categories`, `/client/config` and their tests; add
  real controllers in `App\Http\Controllers\Api\Shop\…` with Eloquent API Resources (`ProductResource`,
  `CategoryResource`, `ClientConfigResource`) producing the shapes in API_CONTRACT §3, ids as strings,
  derived fields per SHOP_DESIGN §5.2 (`stock` null when `unlimited_stock`, `stockStatus`, `promo`,
  `oldPrice` omitted when not promo, `images[]` from `media_attachments` via `MediaApiClient::urls()` — primary
  first, then gallery by `sort_order`; eager-load in one query, never N+1).
- Query parameters `category`, `search`, `in_stock`, `promo`, `ids`, `sort` per the contract; `active` means
  product **and** category active and not deleted.
- `GET /client/config` returns `ordering` built from `shop_settings`, active tiers and active payment methods.
- Feature tests for every endpoint including tenant isolation (a product of site A never appears under site B),
  unknown client code, inactive site.

### P4 — Customers and orders (guest token)

- `GuestTokenService`: `issue(ShopCustomerProfile)` → 32 random bytes hex (64 chars) stored as SHA-256; `find(site, token)`.
- `PUT /customer/profile`: create-or-update the profile for the token; when there is no token create a profile
  and return `guestToken`. Validation per SHOP_DESIGN §5.4 (store/contact ≥ 2, phone 9–15 digits, address
  optional here).
- `OrderPricingService` reproducing `src/services/pricing.ts` **exactly** (SHOP_DESIGN §5.3): per-line highest
  qualifying tier, `unit_price_minor = (int) round(selling_price_minor * (10000 - bp) / 10000)`, subtotal,
  delivery fee (0 for pickup or subtotal ≥ free_delivery_from), minimum order on the discounted subtotal.
- `OrderReferenceService`: `{prefix}-{YYYYMMDD}-{NNNN}` using `shop_settings.next_order_number` with
  `lockForUpdate()` inside the order transaction (§5.5).
- `POST /orders` (`StoreOrderRequest`): validation table §5.4 (payment method matched **by label** against
  active methods; store code + label snapshot; requested date ≥ tomorrow in `Asia/Kuala_Lumpur`; notes ≤ 500;
  stock check unless `unlimited_stock`). Creates order, items (snapshots), first history row
  (`draft_whatsapp`, actor `customer`), returns 201 with `Order` and `guestToken` when a profile was created.
- `GET /orders`, `GET /orders/{reference}`, `PATCH /orders/{reference}/status` (customer transitions only:
  `draft_whatsapp → pending_review`, open statuses → `cancelled`; §5.5 table; `422` otherwise).
- `OrderResource` per API_CONTRACT §4: `id` = `reference_no`, `history` from status history ascending,
  `items[].image`/`art` resolved from the current product (`art` from `placeholder_art_json`).
- `StockService` (§5.7): `deductForOrder` on `confirmed` and `restoreForOrder` on `cancelled`, **only when**
  `shop_settings.deduct_stock_on_confirm` is true; skip `unlimited_stock` products; product rows locked; one
  `shop_inventory_movements` row per line; `422` and no change when stock is insufficient at confirmation.
- Tests: pricing parity table (use the lzhub tiers: 1×14520, 5×14520→14230 each, 10×14520→13939 each; check
  rounding), delivery fee rules, minimum order, each validation rule, reference sequence under two concurrent
  requests (use a transaction test), every legal and illegal transition, stock on/off switch, unlimited product.

### P5 — Owner/staff authentication

- Replace `DummyLoginController` (and its test) with `AuthController@login|logout|me` per API_CONTRACT §2:
  resolve the site from `X-Client-Code`, find the user by `(site_id, email)`, check `status = active` and role
  `owner|staff` (customers get `403`), site must be `active` (`403` + status keys), issue a Sanctum token named
  `shop-manage`, set `last_login_at`. Keep `throttle:5,1`.
- Artisan command `shop:user {client_code} {--role=owner} {--email=} {--name=}` that asks for the password with
  a hidden prompt (`secret()`), creates or updates the user for the client's site. This is how the lzhub owner
  is created after deployment (passwords never go in SQL or docs). Document it in `CLAUDE.md`.

### P6 — Management endpoints and attachments

- Routes under `/manage` behind `site` + `site.staff` (owner-only ones also `site.owner`), controllers under
  `App\Http\Controllers\Api\Shop\Manage\…`, Form Requests with the limits in API_CONTRACT §5, resources
  `ManagedProductResource`, `ManagedCategoryResource`, `SettingsResource`.
- Product create/update: slug generation (`Str::slug(name.' '.size)`, numeric suffix when taken within the
  site), `oldPrice <= price` → NULL, `stockQuantity` change → `adjustment` movement (`created_by_user_id` =
  actor), `unlimited_stock` toggling records no movement, audit columns `created_by_user_id`/`updated_by_user_id`,
  `published_at` set the first time status becomes `active`. Delete = soft delete + `archived`.
- Inventory endpoint `POST /manage/products/{id}/inventory` per contract.
- Categories: cycle prevention for `parent_id` (§6.3 note), delete refused with `422` while products reference it.
- Orders: `GET /manage/orders`, `GET /manage/orders/{reference}`, `PATCH …/status` with the staff transition
  table (§5.5), `note` stored in the history row, actor `staff`, `StockService` hooks.
- Settings / tiers / payment methods CRUD (owner). Renaming an **active** payment method's label is refused
  with `422` (§13.4); deactivate and create instead.
- Attachments: move the `/attachments/*` group behind `site` + `site.staff`; add
  `'category' => ['module' => 'categories']` to `config/attachments.php`; verify the entity exists in the site
  (`shop_products`/`shop_categories`) before linking, `404` otherwise; `tenant_id` stays the client code.
  Update `AttachmentControllerTest` for the new auth requirement.
- Policies (`ShopProductPolicy` etc.) are optional if the middleware already guarantees site + role; if you add
  them, keep them thin.

### P7 — Documentation and hand-over

- Update `CLAUDE.md`: Tenancy model (site resolution, three token kinds), Dummy routes section (now replaced),
  Database (shop tables, link to SHOP_DESIGN.md), the `shop:user` command, and the schema-file list. Keep
  `AGENTS.md` in sync if the Boost block changed (it should not).
- Regenerate `database/schema/00_main_structure.sql` (procedure step 5). Do **not** edit
  `00_shop_schema_2026-10-31.sql` unless a migration mismatch forced a design change (then update
  SHOP_DESIGN.md §6 as well and say so in your report).
- `php artisan route:list --path=v1` in the final report, plus the test summary.

## Definition of done

- `composer test` green locally (container if `pdo_sqlite` is missing), Pint clean.
- Migrations ⇄ SQL file equivalence proven on `mybizgat_clientapi` and the diff reported.
- Every endpoint in API_CONTRACT.md exists with the documented shape, status codes and auth; the old dummy
  endpoints and their tests are gone.
- Tenant isolation tests pass for catalogue, customer, orders, manage and attachments.
- Pricing parity tests pass with the exact numbers from `src/services/pricing.ts` semantics.
- No absolute paths, secrets or credentials in code, tests, fixtures or docs.

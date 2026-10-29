# Lz Success Enterprise (lzhub)

Supplier catalogue and WhatsApp ordering frontend for **Lz Success Enterprise**, deployed by
MyBizGate at https://lzhub.mybizgate.com/. The codebase is the reusable base for other
MyBizGate supplier clients: everything specific to this business lives in configuration and
seed data, not in components.

## Technology stack

- Vue 3 (`<script setup>`, Composition API) + TypeScript
- Vite 7 (build/dev server), Vue Router 4 (history mode), Pinia 3
- Tailwind CSS 3 with brand colours driven by CSS variables set from the client config
- No backend yet. Prototype mode runs entirely in the browser with localStorage.

## Local development

```bash
npm install
npm run dev        # http://localhost:5173
npm run typecheck  # vue-tsc
npm run build      # typecheck + production build into dist/
npm run preview    # serve dist/ locally with SPA fallback
```

Node 20+ is required for development and CI only. Production is static.

## Environment configuration

Copy `.env.example` to `.env.local` for personal overrides. Committed files:

| File | Purpose |
| --- | --- |
| `.env.development` | used by `npm run dev` |
| `.env.production` | used by `npm run build` |
| `.env.example` | documented template |

| Variable | Meaning |
| --- | --- |
| `VITE_CLIENT_CODE` | which client config to build (`lzhub`) |
| `VITE_DATA_MODE` | `local` (prototype, default) or `api` (future Laravel backend) |
| `VITE_API_BASE_URL` | client-api base URL for business data, e.g. `https://client-api.mybizgate.com/api/v1` |
| `VITE_MEDIA_API_BASE_URL` | media-api base URL for file/image uploads, e.g. `https://media-api.mybizgate.com/api/v1` |
| `VITE_SITE_URL` | canonical site URL used for Open Graph / canonical tags |

`VITE_*` values are compiled into the public bundle. Never put secrets in them.

## Architecture

```
Vue components  →  Pinia stores  →  services  →  repository interfaces
                                                   ├─ Local*Repository  (VITE_DATA_MODE=local)
                                                   └─ Api*Repository    (VITE_DATA_MODE=api)
```

- `src/types/` – shared TypeScript models (`ClientConfig`, `Category`, `Product`, `Order`, …). Money is integer cents.
- `src/config/clients/<code>.ts` – one file per client; `src/config/site.config.ts` picks the active one from `VITE_CLIENT_CODE`.
- `src/services/repositories/` – `catalogue`, `order`, `customer` and `client` repository interfaces with local and API implementations; `index.ts` is the factory.
- `src/services/storage.ts` – the only module that touches `localStorage`. Keys are `mybizgate:<client>:<name>:v<version>` so clients never collide.
- `src/services/http.ts` – fetch wrapper for API mode. Sends `X-Client-Code` (identification only, never authorisation) and a bearer token when an auth provider is registered.
- `src/stores/` – `client`, `catalogue`, `cart`, `order`, `ui`. Persisted slices: cart, favourites, watch list, checkout draft.
- `src/components/`, `src/views/`, `src/layouts/` – UI. Components receive everything through stores/config and never call storage or HTTP directly.

## Prototype mode (`VITE_DATA_MODE=local`)

Fully functional without a backend: categories, catalogue with search/filter/sort, product
pages with quantity-tier pricing, favourites, stock-watch, cart with minimum-order and stock
validation, checkout with saved store profile, order history, re-order, "mark as sent",
cancel, copy order text, and WhatsApp hand-off of the order message. Seed data is in
`src/data/seed/`. Refreshing the page keeps the cart, favourites, profile and draft order.

## API mode (`VITE_DATA_MODE=api`)

Switching the flag makes the same stores use `Api*Repository` against `VITE_API_BASE_URL`.
The expected REST contract is documented at the top of
`src/services/repositories/api.repository.ts` (`/categories`, `/products`, `/orders`,
`/customer/profile`, `/client/config`). If the client config endpoint is unreachable the
static config is used, so the shell still renders.

Authentication is prepared but not implemented: `http.setTokenProvider()` attaches a bearer
token; customer/staff login screens and role checks can be added as new routes and a store
without restructuring.

## Client configuration

`src/config/clients/lzhub.ts` holds business name, tagline, logo, favicon, contact details,
map coordinates, ordering rules (minimum order, delivery fee, free-delivery threshold,
quantity discounts, payment options, order reference prefix), branding colours, SEO text and
all customer-facing marketing copy. `site.config.yml` remains the MyBizGate platform's
hosting/DNS metadata for the same business; keep the two in sync when contact details change.

## Creating Another Client

Business-specific values are changed through configuration and data only. Do not edit shared
components to fit a new client.

1. Copy this repository (or use the MyBizGate wizard) to `clients/client-<slug>/`.
2. Add `src/config/clients/<slug>.ts` implementing `ClientConfig` and register it in
   `src/config/clients/index.ts`.
3. Replace `public/images/logo.png` and `public/fav.ico` (paths are set in the config).
4. Replace the seed data in `src/data/seed/categories.ts` and `src/data/seed/products.ts`
   (or point `VITE_DATA_MODE=api` at the backend once it exists).
5. Set `VITE_CLIENT_CODE=<slug>` and `VITE_SITE_URL` in the `.env.*` files.
6. Update `site.config.yml` and the GitHub variables (`SITE_NAME`, `SITE_DOMAIN`, `DEPLOY_DIR`).

Themes come from `branding.*` colours; the Tailwind palette reads them through CSS variables
at runtime, so no stylesheet changes are needed per client.

## Deployment to MyBizGate hosting

- `main` is development, `deploy` is production.
- Pushing to `deploy` runs `.github/workflows/deploy.yml`: `npm ci`, `npm run build`, then
  an FTPS upload of `dist/` to `public_html/clients/lzhub/` using the `FTP_*` secrets and
  `DEPLOY_DIR` / `SITE_DOMAIN` / `SITE_NAME` variables provisioned by the platform wizard.
  Optional variables `VITE_DATA_MODE` and `VITE_API_BASE_URL` override the build-time mode.
- `dist/` is never committed. It contains `index.html`, hashed assets, `.htaccess`
  (SPA rewrite for Vue Router history mode on Apache/cPanel) and `robots.txt`.
- The web server only serves static files; no Node process runs in production.

```bash
git checkout main && git push origin main
git checkout deploy && git merge --ff-only main && git push origin deploy
```

Rollback: check out the previous `prod-*` tag on `deploy` and push, or run
`../../platform/bin/rollback.sh lzhub`.

Note: the shared platform workflow (`static-site-deploy.yml`) copies static sources and does
not run `npm run build`, which is why this repository carries its own workflow.

## Future Laravel integration

Target architecture:

```
lzhub.mybizgate.com (Vue 3, static dist/)
        ↓ REST, X-Client-Code: lzhub
        ├─ client-api.mybizgate.com (Laravel) → MariaDB            business data
        └─ media-api.mybizgate.com  (Laravel) → tenant file storage files and images
```

Backend requirements to keep in mind:

- **CORS**: the frontend and API are different origins. Laravel must allow
  `https://lzhub.mybizgate.com` (and each future client subdomain) in `config/cors.php`
  for the `/api/*` paths, including the `X-Client-Code` and `Authorization` headers.
  The frontend does not and cannot work around this.
- **Tenant authorisation**: `X-Client-Code` is an identifier only. The backend must scope
  data by an authenticated tenant/customer, never by trusting the header.
- **Order pricing**: the frontend sends an `OrderDraft` (customer, fulfilment, requested
  date, items with quantities). The API prices it and returns the stored `Order`.
- **Money**: integer cents everywhere.

## Repository layout

```
public/            static assets copied to dist/ as-is (logo, favicon, .htaccess, robots.txt)
src/               application source (see Architecture)
legacy/            the original single-file static site kept for visual reference only
site.config.yml    MyBizGate platform metadata (hosting, domain, business facts)
```

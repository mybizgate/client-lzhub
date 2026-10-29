# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Vue 3 + Vite + TypeScript + Pinia + Vue Router + Tailwind frontend for **Lz Success Enterprise**
(client code `lzhub`), one of the `clients/client-<slug>/` repos managed by MyBizGate. It is also
the reusable base for other supplier clients. Workspace-wide rules live in `../../AGENTS.md`.
README.md documents the stack, modes, deployment and how to create another client.

## Commands

```bash
npm install
npm run dev          # Vite dev server on :5173
npm run typecheck    # vue-tsc --noEmit
npm run build        # typecheck + vite build -> dist/ (never commit dist/)
npm run preview      # serve dist/ with SPA fallback
```

There is no test runner. Verify changes with `npm run build` and a browser check at mobile
(360–430 px) and desktop widths. Deployment is `.github/workflows/deploy.yml` (push to `deploy`),
not the platform's `mybizgate build` command, which does not understand Vite projects.

## Architecture rules (must follow)

- **Do not hard-code client data in reusable components.** Business name, tagline, logo, contact
  details, WhatsApp number, ordering rules, colours, SEO and marketing copy come from
  `src/config/clients/<code>.ts` via `useClient()` / `useClientStore()`.
- **Do not call `localStorage` from UI components or stores directly.** `src/services/storage.ts`
  owns it; stores persist through `usePersistedRef()` in `src/stores/persist.ts` with versioned,
  client-namespaced keys (`mybizgate:<client>:<name>:v1`).
- **Do not call backend APIs from UI components or stores.** Data flows
  components → Pinia stores → `src/services/*.service.ts` → repository interfaces in
  `src/services/repositories/`, with `Local*Repository` and `Api*Repository` implementations
  selected by `VITE_DATA_MODE` in `repositories/index.ts`.
- **Keep prototype and API modes compatible.** Any new repository method must be added to the
  interface and both implementations. The API contract is documented in `api.repository.ts`.
- **Maintain the TypeScript interfaces** in `src/types/`. Money is integer cents. Orders are
  submitted as `OrderDraft` and returned priced as `Order`.
- **Keep the frontend deployable as static files** on shared hosting: no SSR, no Node runtime in
  production, history-mode routing relies on `public/.htaccess`.
- Do not hard-code API URLs; use `src/config/env.ts`. Business data uses `VITE_API_BASE_URL`
  (client-api); files and images use `VITE_MEDIA_API_BASE_URL` (media-api) through
  `src/services/media.service.ts`. Never send uploads to client-api.
- `X-Client-Code` is an identifier only. Never treat it as authorisation.

## Where things live

- `src/layouts/DefaultLayout.vue` – sidebar (lg+), topbar, mobile bottom nav, floating cart bar,
  location section, footer, toast.
- `src/views/` – one component per route; routes in `src/router/index.ts`
  (`/`, `/catalogue`, `/category/:slug`, `/promosi`, `/kegemaran`, `/product/:slug`, `/cart`,
  `/checkout`, `/orders`, `/orders/:id`, `/account`).
- `src/components/catalogue|cart|checkout|orders|common/` – feature components. `AppIcon` holds
  the inline SVG set; `ProductArt` renders a photo or the generated packshot from
  `src/utils/packshot.ts` when `product.images` is empty.
- `src/services/media.service.ts` – Media API client (upload, replace, metadata, download, delete,
  list); `src/views/ApiTestView.vue` (`/api-test`) is the development test page for it.
- `src/services/pricing.ts` – quantity-tier unit price, delivery fee, availability helpers.
- `src/services/whatsapp-message.ts` – order/enquiry message text; `src/utils/whatsapp.ts` encodes
  the `wa.me` URL.
- `src/data/seed/` – local-mode categories and products.
- `index.html` uses `%CLIENT_*%` placeholders filled by the plugin in `vite.config.ts` from the
  client config, so SEO tags are never edited per client.
- Styling: Tailwind utilities plus a small `@layer components` set in `src/assets/css/main.css`
  (`btn-*`, `panel`, `field`, `chip`, `status`, `totals`). Brand colours are CSS variables
  (`--c-brand` …) applied by the client store, mapped in `tailwind.config.ts`.
- `legacy/static-index.html` – the original single-file site, reference only (not built).
- `site.config.yml` – MyBizGate platform metadata; keep contact details in sync with the TS config.

## Conventions

- Malay UI copy; keep existing wording unless asked.
- Mobile-first; preserve 44 px tap targets and the bottom nav / floating cart behaviour.
- Status values are the `OrderStatus` union; display labels come from `src/utils/order-status.ts`.
- The supplier back-office from the original prototype was intentionally not migrated; add it
  later as authenticated routes rather than reviving the old demo panel.

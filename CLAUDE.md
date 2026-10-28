# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Client website for **Lz Success Enterprise** (slug `lzhub`), one of the `clients/client-<slug>/` repos
managed by the MyBizGate platform. Workspace-wide rules live in `../../AGENTS.md` (Platform Rules section);
the ones that bite here: `dist/` is never committed, source stays unminified, this site may only deploy to
`public_html/clients/lzhub/`, and platform commands are dry-run unless `--apply` is passed.

The whole site is one buildless file: `index.html` (inline CSS in `<style>`, inline JS in one IIFE
`<script>`). There is no `script.js`, no `style.css`, no package.json, no test runner.

## Current state (important before editing)

- `index.html` is a byte-identical copy of `../../templates/supplier/catalogue-simple/index.html`
  (`.mybizgate/state.json` shows `personalized: 0`). It still carries the template's demo brand
  **"RuncitHub"** in the title, meta description, sidebar brand, WhatsApp message texts, the order-text
  header, the `RuncitHubDebug` window global, and the localStorage key `runcithub_single_app_v1`.
  Personalising it for Lz Success Enterprise is the outstanding work. Grep `RuncitHub|runcithub|RH-`
  to find every occurrence.
- Business facts (WhatsApp, phone, email, address, hours) are the source of truth in `site.config.yml`.
  The JS `CONFIG.phone` / `displayPhone` and the two hardcoded `wa.me/60192857371` links in the static
  HTML must stay in sync with `business.whatsapp` there.
- Brand assets live in `images/`: `lz-success-enterprise-logo-web.png` (720x240, used by the sidebar
  `.brand` and mobile `.header-brand` links via `.brandlogo`) and `fav.ico` (multi-size ICO, the
  `<link rel="icon">`). The build converts the PNG to WebP and rewrites the references in `dist/`.
- `__BUILD_VERSION__` is not used anywhere yet; add it to asset URLs if cache busting is wanted
  (it is only substituted in `dist/`).

## Commands

```bash
# Local preview (from this directory)
python3 -m http.server 8000        # open http://localhost:8000/

# Production build into dist/ (never commit dist/)
../../platform/bin/mybizgate build .
../../platform/bin/mybizgate qa dist        # validate the built output

# Status / health
../../platform/bin/mybizgate site-status lzhub
../../platform/bin/mybizgate verify lzhub

# Syntax-check the inline script (no standalone JS file exists)
sed -n '/^<script>/,/^<\/script>/p' index.html | sed '1s/^<script>//;$s/<\/script>.*$//' > /tmp/lzhub.js && node --check /tmp/lzhub.js

# Release: main = dev, deploy = production (push to deploy triggers GitHub Actions)
git checkout main && git push origin main
git checkout deploy && git merge --ff-only main && git push origin deploy

# Rollback
../../platform/bin/rollback.sh lzhub
```

Deployment is `.github/workflows/deploy.yml`, a thin caller of
`mybizgate/mybizgate-platform/.github/workflows/static-site-deploy.yml@v1.3.0`. Do not hand-edit the
pinned tag; upgrade with `../../platform/bin/mybizgate platform-ref lzhub --set vX.Y.Z --apply`.

## Architecture of index.html

A single-page, hash-routed, localStorage-backed wholesale catalogue prototype in Malay (`lang="ms"`).
Everything renders from one in-memory `db` object into `#main-content`; there is no server.

- **State**: `db` (persisted) holds `products`, `orders`, `notices`, `cart`, `favorites`, `watch`,
  `profile`, `readNotices`, `version:1`. `ui` (not persisted) holds the current page, filters, search,
  sort and the open modal. `seedDB()` builds demo data from the `raw` product array + `CATS`;
  `loadDB()` falls back to the seed if the stored shape is invalid; `persist()` writes back and
  surfaces a warning banner if storage fails. A `storage` event re-syncs across tabs.
- **Routing**: `ui.page` ↔ `location.hash`. `customerNav` and `adminNav` arrays define the pages;
  `isAdmin()` decides which shell (customer catalogue vs supplier back-office) is shown.
  `render()` → `renderShell()` (sidebar, topbar, mobile nav, floating cart) then one view function
  from the `views` map (`home`, `catalogPage`, `cartPage`, `ordersPage`, `noticesPage`,
  `accountPage`, `dashboard`, `inventory`, `broadcastPage`).
- **Events**: everything is delegated. One `document` `click` handler dispatches on `data-*`
  attributes (`data-page`, `data-plus`/`data-minus`, `data-detail`, `data-transition`, `data-edit`,
  `data-reset`, …); `input`/`change`/`submit` handlers key off element ids
  (`search-input`, `sort-select`, `checkout-form`, `product-form`). Add new controls by adding a
  `data-*` branch, not by attaching listeners in view functions (views are re-rendered as strings).
- **Money**: all prices are integer cents; `money()` formats as RM. `CONFIG` (frozen) holds
  `minOrder`, `freeDelivery`, `deliveryFee`, WhatsApp number and the storage key. Quantity-break
  pricing lives in `getUnitPrice()`.
- **Orders**: checkout builds an order, opens a prefilled `wa.me` link with `orderText(o)`, and stores
  it as status "Draf WhatsApp". Status flow is a fixed chain in `transitionOrder()`
  (Menunggu semakan → Disahkan → Diproses → Dihantar → Selesai), driven from the admin views.
- **Images**: products have no image files. `imageFor(p)` generates a data-URI SVG packshot from
  `label`, `shape`, `color`, `motif` (memoised in `imageCache`); admins can upload a PNG/JPEG/WebP
  via `loadProductImage()` which is stored as a data URI in `db`.
- **Theming**: CSS custom properties on `:root`; alternate palettes via `:root[data-theme="sunset"]`
  and `[data-theme="midnight"]`. `--tint` is set per product card.
- **Security/XSS**: every interpolated value goes through `esc()`; keep doing that in any new
  template string. `downloadCSV()` neutralises formula-injection prefixes.
- **A11y already in place**: skip link, `aria-label`s, focus trap + Escape in the modal, `/` focuses
  search, `focus-visible` outlines. Preserve these when restyling.

## Working on this repo

- Keep the compact one-statement-per-line style of the existing file; it is intentionally dense.
- The file is ~148 KB on 289 lines, so read it in targeted ranges (CSS is lines 3–32, static HTML
  34–62, JS 63–289) rather than whole.
- Do not commit `fav.ico`/logo changes together with unrelated edits; call out contact-detail or
  WhatsApp-message changes in commit messages (they are user-facing and must match `site.config.yml`).

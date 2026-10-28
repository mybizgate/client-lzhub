# LZHub — Vue 3 Migration

## Objective

Convert the existing static LZ Success Enterprise website into a production-ready frontend application using:

- Vue 3
- Vite
- TypeScript
- Pinia
- Vue Router
- Tailwind CSS

The existing project is located at:

```text
client-lzhub/
```

Current structure:

```text
.
├── CLAUDE.md
├── dist
├── images
├── index.html
├── README.md
└── site.config.yml
```

The current static website is already working.

DO NOT redesign the website unnecessarily.

The existing site should be treated as the visual and functional reference.

Preserve:

- branding
- content
- catalogue
- product images
- business information
- mobile layout
- existing useful UX
- Malay language labels
- LZ Success Enterprise identity
- tagline: "Pengedar Produk IKS Tempatan"

---

# Deployment Architecture

Production frontend:

```text
https://lzhub.mybizgate.com/
```

Future shared backend:

```text
https://api-client.mybizgate.com/
```

The frontend and backend use the same parent domain but different subdomains.

The Laravel backend does NOT exist yet.

DO NOT implement Laravel in this task.

However, architect the Vue application so switching from prototype/local mode to Laravel REST API mode requires minimal frontend changes.

---

# Multi-Tenant Architecture

LZHub is one client deployment under MyBizGate.

Client code:

```text
lzhub
```

Environment variable:

```env
VITE_CLIENT_CODE=lzhub
```

The frontend should be reusable as the base architecture for other MyBizGate supplier clients.

Examples:

```text
lzhub.mybizgate.com
hardware.mybizgate.com
fishsupplier.mybizgate.com
groceries.mybizgate.com
```

Each client can have:

- different logo
- business name
- theme
- contact information
- categories
- products
- product images
- WhatsApp number
- ordering rules
- minimum order
- delivery information

DO NOT hard-code these values inside reusable Vue components.

Client-specific information must come from configuration/data.

---

# Architecture Principle

Use this architecture:

```text
Vue Components
       ↓
Pinia Stores
       ↓
Services
       ↓
Repository abstraction
      ↙       ↘
Local Mode   API Mode
```

The Vue components must NOT know whether data comes from localStorage or Laravel.

Pinia stores must NOT directly implement backend HTTP logic.

Create a clean service/repository abstraction.

---

# Data Modes

Support two modes.

## Prototype Mode

```env
VITE_DATA_MODE=local
```

Use:

- Pinia
- localStorage
- local seed data

All major frontend processes must actually work.

Examples:

- browse categories
- browse products
- product details
- cart
- update quantity
- remove cart items
- checkout/order preparation
- customer information
- order history where applicable
- local configuration
- WhatsApp enquiry/order integration

Refresh must not unexpectedly destroy persisted user state.

---

## API Mode

Future mode:

```env
VITE_DATA_MODE=api
```

API URL:

```env
VITE_API_BASE_URL=https://api-client.mybizgate.com/api/v1
```

Do NOT build the real Laravel backend yet.

Create API repository/service placeholders that follow the same TypeScript interfaces used by Local Mode.

Example:

```text
catalogue.repository.ts

LocalCatalogueRepository
ApiCatalogueRepository
```

Both should implement equivalent methods such as:

```text
getCategories()
getProducts()
getProduct()
searchProducts()
```

Do the same concept where appropriate for:

```text
orders
customers
cart
business configuration
```

---

# Recommended Project Structure

Refactor toward:

```text
client-lzhub/
├── public/
│   ├── fav.ico
│   ├── logo.png
│   └── images/
│
├── src/
│   ├── App.vue
│   ├── main.ts
│   │
│   ├── assets/
│   │   └── css/
│   │
│   ├── components/
│   │   ├── common/
│   │   ├── catalogue/
│   │   ├── cart/
│   │   └── checkout/
│   │
│   ├── layouts/
│   │   └── DefaultLayout.vue
│   │
│   ├── views/
│   │   ├── HomeView.vue
│   │   ├── CatalogueView.vue
│   │   ├── ProductView.vue
│   │   ├── CartView.vue
│   │   └── CheckoutView.vue
│   │
│   ├── router/
│   │   └── index.ts
│   │
│   ├── stores/
│   │   ├── client.ts
│   │   ├── catalogue.ts
│   │   ├── cart.ts
│   │   └── order.ts
│   │
│   ├── services/
│   │   ├── http.ts
│   │   ├── catalogue.service.ts
│   │   ├── order.service.ts
│   │   └── repositories/
│   │       ├── catalogue.repository.ts
│   │       ├── local.repository.ts
│   │       └── api.repository.ts
│   │
│   ├── config/
│   │   ├── site.config.ts
│   │   └── env.ts
│   │
│   ├── types/
│   │   ├── client.ts
│   │   ├── product.ts
│   │   ├── category.ts
│   │   └── order.ts
│   │
│   └── data/
│       └── seed/
│           ├── categories.ts
│           └── products.ts
│
├── .env.example
├── .env.development
├── .env.production
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── README.md
└── CLAUDE.md
```

Adapt this structure where necessary rather than blindly creating empty directories.

---

# Client Configuration

Create a central client configuration.

Example:

```ts
export interface ClientConfig {
  code: string
  businessName: string
  tagline: string
  logo: string
  favicon: string

  contact: {
    phone?: string
    whatsapp?: string
    email?: string
    address?: string
  }

  ordering: {
    minimumOrder?: number
    currency: string
    allowWhatsappOrder: boolean
  }

  branding: {
    primaryColor?: string
    secondaryColor?: string
  }
}
```

LZ-specific values must be stored in configuration rather than scattered throughout Vue components.

---

# Environment Configuration

Create:

```env
VITE_CLIENT_CODE=lzhub
VITE_DATA_MODE=local
VITE_API_BASE_URL=https://api-client.mybizgate.com/api/v1
```

Provide:

```text
.env.example
```

Do not hard-code API URLs.

---

# Tenant Identification

Prepare the HTTP service to send the client code when API mode is eventually enabled.

Example concept:

```http
X-Client-Code: lzhub
```

However:

Do NOT rely on this header for authorization/security.

The future Laravel backend must perform proper tenant authorization.

The header is only an identifier for public/client context.

---

# Authentication Preparation

Do NOT implement full authentication unless already required by the current UI.

However, structure the application so authentication can later be added cleanly.

Future backend:

```text
Laravel
MariaDB
api-client.mybizgate.com
```

The implementation should support adding:

- customer login
- staff login
- token/session authentication
- role-based access

without major restructuring.

---

# Pinia Requirements

Use Pinia for application state.

Recommended stores:

```text
clientStore
catalogueStore
cartStore
orderStore
```

Persist only appropriate state.

Examples:

Persist:

```text
cart
draft customer information
draft order
selected options
```

Do not blindly persist every Pinia state property.

Use versioned localStorage keys.

Example:

```text
mybizgate:lzhub:cart:v1
mybizgate:lzhub:order:v1
```

This prevents data collision between MyBizGate clients.

---

# Product Model

Create reusable TypeScript interfaces.

Product should support fields useful for supplier businesses.

Example:

```ts
interface Product {
  id: string
  sku?: string
  name: string
  slug: string
  description?: string
  categoryId: string
  images: string[]
  unit: string
  price?: number
  wholesalePrice?: number
  minimumQuantity?: number
  stockStatus?: string
  featured?: boolean
  active: boolean
}
```

Do not make the frontend dependent specifically on only one type of supplier.

It should later be adaptable to:

- local IKS product distributor
- hardware supplier
- grocery supplier
- frozen food supplier
- fish supplier
- restaurant supplier
- wholesale supplier

---

# Category Model

Categories must be data-driven.

Example:

```ts
interface Category {
  id: string
  name: string
  slug: string
  description?: string
  image?: string
  active: boolean
  sortOrder?: number
}
```

---

# Ordering

Current ordering is prototype/manual.

There is NO payment gateway integration yet.

Do not fake payment gateway integration.

Current flow may support:

```text
catalogue
→ cart
→ customer/order information
→ confirmation
→ WhatsApp/manual submission
```

Design the order interface so Laravel can later submit:

```http
POST /api/v1/orders
```

without changing the UI architecture.

---

# WhatsApp

Keep WhatsApp functionality configurable.

Do not hard-code the number inside Vue components.

Use client configuration.

Generate properly encoded WhatsApp messages.

The message may include:

- customer
- products
- quantities
- total where available
- delivery/pickup information
- order reference

---

# Responsive Design

Mobile is a priority.

Design mobile-first.

The application must work correctly on:

```text
360px
375px
390px
430px
768px
1024px+
```

Do not simply shrink the desktop layout.

Important mobile elements such as:

- cart
- navigation
- product quantity
- checkout
- WhatsApp action

must remain easy to use.

---

# Tailwind CSS

Use Tailwind CSS as the styling system.

Avoid excessive inline CSS.

Create reusable UI patterns.

Avoid installing large UI libraries unless genuinely necessary.

Maintain the existing brand/design while improving consistency where appropriate.

---

# Vue Router

Use proper Vue Router routes.

Recommended initial routes:

```text
/
/catalogue
/category/:slug
/product/:slug
/cart
/checkout
```

Use route-level lazy loading where useful.

---

# SEO

This is a Vite SPA, but still apply reasonable SEO practices.

Include:

- proper title
- meta description
- Open Graph metadata
- favicon
- semantic HTML
- product/category headings
- alt text
- clean route naming

Do NOT add SSR/Nuxt in this task.

The application must remain Vue 3 + Vite.

---

# Images

Reuse existing images wherever possible.

Move static production assets appropriately into:

```text
public/images/
```

or:

```text
src/assets/
```

depending on how they are consumed.

Do not duplicate images unnecessarily.

Optimize oversized assets where reasonable.

---

# Current Files

Review these before migration:

```text
index.html
site.config.yml
README.md
CLAUDE.md
images/
dist/
```

Extract existing content/configuration from these files.

Do not discard useful existing business information.

---

# Build

The following must succeed:

```bash
npm install
npm run dev
npm run build
```

Production build output:

```text
dist/
```

Ensure the generated `dist` can be uploaded to the document root for:

```text
https://lzhub.mybizgate.com/
```

---

# Shared Hosting Compatibility

The production frontend is static.

Do NOT require a permanent Node.js process to serve the Vue frontend.

Node/npm is only required for:

```text
development
build
CI/CD
```

Production should serve the generated:

```text
dist/
```

using the existing web server.

---

# Backend Preparation

Future architecture:

```text
lzhub.mybizgate.com
        ↓
Vue 3
        ↓
REST API
        ↓
api-client.mybizgate.com
        ↓
Laravel
        ↓
MariaDB
```

Prepare for this architecture but DO NOT implement the Laravel backend now.

---

# CORS Awareness

Because:

```text
https://lzhub.mybizgate.com
```

and:

```text
https://api-client.mybizgate.com
```

are separate origins, the future Laravel backend will require correct CORS configuration.

Do not attempt to solve Laravel CORS in this frontend migration.

Document this requirement in README.md.

---

# README

Update README.md with:

1. project purpose
2. technology stack
3. local development
4. production build
5. environment configuration
6. local prototype mode
7. future API mode
8. client configuration
9. how to create another supplier client from this project
10. deployment to MyBizGate hosting
11. future Laravel integration

Add a section:

```text
Creating Another Client
```

Explain that business-specific values must be changed through configuration/data rather than by modifying shared components.

---

# CLAUDE.md

Update CLAUDE.md with architectural rules.

Important rules:

```text
Do not hard-code client data in reusable components.
Do not call localStorage directly from UI components.
Do not call backend APIs directly from UI components.
Use Pinia + service/repository layers.
Maintain TypeScript interfaces.
Keep prototype and API modes compatible.
Keep frontend suitable for static shared hosting deployment.
```

---

# Migration Strategy

Do not replace everything blindly.

Follow this sequence:

1. Inspect existing site.
2. Identify reusable sections.
3. Extract business configuration.
4. Create Vue/Vite project structure.
5. Convert existing sections into Vue components.
6. Introduce router.
7. Introduce Pinia.
8. Implement prototype persistence.
9. Introduce repository abstraction.
10. Add future API repository stubs.
11. Configure Tailwind.
12. Migrate assets.
13. Verify responsive UI.
14. Build production dist.
15. Update README.md.
16. Update CLAUDE.md.

---

# Quality Requirements

Before completion:

Run:

```bash
npm run build
```

Fix all build errors.

Check for:

```text
TypeScript errors
broken imports
missing images
broken routes
hard-coded client information
hard-coded API URLs
console errors
localStorage collisions
mobile overflow
```

Do not leave placeholder TODOs for functionality that is expected to work in prototype mode.

---

# Final Goal

At the end of this task:

```text
LZHub
```

must be a fully working Vue 3 + Vite + Pinia + Tailwind frontend.

Prototype mode must work completely without Laravel.

The frontend must also be architecturally ready to connect to:

```text
https://api-client.mybizgate.com/
```

when the Laravel + MariaDB backend is developed in the next stage.

The frontend architecture should be reusable as the foundation for future MyBizGate supplier clients without tightly coupling shared components to LZ Success Enterprise.

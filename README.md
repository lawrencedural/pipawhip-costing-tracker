# Pipa Whip — Inventory & Costing

React + TypeScript + Supabase port of the original single-file HTML app. Same
look and business logic, but data now lives in Postgres via Supabase instead
of `localStorage`, so it's shared across devices/users.

## Stack

- **Vite + React 18 + TypeScript**
- **Supabase** (`@supabase/supabase-js`) for the database and (optionally) auth
- Plain CSS — the original stylesheet, unchanged, in `src/styles.css`

## Project layout

```
src/
  App.tsx                 – top-level layout + section switch
  supabaseClient.ts        – Supabase client init
  types.ts                 – shared TS types matching the DB schema
  lib/calculations.ts      – pure costing math (batch cost, cost/tub, margin)
  hooks/
    useInventory.ts        – CRUD + stock adjustments for inventory_items
    useProducts.ts         – CRUD for products + product_ingredients
  components/
    TopBar.tsx
    InventorySection.tsx
    ProductGrid.tsx
    ProductDetail.tsx
    CostingSection.tsx
    modals/
      InventoryModal.tsx
      ProductModal.tsx
      IngredientModal.tsx
supabase/
  schema.sql               – tables, RLS policies, and the original demo/seed data
```

## Database schema

Three tables, mirroring the shape of the old in-memory `state` object:

- `inventory_items` — ingredient catalog (price, package size, UOM, stock)
- `products` — costing sheets (batch size, selling price, other costs)
- `product_ingredients` — line items in a product's recipe, each optionally
  linked back to `inventory_items.id` via `inventory_item_id`

Run `supabase/schema.sql` in the Supabase SQL editor (or `supabase db push`)
on a fresh project. It creates the tables, enables Row Level Security with
policies scoped to `authenticated` users, and inserts the same demo data the
original app shipped with (seeded ingredients, Banana Biscoff Grahams, Mango
Grahams).

> The default policies allow any authenticated user full read/write access —
> fine for a small internal tool with one shared login. If you need separate
> accounts that can't see each other's data, add a `user_id` column to each
> table and scope the policies to `auth.uid()`.

## Setup

```bash
npm install
cp .env.example .env
# then fill in your Supabase project URL + anon key
npm run dev
```

Get the URL/anon key from your Supabase project's **Settings → API** page.

If you want to require login before the app is usable, enable email/password
or magic-link auth in Supabase and wrap `<App />` with a simple auth gate —
the RLS policies already assume `auth.role() = 'authenticated'`.

## Build

```bash
npm run build   # type-checks with tsc -b, then builds with vite
npm run preview # serve the production build locally
```

## Notes on the migration

- All costing math (`ingrBatchCost`, `ingrCostPerTub`, margin %, break-even)
  was ported 1:1 into `src/lib/calculations.ts` as pure, testable functions.
- Stock +/- buttons now write straight to Supabase with an optimistic local
  update, reverting on failure.
- The ingredient-qty field in the recipe table commits on blur (rather than
  on every keystroke) to avoid a write per character.
- IDs are Postgres `uuid` (`gen_random_uuid()`) instead of the old
  timestamp+random `uid()` helper.

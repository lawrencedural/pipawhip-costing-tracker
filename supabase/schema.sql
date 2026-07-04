-- Pipa Whip — Inventory & Costing
-- Run this in the Supabase SQL editor (or via `supabase db push`).

create extension if not exists "pgcrypto";

-- ── Inventory ────────────────────────────────────────────────
create table if not exists inventory_items (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  brand       text default '',
  vendor      text default '',
  price       numeric(12,2) not null default 0,
  pkg_size    numeric(12,2) not null default 1,
  uom         text not null default 'GRAMS',
  stock       integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ── Products (costing sheets) ───────────────────────────────
create table if not exists products (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  size           text default '',
  emoji          text default '🍨',
  batch_size     numeric(12,2) not null default 10,
  selling_price  numeric(12,2) not null default 0,
  other_costs    numeric(12,2) not null default 5,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- ── Ingredients used within a product's recipe ─────────────
create table if not exists product_ingredients (
  id                 uuid primary key default gen_random_uuid(),
  product_id         uuid not null references products(id) on delete cascade,
  inventory_item_id  uuid references inventory_items(id) on delete set null,
  name               text not null,
  unit_price         numeric(12,2) not null default 0,
  pkg_size           numeric(12,2) not null default 1,
  pkg_uom            text not null default 'GRAMS',
  qty                numeric(12,2) not null default 0,
  qty_uom            text not null default 'GRAMS',
  note               text default '',
  sort_order         integer not null default 0,
  created_at         timestamptz not null default now()
);

create index if not exists idx_product_ingredients_product_id on product_ingredients(product_id);

-- ── updated_at triggers ──────────────────────────────────────
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_inventory_items_updated_at on inventory_items;
create trigger trg_inventory_items_updated_at
  before update on inventory_items
  for each row execute function set_updated_at();

drop trigger if exists trg_products_updated_at on products;
create trigger trg_products_updated_at
  before update on products
  for each row execute function set_updated_at();

-- ── Row Level Security ───────────────────────────────────────
-- These policies allow full access to any authenticated user, which fits a
-- small internal team tool. Tighten to per-user ownership if you add auth
-- with multiple separate accounts/tenants.
alter table inventory_items enable row level security;
alter table products enable row level security;
alter table product_ingredients enable row level security;

create policy "authenticated read inventory" on inventory_items
  for select using (auth.role() = 'authenticated');
create policy "authenticated write inventory" on inventory_items
  for insert with check (auth.role() = 'authenticated');
create policy "authenticated update inventory" on inventory_items
  for update using (auth.role() = 'authenticated');
create policy "authenticated delete inventory" on inventory_items
  for delete using (auth.role() = 'authenticated');

create policy "authenticated read products" on products
  for select using (auth.role() = 'authenticated');
create policy "authenticated write products" on products
  for insert with check (auth.role() = 'authenticated');
create policy "authenticated update products" on products
  for update using (auth.role() = 'authenticated');
create policy "authenticated delete products" on products
  for delete using (auth.role() = 'authenticated');

create policy "authenticated read product_ingredients" on product_ingredients
  for select using (auth.role() = 'authenticated');
create policy "authenticated write product_ingredients" on product_ingredients
  for insert with check (auth.role() = 'authenticated');
create policy "authenticated update product_ingredients" on product_ingredients
  for update using (auth.role() = 'authenticated');
create policy "authenticated delete product_ingredients" on product_ingredients
  for delete using (auth.role() = 'authenticated');

-- ── Seed data (matches the original app's starting demo data) ─
insert into inventory_items (name, brand, vendor, price, pkg_size, uom, stock) values
  ('All Purpose Cream (Nestlé)', 'Nestlé', 'South Supermarket', 72, 250, 'ML', 4),
  ('Condensed Milk (Alaska)', 'Alaska', 'South Supermarket', 70.50, 387, 'GRAMS', 3),
  ('Biscoff Cookies (Lotus)', 'Lotus', 'South Supermarket', 200, 34, 'PCS', 2),
  ('Graham Crackers (M.Y. San)', 'M.Y. San', 'South Supermarket', 79, 210, 'GRAMS', 5),
  ('Crushed Grahams (M.Y. San)', 'M.Y. San', 'South Supermarket', 63, 200, 'GRAMS', 3),
  ('Banana (Cavendish)', 'Cavendish', 'Palengke', 140, 1, 'KG', 0),
  ('Mango Puree (Orchard Squeeze)', 'Orchard Squeeze', 'AAB', 70.50, 200, 'ML', 2),
  ('Mango Fruit', '', 'Palengke', 50, 1, 'PC', 0),
  ('Food-Grade Container Plastic', 'RSY Packaging', 'Lazada', 268, 50, 'PCS', 50),
  ('Choco Chip', 'AAB', 'AAB', 147, 500, 'GRAMS', 1),
  ('White Choco Chip', 'AAB', 'AAB', 135, 500, 'GRAMS', 1),
  ('Kataifi', 'Backerei', 'Wonderbake', 990, 1, 'KG', 0),
  ('Unsalted Butter', 'Arla', 'AAB', 215, 200, 'GRAMS', 2),
  ('Pistachio Nuts', 'AAB', 'AAB', 720, 250, 'GRAMS', 1),
  ('Goya Cocoa Powder', 'Goya', 'SM Supermarket', 359.50, 350, 'GRAMS', 1),
  ('Baking Soda', 'Ferna', 'SM Supermarket', 42.50, 250, 'GRAMS', 3)
on conflict do nothing;

do $$
declare
  banana_id uuid;
  mango_id uuid;
begin
  insert into products (name, size, emoji, batch_size, selling_price, other_costs)
  values ('Banana Biscoff Grahams', '500ml tubs', '🍌', 10, 130, 5)
  returning id into banana_id;

  insert into product_ingredients (product_id, name, unit_price, pkg_size, pkg_uom, qty, qty_uom, note, sort_order) values
  (banana_id, 'All Purpose Cream (Nestlé)', 72, 1, 'PACK', 4, 'PACKS', '4 packs × ₱72 per pack', 0),
  (banana_id, 'Mashed Banana (Cavendish)', 140, 8, 'PCS', 8, 'PCS', '₱140/8pcs × 1 bunch', 1),
  (banana_id, 'Condensed Milk (Alaska)', 70.50, 1, 'CAN', 1, 'CAN', '1 full can × ₱70.50', 2),
  (banana_id, 'Graham Crackers (M.Y. San)', 79, 21, 'PCS', 20, 'PCS', '2pcs/tub × 10 tubs', 3),
  (banana_id, 'Biscoff Biscuits (Lotus)', 195, 34, 'PCS', 60, 'PCS', '6pcs/tub × 10 tubs', 4),
  (banana_id, 'Crushed Grahams (M.Y. San)', 63, 200, 'GRAMS', 150, 'GRAMS', '15g/tub × 10 tubs', 5);

  insert into products (name, size, emoji, batch_size, selling_price, other_costs)
  values ('Mango Grahams', '280ml tubs', '🥭', 2, 100, 5)
  returning id into mango_id;

  insert into product_ingredients (product_id, name, unit_price, pkg_size, pkg_uom, qty, qty_uom, note, sort_order) values
  (mango_id, 'All Purpose Cream (Nestlé)', 72, 250, 'GRAMS', 170, 'GRAMS', '₱72/250g × 170g', 0),
  (mango_id, 'Condensed Milk (Alaska)', 70.50, 387, 'GRAMS', 80, 'GRAMS', '₱70.50/387g can × 80g', 1),
  (mango_id, 'Mango Puree (Orchard Squeeze)', 70.50, 200, 'ML', 40, 'ML', '₱70.50/200mL × 40mL', 2),
  (mango_id, 'Mango Fruit', 50, 1, 'PC', 1, 'PC', '₱50 per piece × 1pc', 3),
  (mango_id, 'Graham Crackers (M.Y. San)', 79, 21, 'PCS', 8, 'PCS', '₱79/21pcs × 8pcs', 4);
end $$;

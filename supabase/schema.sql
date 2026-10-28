-- Snap Slide — esquema para conectar el backend real (Supabase / Postgres).
-- Replica el modelo de src/lib/types.ts y aplica las reglas de permisos en la base
-- de datos con Row Level Security: la "visión túnel" del vendedor no depende del frontend.

create type user_role as enum ('owner', 'seller');
create type product_type as enum ('sheet', 'liquid');
create type sale_status as enum ('pending', 'paid', 'shipped');
create type payment_method as enum ('transfer', 'check', 'card', 'cash');
create type movement_type as enum ('in', 'out', 'sale');

create table profiles (
  id uuid primary key references auth.users on delete cascade,
  name text not null,
  role user_role not null default 'seller',
  monthly_goal numeric(12,2),
  commission_rate numeric(5,4)
);

create table products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sku text not null unique,
  type product_type not null,
  cost numeric(12,2) not null,           -- solo Owners (ver vista products_public)
  price numeric(12,2) not null,
  min_stock integer not null default 0,  -- punto de reorden
  presentation text
);

create table lots (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products on delete cascade,
  code text not null,
  quantity integer not null check (quantity >= 0),
  expires_at date not null,
  received_at date not null default current_date,
  unique (product_id, code)
);

create table clients (
  id uuid primary key default gen_random_uuid(),
  company text not null,
  contact text, phone text, email text,
  address text, city text default 'Miami', zip text,
  seller_id uuid not null references profiles,
  payment_terms integer not null default 30,
  created_at date not null default current_date
);

create table sales (
  id uuid primary key default gen_random_uuid(),
  number text not null unique,
  client_id uuid not null references clients,
  seller_id uuid not null references profiles default auth.uid(),
  date date not null default current_date,
  due_date date not null,
  status sale_status not null default 'pending',
  paid_at date,
  notes text
);

create table sale_items (
  sale_id uuid not null references sales on delete cascade,
  product_id uuid not null references products,
  quantity integer not null check (quantity > 0),
  unit_price numeric(12,2) not null,
  primary key (sale_id, product_id)
);

create table payments (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references sales on delete cascade,
  client_id uuid not null references clients,
  amount numeric(12,2) not null,
  date date not null default current_date,
  method payment_method not null
);

create table movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products,
  lot_code text not null,
  type movement_type not null,
  reason text not null,
  quantity integer not null,
  date date not null default current_date,
  user_id uuid not null references profiles default auth.uid(),
  note text
);

create table expenses (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  category text not null,
  amount numeric(12,2) not null,
  description text
);

-- ───────── Permisos (RLS) ─────────
create function is_owner() returns boolean language sql stable security definer as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'owner');
$$;

alter table profiles enable row level security;
alter table products enable row level security;
alter table lots enable row level security;
alter table clients enable row level security;
alter table sales enable row level security;
alter table sale_items enable row level security;
alter table payments enable row level security;
alter table movements enable row level security;
alter table expenses enable row level security;

-- Perfiles: cada uno ve el suyo; Owners ven todos.
create policy profiles_read on profiles for select using (id = auth.uid() or is_owner());

-- Catálogo: todos leen; solo Owners escriben. El costo se oculta a vendedores con una vista.
create policy products_read on products for select using (auth.uid() is not null);
create policy products_write on products for all using (is_owner()) with check (is_owner());
create view products_public with (security_invoker = true) as
  select id, name, sku, type, price, min_stock, presentation from products;
revoke select (cost) on products from authenticated;
-- Los Owners leen el costo desde el backend con una función security definer o rol de servicio.

create policy lots_read on lots for select using (auth.uid() is not null);
create policy lots_write on lots for all using (is_owner()) with check (is_owner());

-- Clientes: base compartida para generar pedidos; solo Owners editan.
create policy clients_read on clients for select using (auth.uid() is not null);
create policy clients_write on clients for all using (is_owner()) with check (is_owner());

-- Ventas: VISIÓN TÚNEL. El vendedor solo ve, crea y edita sus propias órdenes.
create policy sales_read on sales for select using (seller_id = auth.uid() or is_owner());
create policy sales_insert on sales for insert with check (seller_id = auth.uid() or is_owner());
create policy sales_update on sales for update using (seller_id = auth.uid() or is_owner());

create policy sale_items_rw on sale_items for all
  using (exists (select 1 from sales s where s.id = sale_id and (s.seller_id = auth.uid() or is_owner())))
  with check (exists (select 1 from sales s where s.id = sale_id and (s.seller_id = auth.uid() or is_owner())));

create policy payments_read on payments for select
  using (exists (select 1 from sales s where s.id = sale_id and (s.seller_id = auth.uid() or is_owner())));
create policy payments_write on payments for insert
  with check (exists (select 1 from sales s where s.id = sale_id and (s.seller_id = auth.uid() or is_owner())));

-- Inventario y finanzas: solo Owners.
create policy movements_owner on movements for all using (is_owner()) with check (is_owner());
create policy expenses_owner on expenses for all using (is_owner()) with check (is_owner());

-- TODO: función transaccional create_sale(client_id, items jsonb) que descuente lotes en
-- orden FEFO (ver consumeFEFO en src/lib/business.ts) dentro de una sola transacción.

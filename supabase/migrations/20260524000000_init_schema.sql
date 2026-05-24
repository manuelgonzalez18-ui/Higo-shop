-- Higo Shop Database Schema Initialization
-- Migration: 20260524000000_init_schema.sql
-- Target: Supabase (PostgreSQL)

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ====================================================================
-- 1. PROFILES TABLE (Linked with auth.users)
-- ====================================================================

create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  name text not null,
  phone text,
  role text not null default 'customer' check (role in ('customer', 'merchant', 'driver')),
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable RLS
alter table public.profiles enable row level security;

-- Profiles RLS Policies
create policy "Allow public read access to profiles" 
  on public.profiles for select 
  using (true);

create policy "Allow individual write access to own profile" 
  on public.profiles for update 
  using (auth.uid() = id);

-- Trigger to automatically create a profile on user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, phone, role, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', 'Usuario Higo'),
    new.raw_user_meta_data->>'phone',
    coalesce(new.raw_user_meta_data->>'role', 'customer'),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ====================================================================
-- 2. STORES TABLE
-- ====================================================================

create table public.stores (
  id uuid default gen_random_uuid() primary key,
  owner_id uuid references public.profiles(id) on delete set null,
  name text not null,
  category text not null check (category in ('restaurant', 'pharmacy', 'bakery', 'grocery', 'cafe')),
  description text,
  image_url text,
  rating numeric(3,2) default 5.00 check (rating >= 1.00 and rating <= 5.00),
  review_count integer default 0 check (review_count >= 0),
  delivery_time text default '20-30 min',
  latitude double precision not null,
  longitude double precision not null,
  address text not null,
  phone text not null,
  is_open boolean not null default true,
  open_hours text default '8:00 AM - 10:00 PM',
  pago_movil jsonb not null, -- { phone: string, bank: string, cedula: string, holder: string }
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable RLS
alter table public.stores enable row level security;

-- Stores RLS Policies
create policy "Allow public read access to stores"
  on public.stores for select
  using (true);

create policy "Allow store owners to insert/update their stores"
  on public.stores for all
  using (
    auth.uid() in (
      select id from public.profiles where role = 'merchant' and id = owner_id
    )
  );


-- ====================================================================
-- 3. PRODUCTS TABLE
-- ====================================================================

create table public.products (
  id uuid default gen_random_uuid() primary key,
  store_id uuid references public.stores(id) on delete cascade not null,
  name text not null,
  description text,
  price numeric(10,2) not null check (price >= 0),
  category text not null, -- e.g. "Arepas", "Bebidas"
  image_url text,
  available boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable RLS
alter table public.products enable row level security;

-- Products RLS Policies
create policy "Allow public read access to products"
  on public.products for select
  using (true);

create policy "Allow store owners to manage products in their stores"
  on public.products for all
  using (
    auth.uid() in (
      select owner_id from public.stores where id = store_id
    )
  );


-- ====================================================================
-- 4. DRIVERS TABLE
-- ====================================================================

create table public.drivers (
  id uuid references public.profiles(id) on delete cascade primary key,
  vehicle text not null check (vehicle in ('Moto', 'Carro')),
  latitude double precision,
  longitude double precision,
  available boolean not null default true,
  rating numeric(3,2) default 5.00 check (rating >= 1.00 and rating <= 5.00),
  pago_movil jsonb not null, -- { phone: string, bank: string, cedula: string, holder: string }
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable RLS
alter table public.drivers enable row level security;

-- Drivers RLS Policies
create policy "Allow public read access to drivers"
  on public.drivers for select
  using (true);

create policy "Allow drivers to update their own record"
  on public.drivers for update
  using (auth.uid() = id);


-- ====================================================================
-- 5. ORDERS TABLE (Smart Payment Split)
-- ====================================================================

create table public.orders (
  id uuid default gen_random_uuid() primary key,
  customer_id uuid references public.profiles(id) on delete set null not null,
  store_id uuid references public.stores(id) on delete set null not null,
  driver_id uuid references public.profiles(id) on delete set null,
  status text not null default 'PENDING_PAYMENT' check (
    status in (
      'PENDING_PAYMENT',
      'PAYMENT_VERIFIED',
      'PREPARING',
      'READY_TO_DISPATCH',
      'DRIVER_ASSIGNED',
      'PICKED_UP',
      'DELIVERED',
      'CANCELLED'
    )
  ),
  total numeric(10,2) not null check (total >= 0),
  delivery_fee numeric(10,2) not null check (delivery_fee >= 0),
  items jsonb not null, -- Array of products: [{ id, name, quantity, price }]
  payment_method text not null check (payment_method in ('cash', 'pago_movil')), -- driver payment method
  payment_status text not null default 'PENDING' check (payment_status in ('PENDING', 'PAID', 'REFUNDED')),
  reference_number text, -- Pago Móvil reference number for store payment
  delivery_address text not null,
  delivery_latitude double precision not null,
  delivery_longitude double precision not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable RLS
alter table public.orders enable row level security;

-- Orders RLS Policies
create policy "Allow customers to manage their own orders"
  on public.orders for all
  using (auth.uid() = customer_id);

create policy "Allow merchants to read/update orders for their stores"
  on public.orders for all
  using (
    auth.uid() in (
      select owner_id from public.stores where id = store_id
    )
  );

create policy "Allow drivers to view dispatchable or their assigned orders"
  on public.orders for all
  using (
    status = 'READY_TO_DISPATCH' 
    or auth.uid() = driver_id
  );


-- ====================================================================
-- 6. REALTIME REPLICATION ENABLEMENT
-- ====================================================================

begin;
  -- remove the publication if it exists (Supabase might already have it)
  -- and recreate it or add our tables to supabase_realtime
  alter publication supabase_realtime add table public.orders;
  alter publication supabase_realtime add table public.drivers;
commit;


-- ====================================================================
-- 7. SEED DATA (Caracas mock defaults for initial setup)
-- ====================================================================

-- 1. Example Store: Arepera La Reina
insert into public.stores (
  name, category, description, rating, review_count, delivery_time,
  latitude, longitude, address, phone, is_open, open_hours, pago_movil
) values (
  'Arepera La Reina', 
  'restaurant', 
  'Las mejores arepas rellenas de Caracas con sabor tradicional.', 
  4.8, 
  142, 
  '20-30 min',
  10.4985, 
  -66.8872, 
  'Av. Francisco de Miranda, Altamira, Caracas', 
  '0412-1111111', 
  true, 
  '7:00 AM - 11:00 PM',
  '{"phone": "04121111111", "bank": "Banesco", "cedula": "V-12345678", "holder": "Arepera La Reina C.A."}'
) on conflict do nothing;

-- 2. Example Store: Farmacia San Ignacio
insert into public.stores (
  name, category, description, rating, review_count, delivery_time,
  latitude, longitude, address, phone, is_open, open_hours, pago_movil
) values (
  'Farmacia San Ignacio', 
  'pharmacy', 
  'Medicamentos, higiene personal y atención farmacéutica 24/7.', 
  4.9, 
  85, 
  '15-25 min',
  10.4902, 
  -66.9015, 
  'Centro Comercial San Ignacio, Chacao, Caracas', 
  '0412-2222222', 
  true, 
  '24 Horas',
  '{"phone": "04122222222", "bank": "Banco Mercantil", "cedula": "J-876543210", "holder": "Droguería San Ignacio"}'
) on conflict do nothing;

-- 3. Example Store: Panadería La Guadalupe
insert into public.stores (
  name, category, description, rating, review_count, delivery_time,
  latitude, longitude, address, phone, is_open, open_hours, pago_movil
) values (
  'Panadería La Guadalupe', 
  'bakery', 
  'Pan fresco, cachitos, pastelería fina y café recién molido.', 
  4.7, 
  210, 
  '15-30 min',
  10.4854, 
  -66.8621, 
  'Calle Madrid, Las Mercedes, Caracas', 
  '0412-3333333', 
  true, 
  '6:00 AM - 9:00 PM',
  '{"phone": "04123333333", "bank": "Provincial", "cedula": "V-99999999", "holder": "Panificadora Guadalupe"}'
) on conflict do nothing;

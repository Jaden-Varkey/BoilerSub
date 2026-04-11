create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  description text,
  price numeric(10,2) not null,
  start_date date not null,
  end_date date not null,
  bedrooms int,
  bathrooms numeric(3,1),
  address text,
  amenities jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists listings_owner_id_idx on public.listings (owner_id);
create index if not exists listings_start_date_idx on public.listings (start_date);
create index if not exists listings_end_date_idx on public.listings (end_date);
create index if not exists listings_price_idx on public.listings (price);

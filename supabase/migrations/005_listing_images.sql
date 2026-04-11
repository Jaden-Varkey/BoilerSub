alter table public.listings
add column if not exists images jsonb not null default '[]'::jsonb;

create index if not exists listings_amenities_gin_idx on public.listings using gin (amenities);

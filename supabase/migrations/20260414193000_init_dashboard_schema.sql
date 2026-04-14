create table if not exists public.orders (
  retailcrm_order_id text primary key,
  customer_name text not null,
  phone text,
  email text,
  city text,
  status text not null,
  order_method text,
  utm_source text,
  total_amount numeric(12, 2) not null,
  currency text not null default 'KZT',
  item_count integer not null default 0,
  items_summary text[] not null default '{}',
  created_at timestamptz not null,
  updated_at timestamptz not null,
  imported_at timestamptz not null default timezone('utc', now()),
  last_synced_at timestamptz not null default timezone('utc', now()),
  raw_payload jsonb not null default '{}'::jsonb
);

create index if not exists orders_created_at_idx on public.orders (created_at desc);
create index if not exists orders_status_idx on public.orders (status);
create index if not exists orders_utm_source_idx on public.orders (utm_source);
create index if not exists orders_city_idx on public.orders (city);

create table if not exists public.sync_runs (
  id uuid primary key default gen_random_uuid(),
  source text not null default 'retailcrm',
  mode text not null,
  status text not null,
  started_at timestamptz not null default timezone('utc', now()),
  finished_at timestamptz,
  processed_count integer not null default 0,
  inserted_count integer not null default 0,
  updated_count integer not null default 0,
  error_message text,
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists sync_runs_started_at_idx on public.sync_runs (started_at desc);
create index if not exists sync_runs_status_idx on public.sync_runs (status);

create table if not exists public.order_alerts (
  id uuid primary key default gen_random_uuid(),
  retailcrm_order_id text not null references public.orders(retailcrm_order_id) on delete cascade,
  threshold_code text not null,
  threshold_amount numeric(12, 2) not null,
  telegram_chat_id text not null,
  telegram_message_id text,
  sent_at timestamptz not null default timezone('utc', now()),
  payload jsonb not null default '{}'::jsonb,
  unique (retailcrm_order_id, threshold_code)
);

create index if not exists order_alerts_sent_at_idx on public.order_alerts (sent_at desc);

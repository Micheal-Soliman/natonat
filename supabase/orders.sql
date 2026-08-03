create table if not exists public.orders (
  order_ref text primary key,
  source text,
  status text,
  payment_status text,
  payment_method text,
  delivery_method text,
  locale text,
  amount_egp numeric,
  amount_cents numeric,
  subtotal_egp numeric,
  shipping_egp numeric,
  discount_egp numeric,
  payment_discount_egp numeric,
  customer_first_name text,
  customer_last_name text,
  customer_email text,
  customer_phone text,
  customer_address text,
  customer_city text,
  customer_governorate text,
  city_key text,
  aramex_tracking_number text,
  aramex_tracking_link text,
  aramex_guid text,
  aramex_status text,
  aramex_latest_update text,
  aramex_latest_location text,
  aramex_synced_at timestamptz,
  aramex_error text,
  email_sent_at timestamptz,
  instapay_proof_email_sent_at timestamptz,
  instapay_pending_customer_email_sent_at timestamptz,
  customer jsonb not null default '{}'::jsonb,
  items jsonb not null default '[]'::jsonb,
  items_flat text,
  aramex jsonb not null default '{}'::jsonb,
  bosta jsonb not null default '{}'::jsonb,
  shipment jsonb not null default '{}'::jsonb,
  extras jsonb not null default '{}'::jsonb,
  payment jsonb not null default '{}'::jsonb,
  referral jsonb not null default '{}'::jsonb,
  inventory jsonb not null default '{}'::jsonb,
  history jsonb not null default '[]'::jsonb,
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.orders enable row level security;

alter table public.orders add column if not exists locale text;
alter table public.orders add column if not exists amount_cents numeric;
alter table public.orders add column if not exists subtotal_egp numeric;
alter table public.orders add column if not exists payment_discount_egp numeric;
alter table public.orders add column if not exists customer_first_name text;
alter table public.orders add column if not exists customer_last_name text;
alter table public.orders add column if not exists customer_email text;
alter table public.orders add column if not exists customer_phone text;
alter table public.orders add column if not exists customer_address text;
alter table public.orders add column if not exists customer_city text;
alter table public.orders add column if not exists customer_governorate text;
alter table public.orders add column if not exists city_key text;
alter table public.orders add column if not exists aramex_tracking_number text;
alter table public.orders add column if not exists aramex_tracking_link text;
alter table public.orders add column if not exists aramex_guid text;
alter table public.orders add column if not exists aramex_status text;
alter table public.orders add column if not exists aramex_latest_update text;
alter table public.orders add column if not exists aramex_latest_location text;
alter table public.orders add column if not exists aramex_synced_at timestamptz;
alter table public.orders add column if not exists aramex_error text;
alter table public.orders add column if not exists email_sent_at timestamptz;
alter table public.orders add column if not exists instapay_proof_email_sent_at timestamptz;
alter table public.orders add column if not exists instapay_pending_customer_email_sent_at timestamptz;
alter table public.orders add column if not exists items_flat text;
alter table public.orders add column if not exists bosta jsonb not null default '{}'::jsonb;
alter table public.orders add column if not exists shipment jsonb not null default '{}'::jsonb;
alter table public.orders add column if not exists history jsonb not null default '[]'::jsonb;

create index if not exists orders_created_at_idx
  on public.orders (created_at desc);

create index if not exists orders_status_idx
  on public.orders (status);

create index if not exists orders_payment_method_idx
  on public.orders (payment_method);

create index if not exists orders_payment_status_idx
  on public.orders (payment_status);

create index if not exists orders_customer_city_idx
  on public.orders (customer_city);

create index if not exists orders_customer_phone_column_idx
  on public.orders (customer_phone);

create index if not exists orders_aramex_status_idx
  on public.orders (aramex_status);

create index if not exists orders_aramex_tracking_number_idx
  on public.orders (aramex_tracking_number);

create index if not exists orders_aramex_tracking_idx
  on public.orders ((aramex ->> 'trackingNumber'));

create index if not exists orders_bosta_tracking_idx
  on public.orders ((bosta ->> 'trackingNumber'));

create index if not exists orders_shipment_tracking_idx
  on public.orders ((shipment ->> 'trackingNumber'));

create index if not exists orders_customer_phone_idx
  on public.orders ((customer ->> 'phone'));

create or replace function public.set_orders_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists orders_set_updated_at on public.orders;

create trigger orders_set_updated_at
before update on public.orders
for each row
execute function public.set_orders_updated_at();

create table if not exists public.order_events (
  id bigserial primary key,
  order_ref text not null references public.orders(order_ref) on delete cascade,
  event_type text not null,
  event_source text,
  event_status text,
  message text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.order_events enable row level security;

create index if not exists order_events_order_ref_idx
  on public.order_events (order_ref, created_at desc);

create table if not exists public.inventory_snapshots (
  id bigserial primary key,
  product_id integer,
  product_slug text,
  product_name text not null,
  size_key text,
  stock_status text,
  stock_quantity numeric,
  low_stock_threshold numeric,
  source text not null default 'sanity',
  raw_payload jsonb not null default '{}'::jsonb,
  captured_at timestamptz not null default now()
);

alter table public.inventory_snapshots enable row level security;

create index if not exists inventory_snapshots_product_size_idx
  on public.inventory_snapshots (product_slug, size_key, captured_at desc);

create table if not exists public.admin_expenses (
  id bigserial primary key,
  external_id text unique,
  title text not null,
  amount_egp numeric not null default 0,
  category text,
  expense_date date,
  payment_method text,
  vendor text,
  related_order_ref text,
  notes text,
  source text not null default 'sanity',
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.admin_expenses enable row level security;

create index if not exists admin_expenses_date_idx
  on public.admin_expenses (expense_date desc);

create table if not exists public.dashboard_audit_logs (
  id bigserial primary key,
  action text not null,
  actor text,
  order_ref text,
  before_payload jsonb,
  after_payload jsonb,
  message text,
  created_at timestamptz not null default now()
);

alter table public.dashboard_audit_logs enable row level security;

create index if not exists dashboard_audit_logs_order_idx
  on public.dashboard_audit_logs (order_ref, created_at desc);

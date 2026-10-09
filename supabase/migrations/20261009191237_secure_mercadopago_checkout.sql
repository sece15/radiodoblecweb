-- Isolated from legacy coin_transactions: preference IDs and payment IDs are distinct.
create table public.mp_checkout_orders (
  id uuid primary key,
  user_id uuid not null references auth.users(id),
  pack_id text not null,
  coins bigint not null check (coins > 0),
  price numeric(12,2) not null check (price > 0),
  currency text not null check (currency = 'PEN'),
  live_mode boolean not null,
  preference_id text unique,
  checkout_url text,
  credited_payment_id text unique,
  checkout_started_at timestamptz,
  created_at timestamptz not null default now()
);
create index mp_checkout_orders_owner on public.mp_checkout_orders(user_id, created_at desc);
create table public.mp_payment_receipts (
  payment_id text primary key,
  order_id uuid not null references public.mp_checkout_orders(id),
  status text not null,
  applied_coins bigint not null default 0,
  refunded_amount numeric(12,2) not null default 0,
  payment_updated_at timestamptz not null,
  updated_at timestamptz not null default now()
);
-- One order may have rejected attempts, but only one payment can credit it.
create unique index mp_one_credit_per_order on public.mp_payment_receipts(order_id) where applied_coins > 0;
alter table public.mp_checkout_orders enable row level security;
alter table public.mp_payment_receipts enable row level security;
revoke all on public.mp_checkout_orders, public.mp_payment_receipts from anon, authenticated;
grant select on public.mp_checkout_orders, public.mp_payment_receipts to authenticated;
grant all on public.mp_checkout_orders, public.mp_payment_receipts to service_role;
create policy mp_orders_owner on public.mp_checkout_orders for select to authenticated using ((select auth.uid()) = user_id);
create policy mp_receipts_owner on public.mp_payment_receipts for select to authenticated using (
  exists (select 1 from public.mp_checkout_orders o where o.id = order_id and o.user_id = (select auth.uid()))
);

-- Preferences API must never be blindly retried after a timeout.
create function public.claim_mp_checkout(p_order_id uuid) returns boolean
language plpgsql security invoker set search_path = '' as $$
begin
  update public.mp_checkout_orders set checkout_started_at=now()
    where id=p_order_id and checkout_started_at is null;
  return found;
end;
$$;
revoke all on function public.claim_mp_checkout(uuid) from public, anon, authenticated;
grant execute on function public.claim_mp_checkout(uuid) to service_role;

-- Invoker is service_role only. Lock order AND receipt before changing balance.
create function public.settle_mp_payment(
  p_payment_id text, p_order_id uuid, p_status text, p_amount numeric,
  p_currency text, p_live_mode boolean, p_refunded numeric, p_updated_at timestamptz
) returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  o public.mp_checkout_orders%rowtype;
  receipt public.mp_payment_receipts%rowtype;
  target bigint := 0;
  delta bigint;
begin
  if p_payment_id is null or p_payment_id !~ '^[0-9]+$' or p_updated_at is null or p_status is null then raise exception 'Invalid payment'; end if;
  select * into strict o from public.mp_checkout_orders where id = p_order_id for update;
  if p_amount is distinct from o.price or p_currency is distinct from o.currency or p_live_mode is distinct from o.live_mode
     or p_refunded is null or p_refunded < 0 or p_refunded > o.price then raise exception 'Payment mismatch'; end if;
  if p_status not in ('approved','pending','in_process','authorized','rejected','cancelled','refunded','charged_back','in_mediation') then
    raise exception 'Unknown payment status';
  end if;
  insert into public.mp_payment_receipts(payment_id,order_id,status,payment_updated_at)
    values(p_payment_id,p_order_id,p_status,p_updated_at) on conflict(payment_id) do nothing;
  select * into strict receipt from public.mp_payment_receipts where payment_id = p_payment_id for update;
  if receipt.order_id <> o.id then raise exception 'Payment already linked'; end if;
  if receipt.payment_updated_at > p_updated_at then return jsonb_build_object('ignored',true); end if;
  -- Proportional reversal for partial refunds; disputes freeze existing credits until resolved.
  if p_status = 'approved' then target := floor(o.coins * (o.price - p_refunded) / o.price);
  elsif p_status = 'in_mediation' then target := receipt.applied_coins;
  end if;
  if target > 0 and o.credited_payment_id is not null and o.credited_payment_id <> p_payment_id then
    raise exception 'Order already credited by another payment';
  end if;
  delta := target - receipt.applied_coins;
  if delta <> 0 then
    -- Never silently discard spent-coin debt; profile constraints may require manual reconciliation.
    update public.profiles set puntos_c = coalesce(puntos_c,0) + delta where id = o.user_id;
    if not found then raise exception 'Profile missing'; end if;
  end if;
  if target > 0 then
    update public.mp_checkout_orders set credited_payment_id=p_payment_id where id=o.id;
  end if;
  update public.mp_payment_receipts set status=p_status,applied_coins=target,refunded_amount=p_refunded,
    payment_updated_at=p_updated_at,updated_at=now() where payment_id=p_payment_id;
  return jsonb_build_object('applied',delta,'duplicate',delta=0);
end;
$$;
revoke all on function public.settle_mp_payment(text,uuid,text,numeric,text,boolean,numeric,timestamptz) from public, anon, authenticated;
grant execute on function public.settle_mp_payment(text,uuid,text,numeric,text,boolean,numeric,timestamptz) to service_role;

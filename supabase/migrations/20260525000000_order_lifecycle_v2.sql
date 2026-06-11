-- ====================================================================
-- Higo Shop / Higo App — Order Lifecycle v2
-- Migration: 20260525000000_order_lifecycle_v2.sql
-- Target: Supabase (PostgreSQL)
--
-- Objetivo: hacer que el flujo granular de pago dividido (producto al
-- comercio + envío al driver) PERSISTA en la DB. Hoy la tabla orders
-- tiene un CHECK que solo admite los 8 estados viejos, así que cuando
-- el front sincroniza estados nuevos (PRODUCT_PAYMENT_*, DRIVER_EN_ROUTE_*,
-- DELIVERY_PAYMENT_*) la DB los rechaza y el .catch() los traga.
--
-- Diseño:
--  - 100% ADITIVO: solo amplía el CHECK y agrega columnas nullable, así
--    las filas existentes siguen siendo válidas y nada del flujo actual
--    se rompe.
--  - Deja el campo `order_type` para preparar Viajes/Envíos sin
--    re-arquitectura (default 'shop').
--  - Amplía la policy RLS de drivers para incluir los estados granulares
--    de despacho (READY_FOR_DRIVER_MATCH, DRIVER_CANDIDATE_BROADCASTED).
--  - Realtime ya replica orders/order_events/driver_locations; no se toca.
-- ====================================================================

begin;

-- 1) Ampliar el CHECK de orders.status para aceptar todos los estados
--    granulares + los legacy (para no invalidar filas existentes).
alter table public.orders
  drop constraint if exists orders_status_check;

alter table public.orders
  add constraint orders_status_check check (
    status in (
      -- Estados granulares (v2)
      'PENDING_PRODUCT_PAYMENT',
      'PRODUCT_PAYMENT_REPORTED',
      'PRODUCT_PAYMENT_VERIFIED',
      'PREPARING',
      'READY_FOR_DRIVER_MATCH',
      'DRIVER_CANDIDATE_BROADCASTED',
      'DRIVER_ASSIGNED',
      'DRIVER_EN_ROUTE_TO_STORE',
      'PICKED_UP',
      'DRIVER_EN_ROUTE_TO_CUSTOMER',
      'DELIVERY_PAYMENT_PENDING',
      'DELIVERY_PAYMENT_REPORTED',
      'DELIVERY_PAYMENT_CONFIRMED',
      'DELIVERED',
      'CANCELLED',
      -- Legacy (compatibilidad hacia atrás con filas viejas)
      'PENDING_PAYMENT',
      'PAYMENT_VERIFIED',
      'READY_TO_DISPATCH'
    )
  );

-- 2) Default del estado inicial al nuevo granular. (Las filas viejas
--    no se tocan; solo afecta inserts futuros sin status explícito.)
alter table public.orders
  alter column status set default 'PENDING_PRODUCT_PAYMENT';

-- 3) Vertical (orderType): prepara Viajes/Envíos sin tocar nada más.
alter table public.orders
  add column if not exists order_type text not null default 'shop'
    check (order_type in ('shop', 'ride', 'parcel'));

create index if not exists orders_order_type_status_idx
  on public.orders(order_type, status);

-- 4) Sub-estados de pago (producto / envío) + referencias.
--    El front ya los maneja en el estado local; ahora persisten.
alter table public.orders
  add column if not exists product_payment_status text
    check (
      product_payment_status is null
      or product_payment_status in (
        'PENDING_PRODUCT_PAYMENT',
        'PRODUCT_PAYMENT_REPORTED',
        'PRODUCT_PAYMENT_VERIFIED'
      )
    );

alter table public.orders
  add column if not exists delivery_payment_status text
    check (
      delivery_payment_status is null
      or delivery_payment_status in (
        'DELIVERY_PAYMENT_PENDING',
        'DELIVERY_PAYMENT_REPORTED',
        'DELIVERY_PAYMENT_CONFIRMED'
      )
    );

alter table public.orders
  add column if not exists product_payment_reference text;

alter table public.orders
  add column if not exists delivery_payment_reference text;

-- 5) Ampliar la policy RLS de drivers para que vean también los
--    estados granulares "despachables" (oferta + asignación previa).
--    Sin esto, las órdenes nuevas en READY_FOR_DRIVER_MATCH /
--    DRIVER_CANDIDATE_BROADCASTED no aparecerían para drivers que
--    todavía no fueron asignados.
drop policy if exists "Allow drivers to view dispatchable or their assigned orders"
  on public.orders;

create policy "Allow drivers to view dispatchable or their assigned orders"
  on public.orders for all
  using (
    status in (
      'READY_TO_DISPATCH',
      'READY_FOR_DRIVER_MATCH',
      'DRIVER_CANDIDATE_BROADCASTED'
    )
    or auth.uid() = driver_id
  );

commit;

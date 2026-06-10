-- ============================================================
-- Hardening RLS — Fase 0
-- Migration: 20260525000000_rls_hardening_fase0.sql
-- Target: Supabase (PostgreSQL)
--
-- Aplica los hallazgos prioritarios del informe
-- BACKEND_HARDENING_REVIEW.md:
--   1) Cerrar exposición pública innecesaria de PII (profiles, drivers).
--   2) Separar políticas de orders por verbo (SELECT/INSERT/UPDATE/DELETE)
--      en lugar de `for all using (...)`.
--   3) Bloquear inserciones de driver_locations por drivers que no estén
--      asignados al order_id en cuestión.
--
-- Idempotente: usa DROP POLICY IF EXISTS para que se pueda re-aplicar.
-- NO se cambia el modelo lógico ni se rompen tablas existentes.
-- ============================================================

begin;

-- ============================================================
-- 1) PROFILES — quitar select público (expone nombre/teléfono)
-- ============================================================
drop policy if exists "Allow public read access to profiles" on public.profiles;

create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

-- Permitir que un participante de una orden (cliente/comercio/driver
-- asignado) lea el perfil del otro — necesario para mostrar nombres en
-- chats y headers de pedido.
create policy "profiles_select_order_participants"
  on public.profiles for select
  using (
    exists (
      select 1
      from public.orders o
      left join public.stores s on s.id = o.store_id
      where (
        o.customer_id = public.profiles.id
        or o.driver_id = public.profiles.id
        or s.owner_id  = public.profiles.id
      )
      and (
        o.customer_id = auth.uid()
        or o.driver_id = auth.uid()
        or s.owner_id  = auth.uid()
      )
    )
  );

-- ============================================================
-- 2) DRIVERS — quitar select público (expone vehículo/ubicación/PagoMóvil)
-- ============================================================
drop policy if exists "Allow public read access to drivers" on public.drivers;

create policy "drivers_select_self"
  on public.drivers for select
  using (auth.uid() = id);

-- Participantes de una orden activa con ese driver pueden leerlo.
create policy "drivers_select_order_participants"
  on public.drivers for select
  using (
    exists (
      select 1
      from public.orders o
      left join public.stores s on s.id = o.store_id
      where o.driver_id = public.drivers.id
      and (
        o.customer_id = auth.uid()
        or s.owner_id = auth.uid()
      )
    )
  );

-- ============================================================
-- 3) ORDERS — políticas separadas por verbo
-- ============================================================
drop policy if exists "Allow customers to manage their own orders" on public.orders;
drop policy if exists "Allow merchants to read/update orders for their stores" on public.orders;
drop policy if exists "Allow drivers to view dispatchable or their assigned orders" on public.orders;

-- ---- SELECT ----
create policy "orders_select_customer"
  on public.orders for select
  using (auth.uid() = customer_id);

create policy "orders_select_merchant"
  on public.orders for select
  using (
    auth.uid() in (
      select owner_id from public.stores where id = store_id
    )
  );

create policy "orders_select_driver"
  on public.orders for select
  using (
    auth.uid() = driver_id
    or status in (
      'READY_TO_DISPATCH', 'READY_FOR_DRIVER_MATCH', 'DRIVER_CANDIDATE_BROADCASTED'
    )
  );

-- ---- INSERT (solo el cliente crea su orden) ----
create policy "orders_insert_customer"
  on public.orders for insert
  with check (auth.uid() = customer_id);

-- ---- UPDATE (cliente / merchant dueño / driver asignado) ----
create policy "orders_update_customer"
  on public.orders for update
  using (auth.uid() = customer_id)
  with check (auth.uid() = customer_id);

create policy "orders_update_merchant"
  on public.orders for update
  using (
    auth.uid() in (
      select owner_id from public.stores where id = store_id
    )
  )
  with check (
    auth.uid() in (
      select owner_id from public.stores where id = store_id
    )
  );

create policy "orders_update_driver_assigned"
  on public.orders for update
  using (auth.uid() = driver_id)
  with check (auth.uid() = driver_id);

-- Driver puede "aceptar" una orden disponible (set driver_id = self).
create policy "orders_update_driver_claim"
  on public.orders for update
  using (
    status in ('READY_TO_DISPATCH', 'READY_FOR_DRIVER_MATCH', 'DRIVER_CANDIDATE_BROADCASTED')
  )
  with check (auth.uid() = driver_id);

-- ---- DELETE (solo el cliente puede borrar la suya — raras veces) ----
create policy "orders_delete_customer"
  on public.orders for delete
  using (auth.uid() = customer_id);

-- ============================================================
-- 4) DRIVER_LOCATIONS — restringir insert al driver asignado
-- ============================================================
drop policy if exists "Allow assigned driver to insert tracking" on public.driver_locations;

create policy "driver_locations_insert_assigned"
  on public.driver_locations for insert
  with check (
    driver_id = auth.uid()
    and exists (
      select 1 from public.orders o
      where o.id = order_id
      and o.driver_id = auth.uid()
    )
  );

commit;

-- ============================================================
-- NOTAS para el operador
-- ============================================================
-- * Esta migración asume que el flujo de auth ya está activo: las
--   políticas dependen de auth.uid().
-- * Mantenemos `stores` y `products` con lectura pública porque son
--   necesarios para que el marketplace sirva contenido a usuarios anónimos
--   antes de loguearse. La PII sensible (pago_movil de stores) podría
--   moverse a una tabla aparte o usarse column-level security en una
--   migración futura (Fase 1).
-- * Si en runtime ves errores 401/403 inesperados desde el cliente luego
--   de aplicar esta migración, revisar que los tokens JWT incluyan
--   auth.uid() y que customer_id/driver_id estén poblados correctamente.

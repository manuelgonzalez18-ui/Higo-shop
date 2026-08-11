-- Seguridad previa al corte a autenticación: conserva operación anon actual,
-- pero evita SECURITY DEFINER innecesario y activa RLS en pagos.

alter function registrar_pasajero(uuid,integer,text,text,text,text,numeric,boolean,text,text,jsonb)
  set search_path = public;

alter function reordenar_pasajeros(uuid) security invoker;
alter function eliminar_pasajero_seguro(uuid) security invoker;
alter function actualizar_pasajero(uuid,text,text,text,text,integer,text,boolean,jsonb,text) security invoker;
alter function registrar_pago(uuid,numeric,text,text) security invoker;

alter table pagos enable row level security;
drop policy if exists "acceso publico pagos" on pagos;
create policy "acceso publico pagos" on pagos
  for all to anon, authenticated using (true) with check (true);

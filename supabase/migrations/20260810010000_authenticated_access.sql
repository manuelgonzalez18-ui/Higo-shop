-- Aplicar SOLO después de crear al menos un usuario administrador en Supabase Auth.

alter table viajes enable row level security;
alter table pasajeros enable row level security;
alter table pagos enable row level security;

drop policy if exists "acceso publico viajes" on viajes;
drop policy if exists "acceso publico pasajeros" on pasajeros;
drop policy if exists "acceso publico pagos" on pagos;
drop policy if exists "authenticated viajes" on viajes;
drop policy if exists "authenticated pasajeros" on pasajeros;
drop policy if exists "authenticated pagos" on pagos;

create policy "authenticated viajes" on viajes
  for all to authenticated using (true) with check (true);
create policy "authenticated pasajeros" on pasajeros
  for all to authenticated using (true) with check (true);
create policy "authenticated pagos" on pagos
  for all to authenticated using (true) with check (true);

revoke execute on function reordenar_pasajeros(uuid) from anon;
revoke execute on function eliminar_pasajero_seguro(uuid) from anon;
revoke execute on function actualizar_pasajero(uuid,text,text,text,text,int,text,boolean,jsonb,text) from anon;
revoke execute on function registrar_pago(uuid,numeric,text,text) from anon;

grant execute on function reordenar_pasajeros(uuid) to authenticated;
grant execute on function eliminar_pasajero_seguro(uuid) to authenticated;
grant execute on function actualizar_pasajero(uuid,text,text,text,text,int,text,boolean,jsonb,text) to authenticated;
grant execute on function registrar_pago(uuid,numeric,text,text) to authenticated;

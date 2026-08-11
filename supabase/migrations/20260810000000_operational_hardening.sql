-- Etapas operativas: integridad, pagos, edición y reordenamiento.
-- Esta migración es segura de aplicar antes del corte a autenticación.

alter table viajes
  add constraint viajes_capacidad_positiva check (capacidad_unidad > 0) not valid,
  add constraint viajes_precio_no_negativo check (precio_pasajero >= 0) not valid,
  add constraint viajes_precio_comida_no_negativo check (precio_pasajero_comida >= 0) not valid;

alter table pasajeros
  add constraint pasajeros_grupo_positivo check (grupo_numero > 0) not valid,
  add constraint pasajeros_reserva_no_negativa check (monto_reservado >= 0) not valid,
  add constraint pasajeros_pendiente_no_negativo check (monto_pendiente >= 0) not valid;

create unique index if not exists pasajeros_viaje_cedula_uidx
  on pasajeros(viaje_id, lower(trim(cedula)));

create table if not exists pagos (
  id uuid primary key default gen_random_uuid(),
  pasajero_id uuid not null references pasajeros(id) on delete cascade,
  monto numeric(10,2) not null check (monto > 0),
  metodo text not null default 'efectivo',
  nota text,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id)
);
create index if not exists pagos_pasajero_id_idx on pagos(pasajero_id, created_at);

create or replace function reordenar_pasajeros(p_viaje_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_capacidad int;
begin
  select capacidad_unidad into v_capacidad from viajes where id = p_viaje_id for update;
  if v_capacidad is null then return; end if;

  with ordenados as (
    select id, row_number() over (order by orden, created_at, id) as nuevo_orden
    from pasajeros where viaje_id = p_viaje_id
  )
  update pasajeros p
  set orden = o.nuevo_orden,
      unidad_numero = ceil(o.nuevo_orden::numeric / v_capacidad)
  from ordenados o
  where p.id = o.id;

  update viajes
  set total_pasajeros = (select count(*) from pasajeros where viaje_id = p_viaje_id)
  where id = p_viaje_id;
end;
$$;

create or replace function eliminar_pasajero_seguro(p_pasajero_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_viaje_id uuid;
begin
  select viaje_id into v_viaje_id from pasajeros where id = p_pasajero_id for update;
  if v_viaje_id is null then return; end if;
  delete from pasajeros where id = p_pasajero_id;
  perform reordenar_pasajeros(v_viaje_id);
end;
$$;

create or replace function actualizar_pasajero(
  p_pasajero_id uuid,
  p_nombre text,
  p_apellido text,
  p_cedula text,
  p_telefono text,
  p_grupo_numero int,
  p_punto_recogida text,
  p_servicio_comida boolean,
  p_desayuno_items jsonb default '{}'::jsonb,
  p_almuerzo_solicitado text default null
) returns pasajeros
language plpgsql
security definer
set search_path = public
as $$
declare
  v_precio numeric;
  v_row pasajeros;
begin
  if p_grupo_numero <= 0 then raise exception 'Grupo inválido'; end if;

  select case when p_servicio_comida then v.precio_pasajero_comida else v.precio_pasajero end
    into v_precio
  from pasajeros p join viajes v on v.id = p.viaje_id
  where p.id = p_pasajero_id;

  update pasajeros
  set nombre = trim(p_nombre), apellido = trim(p_apellido), cedula = trim(p_cedula),
      telefono = trim(p_telefono), grupo_numero = p_grupo_numero,
      punto_recogida = nullif(trim(p_punto_recogida), ''),
      servicio_comida = p_servicio_comida,
      desayuno_items = case when p_servicio_comida then coalesce(p_desayuno_items, '{}'::jsonb) else '{}'::jsonb end,
      almuerzo_solicitado = case when p_servicio_comida then nullif(trim(p_almuerzo_solicitado), '') else null end,
      monto_pendiente = greatest(coalesce(v_precio, 0) - monto_reservado, 0)
  where id = p_pasajero_id
  returning * into v_row;

  if v_row.id is null then raise exception 'Pasajero no existe'; end if;
  return v_row;
end;
$$;

create or replace function registrar_pago(
  p_pasajero_id uuid,
  p_monto numeric,
  p_metodo text default 'efectivo',
  p_nota text default null
) returns pagos
language plpgsql
security definer
set search_path = public
as $$
declare
  v_precio numeric;
  v_total numeric;
  v_pago pagos;
begin
  if p_monto <= 0 then raise exception 'El monto debe ser mayor que cero'; end if;

  select case when p.servicio_comida then v.precio_pasajero_comida else v.precio_pasajero end,
         p.monto_reservado
    into v_precio, v_total
  from pasajeros p join viajes v on v.id = p.viaje_id
  where p.id = p_pasajero_id
  for update of p;

  if v_precio is null then raise exception 'Pasajero no existe'; end if;

  v_total := coalesce(v_total, 0) + p_monto;
  update pasajeros
  set monto_reservado = v_total,
      monto_pendiente = greatest(v_precio - v_total, 0)
  where id = p_pasajero_id;

  insert into pagos(pasajero_id, monto, metodo, nota, created_by)
  values (p_pasajero_id, p_monto, coalesce(nullif(trim(p_metodo), ''), 'efectivo'), nullif(trim(p_nota), ''), auth.uid())
  returning * into v_pago;
  return v_pago;
end;
$$;

-- Mientras la aplicación siga sin login en producción, conserva compatibilidad anon.
grant execute on function reordenar_pasajeros(uuid) to anon, authenticated;
grant execute on function eliminar_pasajero_seguro(uuid) to anon, authenticated;
grant execute on function actualizar_pasajero(uuid,text,text,text,text,int,text,boolean,jsonb,text) to anon, authenticated;
grant execute on function registrar_pago(uuid,numeric,text,text) to anon, authenticated;

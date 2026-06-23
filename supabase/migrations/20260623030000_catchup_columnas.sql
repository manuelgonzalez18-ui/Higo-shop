-- Catch-up idempotente: asegura que existan TODAS las columnas que usa
-- registrar_pasajero(), por si alguna migración intermedia no llegó a
-- aplicarse en producción (el síntoma fue
-- 'column "punto_recogida" of relation "pasajeros" does not exist').
--
-- Todo es `if not exists`, así que correrla varias veces o con las columnas
-- ya presentes no rompe nada. Luego recrea la función con su firma final.

alter table viajes
  add column if not exists precio_pasajero_comida numeric(10,2) not null default 0;

alter table pasajeros
  add column if not exists almuerzo_solicitado text,
  add column if not exists punto_recogida text,
  add column if not exists desayuno_items jsonb not null default '{}'::jsonb;

-- Elimina cualquier overload anterior de registrar_pasajero para quedarnos
-- solo con la firma final (evita ambigüedad por firmas viejas colgadas).
do $$
declare r record;
begin
  for r in
    select oid::regprocedure as sig
    from pg_proc
    where proname = 'registrar_pasajero'
  loop
    execute 'drop function ' || r.sig;
  end loop;
end $$;

create function registrar_pasajero(
  p_viaje_id uuid,
  p_grupo_numero int,
  p_nombre text,
  p_apellido text,
  p_cedula text,
  p_telefono text,
  p_monto_reservado numeric,
  p_servicio_comida boolean,
  p_almuerzo_solicitado text default null,
  p_punto_recogida text default null,
  p_desayuno_items jsonb default null
) returns pasajeros as $$
declare
  v_capacidad int;
  v_precio_traslado numeric;
  v_precio_comida numeric;
  v_precio numeric;
  v_orden int;
  v_unidad int;
  v_pendiente numeric;
  v_row pasajeros;
begin
  update viajes set total_pasajeros = total_pasajeros + 1
    where id = p_viaje_id
    returning total_pasajeros, capacidad_unidad, precio_pasajero, precio_pasajero_comida
    into v_orden, v_capacidad, v_precio_traslado, v_precio_comida;

  if v_orden is null then
    raise exception 'Viaje % no existe', p_viaje_id;
  end if;

  v_unidad := ceil(v_orden::numeric / v_capacidad);
  v_precio := case when p_servicio_comida then v_precio_comida else v_precio_traslado end;
  v_pendiente := greatest(v_precio - p_monto_reservado, 0);

  insert into pasajeros(
    viaje_id, orden, unidad_numero, grupo_numero, nombre, apellido,
    cedula, telefono, monto_reservado, monto_pendiente, servicio_comida,
    almuerzo_solicitado, punto_recogida, desayuno_items
  ) values (
    p_viaje_id, v_orden, v_unidad, p_grupo_numero, p_nombre, p_apellido,
    p_cedula, p_telefono, p_monto_reservado, v_pendiente, p_servicio_comida,
    case when p_servicio_comida then p_almuerzo_solicitado else null end,
    p_punto_recogida,
    case when p_servicio_comida then coalesce(p_desayuno_items, '{}'::jsonb) else '{}'::jsonb end
  )
  returning * into v_row;

  return v_row;
end;
$$ language plpgsql;

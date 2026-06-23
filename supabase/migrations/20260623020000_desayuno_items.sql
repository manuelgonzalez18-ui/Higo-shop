-- El desayuno pasa de un solo relleno + cantidad a un mapa relleno → cantidad
-- (jsonb), porque cada pasajero puede combinar hasta 2 empanadas de distintos
-- rellenos (ej. 1 de cazón + 1 de queso). El almuerzo queda como un solo plato
-- (siempre 1), así que se elimina su columna de cantidad.

alter table pasajeros
  add column if not exists desayuno_items jsonb not null default '{}'::jsonb;

-- Eliminamos cualquier overload anterior de registrar_pasajero para no dejar
-- firmas colgadas que choquen por ambigüedad (la columna desayuno_solicitado /
-- las cantidades ya no existen en la nueva firma).
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

alter table pasajeros
  drop column if exists desayuno_solicitado,
  drop column if exists desayuno_cantidad,
  drop column if exists almuerzo_cantidad;

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

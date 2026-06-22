-- Esquema de la agencia de viajes: viajes (destino + fecha) y pasajeros
-- registrados en cada viaje. No hay autenticación de usuarios (acceso libre
-- vía anon key), por lo que las tablas se dejan sin RLS a propósito.

create table if not exists viajes (
  id uuid primary key default gen_random_uuid(),
  destino_id text not null,
  destino_nombre text not null,
  fecha date not null,
  precio_pasajero numeric(10,2) not null default 0,
  capacidad_unidad int not null,
  total_pasajeros int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists pasajeros (
  id uuid primary key default gen_random_uuid(),
  viaje_id uuid not null references viajes(id) on delete cascade,
  orden int not null,
  unidad_numero int not null,
  grupo_numero int not null,
  nombre text not null,
  apellido text not null,
  cedula text not null,
  telefono text not null,
  monto_reservado numeric(10,2) not null default 0,
  monto_pendiente numeric(10,2) not null default 0,
  servicio_comida boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists pasajeros_viaje_id_idx on pasajeros(viaje_id);

-- Asigna número de unidad y orden de forma atómica: el UPDATE ... RETURNING
-- sobre viajes.total_pasajeros toma el lock de fila, así que dos registros
-- simultáneos del mismo viaje nunca terminan con el mismo orden/unidad.
create or replace function registrar_pasajero(
  p_viaje_id uuid,
  p_grupo_numero int,
  p_nombre text,
  p_apellido text,
  p_cedula text,
  p_telefono text,
  p_monto_reservado numeric,
  p_servicio_comida boolean
) returns pasajeros as $$
declare
  v_capacidad int;
  v_precio numeric;
  v_orden int;
  v_unidad int;
  v_pendiente numeric;
  v_row pasajeros;
begin
  update viajes set total_pasajeros = total_pasajeros + 1
    where id = p_viaje_id
    returning total_pasajeros, capacidad_unidad, precio_pasajero
    into v_orden, v_capacidad, v_precio;

  if v_orden is null then
    raise exception 'Viaje % no existe', p_viaje_id;
  end if;

  v_unidad := ceil(v_orden::numeric / v_capacidad);
  v_pendiente := greatest(v_precio - p_monto_reservado, 0);

  insert into pasajeros(
    viaje_id, orden, unidad_numero, grupo_numero, nombre, apellido,
    cedula, telefono, monto_reservado, monto_pendiente, servicio_comida
  ) values (
    p_viaje_id, v_orden, v_unidad, p_grupo_numero, p_nombre, p_apellido,
    p_cedula, p_telefono, p_monto_reservado, v_pendiente, p_servicio_comida
  )
  returning * into v_row;

  return v_row;
end;
$$ language plpgsql;

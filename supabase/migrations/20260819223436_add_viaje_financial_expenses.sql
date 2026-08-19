alter table public.viajes
  add column if not exists gasto_logistica numeric not null default 0,
  add column if not exists gasto_transporte_maritimo numeric not null default 0,
  add column if not exists gasto_transporte_terrestre numeric not null default 0,
  add column if not exists gasto_empleados numeric not null default 0,
  add column if not exists gasto_comidas numeric not null default 0,
  add column if not exists gasto_hidratacion numeric not null default 0;

alter table public.viajes
  add constraint viajes_gasto_logistica_nonnegative check (gasto_logistica >= 0),
  add constraint viajes_gasto_transporte_maritimo_nonnegative check (gasto_transporte_maritimo >= 0),
  add constraint viajes_gasto_transporte_terrestre_nonnegative check (gasto_transporte_terrestre >= 0),
  add constraint viajes_gasto_empleados_nonnegative check (gasto_empleados >= 0),
  add constraint viajes_gasto_comidas_nonnegative check (gasto_comidas >= 0),
  add constraint viajes_gasto_hidratacion_nonnegative check (gasto_hidratacion >= 0);

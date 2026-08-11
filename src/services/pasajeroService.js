import { supabase } from './supabase.js';

export async function listarPasajerosPorViaje(viajeId) {
  const { data, error } = await supabase
    .from('pasajeros')
    .select('*')
    .eq('viaje_id', viajeId)
    .order('orden', { ascending: true });
  if (error) throw error;
  return data;
}

export async function registrarPasajero(viajeId, {
  grupoNumero, nombre, apellido, cedula, telefono, montoReservado, servicioComida,
  desayunoItems, almuerzoSolicitado, puntoRecogida,
}) {
  const { data, error } = await supabase.rpc('registrar_pasajero', {
    p_viaje_id: viajeId,
    p_grupo_numero: grupoNumero,
    p_nombre: nombre,
    p_apellido: apellido,
    p_cedula: cedula,
    p_telefono: telefono,
    p_monto_reservado: montoReservado,
    p_servicio_comida: servicioComida,
    p_almuerzo_solicitado: almuerzoSolicitado || null,
    p_punto_recogida: puntoRecogida || null,
    p_desayuno_items: desayunoItems || {},
  });
  if (error) throw error;
  return data;
}

export async function actualizarPasajero(pasajeroId, datos) {
  const { data, error } = await supabase.rpc('actualizar_pasajero', {
    p_pasajero_id: pasajeroId,
    p_nombre: datos.nombre,
    p_apellido: datos.apellido,
    p_cedula: datos.cedula,
    p_telefono: datos.telefono,
    p_grupo_numero: Number(datos.grupoNumero),
    p_punto_recogida: datos.puntoRecogida || '',
    p_servicio_comida: Boolean(datos.servicioComida),
    p_desayuno_items: datos.desayunoItems || {},
    p_almuerzo_solicitado: datos.almuerzoSolicitado || null,
  });
  if (error) throw error;
  return data;
}

export async function registrarPago(pasajeroId, { monto, metodo, nota }) {
  const { data, error } = await supabase.rpc('registrar_pago', {
    p_pasajero_id: pasajeroId,
    p_monto: Number(monto),
    p_metodo: metodo || 'efectivo',
    p_nota: nota || null,
  });
  if (error) throw error;
  return data;
}

export async function listarPagos(pasajeroId) {
  const { data, error } = await supabase
    .from('pagos')
    .select('*')
    .eq('pasajero_id', pasajeroId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function eliminarPasajero(pasajeroId) {
  const { error } = await supabase.rpc('eliminar_pasajero_seguro', {
    p_pasajero_id: pasajeroId,
  });
  if (error) throw error;
}

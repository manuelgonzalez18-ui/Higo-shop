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
  desayunoSolicitado, almuerzoSolicitado,
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
    p_desayuno_solicitado: desayunoSolicitado || null,
    p_almuerzo_solicitado: almuerzoSolicitado || null,
  });
  if (error) throw error;
  return data;
}

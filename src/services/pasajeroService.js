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
  });
  if (error) throw error;
  return data;
}

import { supabase } from './supabase.js';

export async function listarViajes() {
  const { data, error } = await supabase
    .from('viajes')
    .select('*')
    .order('fecha', { ascending: false })
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function obtenerViaje(viajeId) {
  const { data, error } = await supabase
    .from('viajes')
    .select('*')
    .eq('id', viajeId)
    .single();
  if (error) throw error;
  return data;
}

export async function crearViaje({
  destinoId, destinoNombre, fecha, precioPasajero, precioPasajeroComida, capacidadUnidad,
}) {
  const { data, error } = await supabase
    .from('viajes')
    .insert({
      destino_id: destinoId,
      destino_nombre: destinoNombre,
      fecha,
      precio_pasajero: precioPasajero,
      precio_pasajero_comida: precioPasajeroComida,
      capacidad_unidad: capacidadUnidad,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function actualizarGastosViaje(viajeId, gastos) {
  const payload = {
    gasto_logistica: Number(gastos.gasto_logistica) || 0,
    gasto_transporte_maritimo: Number(gastos.gasto_transporte_maritimo) || 0,
    gasto_transporte_terrestre: Number(gastos.gasto_transporte_terrestre) || 0,
    gasto_empleados: Number(gastos.gasto_empleados) || 0,
    gasto_comidas: Number(gastos.gasto_comidas) || 0,
    gasto_hidratacion: Number(gastos.gasto_hidratacion) || 0,
  };

  const { data, error } = await supabase
    .from('viajes')
    .update(payload)
    .eq('id', viajeId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function eliminarViaje(viajeId) {
  const { error } = await supabase.from('viajes').delete().eq('id', viajeId);
  if (error) throw error;
}

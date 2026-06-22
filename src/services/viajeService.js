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

export async function crearViaje({ destinoId, destinoNombre, fecha, precioPasajero, capacidadUnidad }) {
  const { data, error } = await supabase
    .from('viajes')
    .insert({
      destino_id: destinoId,
      destino_nombre: destinoNombre,
      fecha,
      precio_pasajero: precioPasajero,
      capacidad_unidad: capacidadUnidad,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

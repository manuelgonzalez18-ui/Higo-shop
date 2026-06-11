import { supabase } from './supabase.js';
import { mockStores } from '../data/stores.js';
import { mockProducts } from '../data/products.js';

/**
 * Maps a database store row (snake_case) to the camelCase properties used in the frontend.
 */
function mapStoreRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    ownerId: row.owner_id,
    name: row.name,
    category: row.category,
    description: row.description,
    imageUrl: row.image_url,
    rating: Number(row.rating || 5),
    reviewCount: row.review_count || 0,
    deliveryTime: row.delivery_time || '20-30 min',
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    address: row.address,
    phone: row.phone,
    isOpen: row.is_open ?? true,
    openHours: row.open_hours || '8:00 AM - 10:00 PM',
    pagoMovil: row.pago_movil // { phone, bank, cedula, holder }
  };
}

/**
 * Maps a database product row (snake_case) to the camelCase properties used in the frontend.
 */
function mapProductRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    storeId: row.store_id,
    name: row.name,
    description: row.description,
    price: Number(row.price),
    category: row.category,
    imageUrl: row.image_url,
    available: row.available ?? true
  };
}

/**
 * Fetches all stores from Supabase. Falls back to mockStores on failure.
 */
export async function fetchStores() {
  try {
    const { data, error } = await supabase
      .from('stores')
      .select('*');

    if (error) throw error;

    if (data && data.length > 0) {
      console.log('Supabase: Loaded stores successfully');
      return data.map(mapStoreRow);
    }
    
    console.warn('Supabase: Stores table empty. Using fallback mockStores.');
    return mockStores;
  } catch (error) {
    console.error('Supabase: Error fetching stores, falling back to mockStores:', error.message);
    return mockStores;
  }
}

/**
 * Fetches a single store by its ID from Supabase. Falls back to mockStores search.
 */
export async function fetchStoreById(id) {
  try {
    const { data, error } = await supabase
      .from('stores')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    if (data) {
      return mapStoreRow(data);
    }
  } catch (error) {
    console.error(`Supabase: Error fetching store ${id}, searching local fallback:`, error.message);
  }
  
  // Local fallback
  return mockStores.find(s => s.id === id) || null;
}

/**
 * Fetches products for a specific store. Falls back to mockProducts on failure.
 */
export async function fetchProductsByStoreId(storeId) {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('store_id', storeId);

    if (error) throw error;

    if (data && data.length > 0) {
      console.log(`Supabase: Loaded products for store ${storeId}`);
      return data.map(mapProductRow);
    }

    console.warn(`Supabase: No products found for store ${storeId}. Using fallback mockProducts.`);
  } catch (error) {
    console.error(`Supabase: Error fetching products for store ${storeId}, using fallback:`, error.message);
  }

  // Local fallback
  return mockProducts[storeId] || [];
}

/**
 * Devuelve la primera tienda asociada a un owner (el merchant logueado).
 * En el demo cada merchant tiene una sola tienda. Si no hay match en
 * Supabase, cae al primer mockStore para que el dashboard del comercio
 * sea navegable también en modo demo/offline.
 */
export async function fetchStoreByOwner(ownerId) {
  if (!ownerId) return mockStores[0] || null;
  try {
    const { data, error } = await supabase
      .from('stores')
      .select('*')
      .eq('owner_id', ownerId)
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    if (data) return mapStoreRow(data);
  } catch (error) {
    console.warn('Supabase: fetchStoreByOwner falló, usando mockStores[0]:', error?.message || error);
  }
  return mockStores[0] || null;
}

/**
 * Actualiza campos de la tienda (parcial). Recibe camelCase y mapea a
 * snake_case. Solo el dueño puede ejecutar esto (RLS en la migración).
 */
export async function updateStore(storeId, patch) {
  if (!storeId) throw new Error('storeService: storeId requerido');
  const row = {};
  if (patch.name !== undefined) row.name = patch.name;
  if (patch.category !== undefined) row.category = patch.category;
  if (patch.description !== undefined) row.description = patch.description;
  if (patch.deliveryTime !== undefined) row.delivery_time = patch.deliveryTime;
  if (patch.address !== undefined) row.address = patch.address;
  if (patch.phone !== undefined) row.phone = patch.phone;
  if (patch.isOpen !== undefined) row.is_open = patch.isOpen;
  if (patch.openHours !== undefined) row.open_hours = patch.openHours;
  if (patch.pagoMovil !== undefined) row.pago_movil = patch.pagoMovil;
  if (patch.latitude !== undefined) row.latitude = Number(patch.latitude);
  if (patch.longitude !== undefined) row.longitude = Number(patch.longitude);

  const { data, error } = await supabase
    .from('stores')
    .update(row)
    .eq('id', storeId)
    .select('*')
    .single();
  if (error) throw error;
  return mapStoreRow(data);
}


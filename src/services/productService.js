import { supabase } from './supabase.js';

// CRUD de productos para el dashboard del comercio. Usa la tabla
// public.products (RLS de dueño ya definida en la migración base) y
// mapea snake_case <-> camelCase.

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
    available: row.available ?? true,
  };
}

function toRowPayload(input) {
  const payload = {};
  if (input.storeId !== undefined) payload.store_id = input.storeId;
  if (input.name !== undefined) payload.name = input.name;
  if (input.description !== undefined) payload.description = input.description;
  if (input.price !== undefined) payload.price = Number(input.price);
  if (input.category !== undefined) payload.category = input.category;
  if (input.imageUrl !== undefined) payload.image_url = input.imageUrl;
  if (input.available !== undefined) payload.available = input.available;
  return payload;
}

export async function listProductsForStore(storeId) {
  if (!storeId) throw new Error('productService: storeId inválido');
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('store_id', storeId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(mapProductRow);
}

export async function createProduct(input) {
  if (!input?.storeId) throw new Error('productService: storeId requerido');
  const payload = toRowPayload({ available: true, ...input });
  const { data, error } = await supabase
    .from('products')
    .insert(payload)
    .select('*')
    .single();
  if (error) throw error;
  return mapProductRow(data);
}

export async function updateProduct(productId, patch) {
  if (!productId) throw new Error('productService: productId requerido');
  const payload = toRowPayload(patch);
  const { data, error } = await supabase
    .from('products')
    .update(payload)
    .eq('id', productId)
    .select('*')
    .single();
  if (error) throw error;
  return mapProductRow(data);
}

export async function deleteProduct(productId) {
  if (!productId) throw new Error('productService: productId requerido');
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', productId);
  if (error) throw error;
}

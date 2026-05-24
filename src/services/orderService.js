import { supabase } from './supabase.js';

export function mapOrderRow(row) {
  if (!row) return null;
  const items = Array.isArray(row.items) ? row.items : [];
  const grandTotal = Number(row.total || 0);
  const deliveryFee = Number(row.delivery_fee || 0);
  const productTotal = Math.max(0, grandTotal - deliveryFee);

  return {
    id: row.id,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    driverId: row.driver_id,
    storeId: row.store_id,
    items,
    productTotal,
    grandTotal,
    deliveryFee,
    deliveryAddress: row.delivery_address,
    userLocation: row.delivery_latitude != null && row.delivery_longitude != null
      ? { lat: Number(row.delivery_latitude), lng: Number(row.delivery_longitude) }
      : null,
  };
}

export async function createOrderRemote(orderPayload) {
  const { data, error } = await supabase
    .from('orders')
    .insert(orderPayload)
    .select('*')
    .single();

  if (error) throw error;
  return mapOrderRow(data);
}


export async function fetchOrdersByCustomerRemote(customerId) {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map(mapOrderRow);
}


export async function fetchOrderByIdRemote(orderId) {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single();

  if (error) throw error;
  return mapOrderRow(data);
}


export async function fetchDispatchableOrdersRemote() {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .in('status', ['READY_TO_DISPATCH', 'DRIVER_ASSIGNED', 'PICKED_UP'])
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map(mapOrderRow);
}

export async function fetchStoreOrdersRemote(storeId) {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('store_id', storeId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map(mapOrderRow);
}

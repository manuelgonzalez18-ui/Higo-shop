import { supabase } from './supabase.js';
import { ORDER_STATUSES } from './orderStatus.js';

function assertNonEmptyId(value, fieldName) {
  if (!value || typeof value !== 'string') {
    throw new Error(`orderService: ${fieldName} inválido`);
  }
}

export function mapOrderRow(row) {
  if (!row) return null;
  const items = Array.isArray(row.items) ? row.items : [];
  const grandTotal = Number(row.total || 0);
  const deliveryFee = Number(row.delivery_fee || 0);
  const productTotal = Math.max(0, grandTotal - deliveryFee);

  const status = ORDER_STATUSES.includes(row.status) ? row.status : 'PENDING_PRODUCT_PAYMENT';

  return {
    id: row.id,
    status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    customerId: row.customer_id ?? null,
    driverId: row.driver_id ?? null,
    storeId: row.store_id,
    items,
    productTotal,
    grandTotal,
    deliveryFee,
    paymentMethod: row.payment_method ?? null,
    paymentStatus: row.payment_status ?? null,
    referenceNumber: row.reference_number ?? null,
    productPaymentStatus: row.product_payment_status ?? null,
    productPaymentReference: row.product_payment_reference ?? null,
    deliveryPaymentStatus: row.delivery_payment_status ?? null,
    deliveryPaymentReference: row.delivery_payment_reference ?? null,
    orderType: row.order_type ?? 'shop',
    deliveryAddress: row.delivery_address,
    userLocation: row.delivery_latitude != null && row.delivery_longitude != null
      ? { lat: Number(row.delivery_latitude), lng: Number(row.delivery_longitude) }
      : null,
  };
}

// Defaults v2: cualquier pedido nuevo arranca con el flujo granular
// de pago dividido (producto al comercio + envío al driver) y queda
// etiquetado como módulo Higo Shop. El llamador puede sobrescribir si
// algún día creamos pedidos de Viajes/Envíos desde la misma tabla.
export async function createOrderRemote(orderPayload) {
  const payload = {
    order_type: 'shop',
    status: 'PENDING_PRODUCT_PAYMENT',
    product_payment_status: 'PENDING_PRODUCT_PAYMENT',
    delivery_payment_status: 'DELIVERY_PAYMENT_PENDING',
    ...orderPayload,
  };

  const { data, error } = await supabase
    .from('orders')
    .insert(payload)
    .select('*')
    .single();

  if (error) throw error;
  return mapOrderRow(data);
}


export async function fetchOrdersByCustomerRemote(customerId) {
  assertNonEmptyId(customerId, 'customerId');

  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map(mapOrderRow);
}


export async function fetchOrderByIdRemote(orderId) {
  assertNonEmptyId(orderId, 'orderId');

  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single();

  if (error) throw error;
  return mapOrderRow(data);
}


// Drivers buscan pedidos en cualquier estado activo del despacho —
// desde que el comercio pide driver hasta antes de que se cierre la
// entrega. Sin los estados granulares acá, los pedidos en
// READY_FOR_DRIVER_MATCH/DRIVER_CANDIDATE_BROADCASTED no aparecían en
// el DriverDashboard tras los renombres v2.
const DISPATCHABLE_STATUSES = [
  'READY_TO_DISPATCH',
  'READY_FOR_DRIVER_MATCH',
  'DRIVER_CANDIDATE_BROADCASTED',
  'DRIVER_ASSIGNED',
  'DRIVER_EN_ROUTE_TO_STORE',
  'PICKED_UP',
  'DRIVER_EN_ROUTE_TO_CUSTOMER',
  'DELIVERY_PAYMENT_PENDING',
  'DELIVERY_PAYMENT_REPORTED',
  'DELIVERY_PAYMENT_CONFIRMED',
];

export async function fetchDispatchableOrdersRemote() {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .in('status', DISPATCHABLE_STATUSES)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map(mapOrderRow);
}

export async function fetchStoreOrdersRemote(storeId) {
  assertNonEmptyId(storeId, 'storeId');

  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('store_id', storeId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map(mapOrderRow);
}

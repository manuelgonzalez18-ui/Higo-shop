import { supabase } from './supabase.js';
import { assertValidOrderStatus } from './orderStatus.js';

function assertValidOrderId(orderId) {
  if (!orderId || typeof orderId !== 'string') {
    throw new Error('orderRealtimeService: orderId inválido');
  }
}

// Cuando el status principal cruza un hito del pago dividido, también
// movemos el sub-estado para que quede coherente en DB sin que cada
// llamador tenga que saber del mapeo. Es un superset — si el status no
// es de pago, no se incluye nada y los sub-estados se respetan.
function paymentSubStatePatch(status) {
  switch (status) {
    case 'PRODUCT_PAYMENT_REPORTED':
      return { product_payment_status: 'PRODUCT_PAYMENT_REPORTED' };
    case 'PRODUCT_PAYMENT_VERIFIED':
    case 'PAYMENT_VERIFIED': // legacy alias
      return { product_payment_status: 'PRODUCT_PAYMENT_VERIFIED' };
    case 'DELIVERY_PAYMENT_REPORTED':
      return { delivery_payment_status: 'DELIVERY_PAYMENT_REPORTED' };
    case 'DELIVERY_PAYMENT_CONFIRMED':
      return { delivery_payment_status: 'DELIVERY_PAYMENT_CONFIRMED' };
    default:
      return null;
  }
}

export async function syncOrderStatus(orderId, status, driverId = null) {
  assertValidOrderId(orderId);
  assertValidOrderStatus(status);

  const patch = {
    status,
    updated_at: new Date().toISOString(),
    ...(paymentSubStatePatch(status) || {}),
  };

  if (driverId) patch.driver_id = driverId;

  const { error } = await supabase
    .from('orders')
    .update(patch)
    .eq('id', orderId)
    .select('id')
    .single();

  if (error) throw error;
}

export function subscribeToOrder(orderId, onChange) {
  assertValidOrderId(orderId);
  if (typeof onChange !== 'function') {
    throw new Error('orderRealtimeService: onChange debe ser una función');
  }

  const channel = supabase
    .channel(`order-status-${orderId}`)
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'orders',
      filter: `id=eq.${orderId}`,
    }, (payload) => onChange(payload.new))
    .subscribe();

  return () => supabase.removeChannel(channel);
}

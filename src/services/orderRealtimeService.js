import { supabase } from './supabase.js';

export async function syncOrderStatus(orderId, status, driverId = null) {
  const patch = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (driverId) patch.driver_id = driverId;

  const { error } = await supabase
    .from('orders')
    .update(patch)
    .eq('id', orderId);

  if (error) throw error;
}

export function subscribeToOrder(orderId, onChange) {
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

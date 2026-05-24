import { supabase } from './supabase.js';

export async function pushDriverLocation({ orderId, driverId, lat, lng, bearing = null, speedKmh = null, accuracyM = null }) {
  const { error } = await supabase.from('driver_locations').insert({
    order_id: orderId,
    driver_id: driverId,
    lat,
    lng,
    bearing,
    speed_kmh: speedKmh,
    accuracy_m: accuracyM,
  });
  if (error) throw error;
}

export async function pushOrderEvent({ orderId, eventType, actorType = 'system', actorId = null, payload = {} }) {
  const { error } = await supabase.from('order_events').insert({
    order_id: orderId,
    event_type: eventType,
    actor_type: actorType,
    actor_id: actorId,
    payload,
  });
  if (error) throw error;
}

export function subscribeToDriverLocations(orderId, onLocation) {
  const channel = supabase
    .channel(`driver-locations-${orderId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'driver_locations',
        filter: `order_id=eq.${orderId}`,
      },
      (payload) => onLocation(payload.new),
    )
    .subscribe();

  return () => supabase.removeChannel(channel);
}

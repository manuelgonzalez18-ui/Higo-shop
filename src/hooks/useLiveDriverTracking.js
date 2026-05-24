import { useEffect, useMemo, useState } from 'react';
import { subscribeToDriverLocations } from '../services/trackingService.js';
import { bearingBetween } from '../services/geolocation.js';

export function useLiveDriverTracking(orderId, fallbackPosition = null) {
  const [driverPos, setDriverPos] = useState(fallbackPosition);
  const [driverBearing, setDriverBearing] = useState(null);
  const [lastSignalAt, setLastSignalAt] = useState(null);

  useEffect(() => {
    if (!orderId) return;
    let prev = null;
    const unsubscribe = subscribeToDriverLocations(orderId, (row) => {
      const next = { lat: Number(row.lat), lng: Number(row.lng) };
      setDriverPos(next);
      setLastSignalAt(row.recorded_at || new Date().toISOString());
      if (prev) setDriverBearing(bearingBetween(prev, next));
      prev = next;
    });

    return unsubscribe;
  }, [orderId]);

  const signalAgeSec = useMemo(() => {
    if (!lastSignalAt) return null;
    return Math.max(0, Math.round((Date.now() - new Date(lastSignalAt).getTime()) / 1000));
  }, [lastSignalAt]);

  return { driverPos, driverBearing, signalAgeSec, lastSignalAt };
}

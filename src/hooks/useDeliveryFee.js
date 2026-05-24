import { useMemo } from 'react';
import { useLocationStore } from '../stores/useLocationStore.js';
import { calculateDistance, formatDistance, estimateDeliveryTime } from '../services/geolocation.js';
import { calculateDeliveryFee, formatCurrency } from '../services/deliveryPricing.js';

export function useDeliveryFee(storeLat, storeLon) {
  const { userLocation } = useLocationStore();

  return useMemo(() => {
    if (!userLocation || storeLat == null || storeLon == null) {
      return {
        distance: 0,
        distanceText: '-- km',
        fee: 0,
        feeText: 'Bs. 0.00',
        estimatedTime: '--',
      };
    }

    const distance = calculateDistance(
      userLocation.lat,
      userLocation.lng,
      storeLat,
      storeLon
    );

    const fee = calculateDeliveryFee(distance);

    return {
      distance,
      distanceText: formatDistance(distance),
      fee,
      feeText: formatCurrency(fee),
      estimatedTime: estimateDeliveryTime(distance),
    };
  }, [userLocation, storeLat, storeLon]);
}

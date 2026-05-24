import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const DEFAULT_LOCATION = { lat: 10.4961, lng: -66.8983 };

export const useLocationStore = create(
  persist(
    (set) => ({
      userLocation: DEFAULT_LOCATION,
      deliveryAddress: 'Caracas, Venezuela',
      isLocating: false,
      error: null,

      setUserLocation: (location) => set({ userLocation: location, error: null }),

      setDeliveryAddress: (address) => set({ deliveryAddress: address }),

      requestLocation: () => {
        set({ isLocating: true, error: null });

        if (!navigator.geolocation) {
          set({ isLocating: false, error: 'Geolocalización no soportada', userLocation: DEFAULT_LOCATION });
          return;
        }

        navigator.geolocation.getCurrentPosition(
          (position) => {
            set({
              userLocation: {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
              },
              isLocating: false,
            });
          },
          () => {
            set({
              isLocating: false,
              error: 'No se pudo obtener la ubicación',
              userLocation: DEFAULT_LOCATION,
            });
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
        );
      },
    }),
    {
      name: 'higo-shop-location',
      partialize: (state) => ({
        userLocation: state.userLocation,
        deliveryAddress: state.deliveryAddress,
      }),
    }
  )
);

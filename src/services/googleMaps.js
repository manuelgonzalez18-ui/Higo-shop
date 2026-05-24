import { useJsApiLoader } from '@react-google-maps/api';

export const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

export const GOOGLE_MAPS_LIBRARIES = ['places', 'geometry'];

// Single shared loader id so the Google Maps script is loaded only once across the app.
const LOADER_ID = 'higo-google-maps';

/**
 * Hook to load the Google Maps JS API. Returns `{ isLoaded, loadError }`.
 */
export function useGoogleMaps() {
  return useJsApiLoader({
    id: LOADER_ID,
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: GOOGLE_MAPS_LIBRARIES,
  });
}

/**
 * Uber-Eats-like map style — flat, neutral, with downplayed POIs.
 */
export const UBER_MAP_STYLE = [
  { featureType: 'poi', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.business', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.medical', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.attraction', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'road', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { featureType: 'water', stylers: [{ color: '#cfe3f7' }] },
  { featureType: 'landscape', stylers: [{ color: '#f5f5f5' }] },
];

export const DEFAULT_MAP_OPTIONS = {
  disableDefaultUI: true,
  zoomControl: false,
  gestureHandling: 'greedy',
  clickableIcons: false,
  styles: UBER_MAP_STYLE,
};

import { useEffect, useState } from 'react';
import { useMapsLibrary } from '@vis.gl/react-google-maps';

// Calls Google Directions API and returns the decoded polyline path so the
// caller can draw a RoutePolyline along the real road network. Falls back to
// the straight-line origin→destination pair if the API is unavailable.
export function useDirections(origin, destination, travelMode = 'DRIVING') {
  const routesLib = useMapsLibrary('routes');
  const [path, setPath] = useState(null);
  const [distance, setDistance] = useState(null);
  const [duration, setDuration] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!routesLib || !origin || !destination) return;

    const service = new routesLib.DirectionsService();
    let cancelled = false;

    service.route(
      {
        origin,
        destination,
        travelMode: routesLib.TravelMode[travelMode] || routesLib.TravelMode.DRIVING,
      },
      (result, status) => {
        if (cancelled) return;
        if (status === 'OK' && result.routes[0]) {
          const route = result.routes[0];
          const overview = route.overview_path.map((p) => ({ lat: p.lat(), lng: p.lng() }));
          setPath(overview);
          const leg = route.legs[0];
          if (leg) {
            setDistance(leg.distance?.value || null);
            setDuration(leg.duration?.value || null);
          }
          setError(null);
        } else {
          setPath([origin, destination]);
          setError(status);
        }
      },
    );

    return () => { cancelled = true; };
  }, [routesLib, origin?.lat, origin?.lng, destination?.lat, destination?.lng, travelMode]);

  return { path, distance, duration, error };
}

import { APIProvider, Map } from '@vis.gl/react-google-maps';
import {
  GOOGLE_MAPS_API_KEY,
  GOOGLE_MAPS_ID,
  GOOGLE_MAPS_LIBRARIES,
  DARK_MAP_STYLES,
} from '../../lib/googleMaps.js';

export function GoogleMapsProvider({ children }) {
  return (
    <APIProvider apiKey={GOOGLE_MAPS_API_KEY} libraries={GOOGLE_MAPS_LIBRARIES}>
      {children}
    </APIProvider>
  );
}

// Single source of truth for our themed Google Map. center is { lat, lng }.
// Wrap in <GoogleMapsProvider> at the page root.
export function MapView({
  center,
  zoom = 14,
  children,
  className,
  style,
  onClick,
  disableUI = true,
  gestureHandling = 'greedy',
}) {
  return (
    <div className={className} style={{ width: '100%', height: '100%', ...style }}>
      <Map
        center={center}
        defaultZoom={zoom}
        mapId={GOOGLE_MAPS_ID}
        styles={GOOGLE_MAPS_ID ? undefined : DARK_MAP_STYLES}
        disableDefaultUI={disableUI}
        gestureHandling={gestureHandling}
        clickableIcons={false}
        onClick={onClick}
        style={{ width: '100%', height: '100%' }}
      >
        {children}
      </Map>
    </div>
  );
}

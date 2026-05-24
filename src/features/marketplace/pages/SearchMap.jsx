import { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useDragControls } from 'framer-motion';
import { Search, MapPin, Star, Navigation, ArrowLeft } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { fetchStores } from '../../../services/storeService.js';
import { useLocationStore } from '../../../stores/useLocationStore.js';
import { calculateDistance, formatDistance } from '../../../services/geolocation.js';
import { Spinner } from '../../../components/ui/Spinner.jsx';
import './SearchMap.css';

// Fix Leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom Icons with emojis
const userIcon = L.divIcon({
  html: '<div style="font-size: 24px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">📍</div>',
  iconSize: [30, 30],
  iconAnchor: [15, 30]
});

const getStoreIcon = (category) => {
  const emojis = {
    restaurant: '🫓',
    pharmacy: '💊',
    bakery: '🥐',
    grocery: '🛒',
    cafe: '☕',
  };
  return L.divIcon({
    html: `<div style="font-size: 24px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.25)); background: white; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; border-radius: 50%; border: 1.5px solid black;">${emojis[category] || '🏪'}</div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18]
  });
};

// Component to dynamically re-center map
function MapController({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, map.getZoom(), { animate: true });
    }
  }, [center, map]);
  return null;
}

export function SearchMap() {
  const [stores, setStores] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { userLocation, requestLocation, isLocating } = useLocationStore();
  const [selectedStore, setSelectedStore] = useState(null);
  const [isSheetExpanded, setIsSheetExpanded] = useState(false);
  const mapRef = useRef(null);

  useEffect(() => {
    fetchStores().then((data) => {
      setStores(data);
      setIsLoading(false);
    });
  }, []);

  const filteredStores = useMemo(() => {
    let list = [...stores];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q) ||
          s.category.toLowerCase().includes(q)
      );
    }

    if (userLocation) {
      list.sort((a, b) => {
        const distA = calculateDistance(userLocation.lat, userLocation.lng, a.latitude, a.longitude);
        const distB = calculateDistance(userLocation.lat, userLocation.lng, b.latitude, b.longitude);
        return distA - distB;
      });
    }
    return list;
  }, [stores, searchQuery, userLocation]);

  const mapCenter = useMemo(() => {
    if (userLocation) return [userLocation.lat, userLocation.lng];
    return [10.4961, -66.8983]; // Caracas Center
  }, [userLocation]);

  const handleMarkerClick = (store) => {
    setSelectedStore(store);
    setIsSheetExpanded(false); // keep standard height or center view
  };

  const centerOnUser = () => {
    requestLocation();
  };

  const categoryLabels = {
    restaurant: 'Restaurante',
    pharmacy: 'Farmacia',
    bakery: 'Panadería',
    grocery: 'Bodega',
    cafe: 'Café',
  };

  return (
    <div className="search-map-page">
      {/* Top Search Bar Widget */}
      <div className="search-map-header">
        <Link to="/" className="back-btn-round">
          <ArrowLeft size={20} />
        </Link>
        <div className="search-map-input-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Busca tiendas y productos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Leaflet Map Area (40% default space) */}
      <div className="search-map-container">
        <MapContainer
          center={mapCenter}
          zoom={14}
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
          attributionControl={false}
          ref={mapRef}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <MapController center={mapCenter} />

          {/* User Marker */}
          {userLocation && (
            <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
              <Popup>📍 Tu ubicación actual</Popup>
            </Marker>
          )}

          {/* Store Markers */}
          {filteredStores.map((store) => (
            <Marker
              key={store.id}
              position={[store.latitude, store.longitude]}
              icon={getStoreIcon(store.category)}
              eventHandlers={{
                click: () => handleMarkerClick(store),
              }}
            >
              <Popup>
                <div className="map-popup-content">
                  <div className="map-popup-name">{store.name}</div>
                  <div className="map-popup-meta">★ {store.rating.toFixed(1)} • {store.deliveryTime}</div>
                  <Link to={`/store/${store.id}`} className="map-popup-link">
                    Pedir ahora →
                  </Link>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* Locate Me Button */}
        <button 
          className={`locate-me-btn ${isLocating ? 'locating' : ''}`} 
          onClick={centerOnUser}
          title="Centrar en mi ubicación"
        >
          <Navigation size={20} style={{ transform: 'rotate(45deg)' }} />
        </button>
      </div>

      {/* Sliding BottomSheet (60%) */}
      <motion.div
        className={`search-bottom-sheet ${isSheetExpanded ? 'expanded' : ''}`}
        initial={{ y: '70%' }}
        animate={{ y: isSheetExpanded ? '8%' : '42%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 220 }}
      >
        {/* Handle Bar */}
        <div 
          className="bottom-sheet-handle-wrapper"
          onClick={() => setIsSheetExpanded(!isSheetExpanded)}
        >
          <div className="bottom-sheet-handle"></div>
        </div>

        {/* Sheet Contents */}
        <div className="bottom-sheet-content">
          <div className="sheet-header">
            <h3>Entregas cerca de ti</h3>
            <span className="sheet-stores-count">{filteredStores.length} tiendas</span>
          </div>

          {isLoading ? (
            <div className="sheet-spinner-state">
              <Spinner size="md" />
              <p>Buscando tiendas...</p>
            </div>
          ) : filteredStores.length > 0 ? (
            <div className="sheet-stores-list">
              {filteredStores.map((store) => {
                const distance = userLocation
                  ? calculateDistance(userLocation.lat, userLocation.lng, store.latitude, store.longitude)
                  : null;
                const isSelected = selectedStore?.id === store.id;

                return (
                  <div
                    key={store.id}
                    className={`sheet-store-card ${isSelected ? 'highlighted' : ''}`}
                    onClick={() => {
                      setSelectedStore(store);
                      if (userLocation) {
                        // center on store
                        setSelectedStore(store);
                      }
                    }}
                  >
                    <div className={`sheet-store-avatar sheet-store-avatar--${store.category}`}>
                      {store.category === 'restaurant' ? '🫓' : store.category === 'pharmacy' ? '💊' : store.category === 'bakery' ? '🥐' : store.category === 'grocery' ? '🛒' : '☕'}
                    </div>

                    <div className="sheet-store-details">
                      <div className="sheet-store-name">{store.name}</div>
                      <div className="sheet-store-rating-row">
                        <span className="sheet-store-rating">★ {store.rating.toFixed(1)}</span>
                        <span className="sheet-store-bullet">•</span>
                        <span className="sheet-store-category">{categoryLabels[store.category] || 'Comercio'}</span>
                        <span className="sheet-store-bullet">•</span>
                        <span className="sheet-store-time">{store.deliveryTime}</span>
                      </div>
                      <div className="sheet-store-subdetails">
                        {distance !== null && (
                          <span className="sheet-store-distance">
                            <Navigation size={12} /> {formatDistance(distance)} de ti
                          </span>
                        )}
                        <span className="sheet-store-address truncate">{store.address}</span>
                      </div>
                    </div>

                    <Link to={`/store/${store.id}`} className="sheet-store-cta" id={`store-search-${store.id}`}>
                      Ver
                    </Link>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="sheet-empty-state">
              <p>No hay tiendas que coincidan con tu búsqueda.</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

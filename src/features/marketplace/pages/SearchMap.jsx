import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Navigation, ArrowLeft } from 'lucide-react';
import { InfoWindow } from '@vis.gl/react-google-maps';
import { fetchStores } from '../../../services/storeService.js';
import { useLocationStore } from '../../../stores/useLocationStore.js';
import { calculateDistance, formatDistance } from '../../../services/geolocation.js';
import { Spinner } from '../../../components/ui/Spinner.jsx';
import { GoogleMapsProvider, MapView } from '../../../components/maps/MapView.jsx';
import { EmojiMarker } from '../../../components/maps/EmojiMarker.jsx';
import './SearchMap.css';

const CARACAS_CENTER = { lat: 10.4961, lng: -66.8983 };

export function SearchMap() {
  const [stores, setStores] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { userLocation, requestLocation, isLocating } = useLocationStore();
  const [selectedStore, setSelectedStore] = useState(null);
  const [isSheetExpanded, setIsSheetExpanded] = useState(false);

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
    if (userLocation) return { lat: userLocation.lat, lng: userLocation.lng };
    return CARACAS_CENTER;
  }, [userLocation]);

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
    <GoogleMapsProvider>
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

        {/* Google Map Area */}
        <div className="search-map-container">
          <MapView center={mapCenter} zoom={14}>
            {userLocation && (
              <EmojiMarker
                position={{ lat: userLocation.lat, lng: userLocation.lng }}
                preset="user"
                zIndex={50}
              />
            )}

            {filteredStores.map((store) => (
              <EmojiMarker
                key={store.id}
                position={{ lat: store.latitude, lng: store.longitude }}
                preset={store.category}
                onClick={() => setSelectedStore(store)}
              />
            ))}

            {selectedStore && (
              <InfoWindow
                position={{ lat: selectedStore.latitude, lng: selectedStore.longitude }}
                onCloseClick={() => setSelectedStore(null)}
                pixelOffset={[0, -40]}
              >
                <div className="map-popup-content">
                  <div className="map-popup-name">{selectedStore.name}</div>
                  <div className="map-popup-meta">★ {selectedStore.rating.toFixed(1)} • {selectedStore.deliveryTime}</div>
                  <Link to={`/store/${selectedStore.id}`} className="map-popup-link">
                    Pedir ahora →
                  </Link>
                </div>
              </InfoWindow>
            )}
          </MapView>

          <button
            className={`locate-me-btn ${isLocating ? 'locating' : ''}`}
            onClick={centerOnUser}
            title="Centrar en mi ubicación"
          >
            <Navigation size={20} style={{ transform: 'rotate(45deg)' }} />
          </button>
        </div>

        {/* Sliding BottomSheet */}
        <motion.div
          className={`search-bottom-sheet ${isSheetExpanded ? 'expanded' : ''}`}
          initial={{ y: '70%' }}
          animate={{ y: isSheetExpanded ? '8%' : '42%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 220 }}
        >
          <div
            className="bottom-sheet-handle-wrapper"
            onClick={() => setIsSheetExpanded(!isSheetExpanded)}
          >
            <div className="bottom-sheet-handle"></div>
          </div>

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
                      onClick={() => setSelectedStore(store)}
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
    </GoogleMapsProvider>
  );
}

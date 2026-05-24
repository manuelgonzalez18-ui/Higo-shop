import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleMap, Marker, Polyline, OverlayView } from '@react-google-maps/api';
import {
  Navigation, Clock, Phone, MessageCircle, Store as StoreIcon,
  MapPin, Package, ChevronRight, Bike, ShoppingBag, Locate
} from 'lucide-react';
import { useGoogleMaps, DEFAULT_MAP_OPTIONS } from '../../../services/googleMaps.js';
import { useOrderStore } from '../../../stores/useOrderStore.js';
import { useLocationStore } from '../../../stores/useLocationStore.js';
import { calculateDistance, formatDistance } from '../../../services/geolocation.js';
import { Spinner } from '../../../components/ui/Spinner.jsx';
import './LiveDriverMap.css';

const ACTIVE_STATUSES = ['DRIVER_ASSIGNED', 'PICKED_UP'];

/**
 * Linear interpolation between two LatLng points.
 */
function lerp(from, to, ratio) {
  return {
    lat: from.lat + (to.lat - from.lat) * ratio,
    lng: from.lng + (to.lng - from.lng) * ratio,
  };
}

/**
 * Bearing in degrees between two coordinates (used to rotate the driver scooter pin).
 */
function bearing(from, to) {
  const dLng = (to.lng - from.lng) * (Math.PI / 180);
  const lat1 = from.lat * (Math.PI / 180);
  const lat2 = to.lat * (Math.PI / 180);
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

export function LiveDriverMap() {
  const navigate = useNavigate();
  const { isLoaded } = useGoogleMaps();
  const { orders, updateOrderStatus } = useOrderStore();
  const { userLocation } = useLocationStore();
  const mapRef = useRef(null);

  const activeOrder = useMemo(
    () => orders.find((o) => ACTIVE_STATUSES.includes(o.status)),
    [orders]
  );

  // The Higo Driver state machine: 'to_store' → 'at_store' → 'to_client' → 'delivered'.
  const [leg, setLeg] = useState('idle');
  const [driverPos, setDriverPos] = useState(null);
  const [driverHeading, setDriverHeading] = useState(0);
  const [progress, setProgress] = useState(0); // 0..1 within current leg

  // Initialize driver position & leg whenever the active order changes
  useEffect(() => {
    if (!activeOrder) {
      setLeg('idle');
      setDriverPos(null);
      setProgress(0);
      return;
    }
    const store = activeOrder.storeLocation;
    // Driver starts a few blocks south-west of the store
    const start = { lat: store.lat + 0.0055, lng: store.lng - 0.0072 };
    if (activeOrder.status === 'DRIVER_ASSIGNED') {
      setLeg('to_store');
      setDriverPos(start);
    } else if (activeOrder.status === 'PICKED_UP') {
      setLeg('to_client');
      setDriverPos({ lat: store.lat, lng: store.lng });
    }
    setProgress(0);
  }, [activeOrder?.id, activeOrder?.status]);

  // Animation tick — moves the driver along the current leg
  useEffect(() => {
    if (!activeOrder || leg === 'idle' || leg === 'at_store' || leg === 'delivered') return;

    const store = activeOrder.storeLocation;
    const start = { lat: store.lat + 0.0055, lng: store.lng - 0.0072 };
    const user = activeOrder.userLocation;

    const from = leg === 'to_store' ? start : { lat: store.lat, lng: store.lng };
    const to = leg === 'to_store' ? { lat: store.lat, lng: store.lng } : { lat: user.lat, lng: user.lng };

    const stepMs = 1200;
    const totalSteps = 14;
    let step = 0;

    const interval = setInterval(() => {
      step += 1;
      const ratio = Math.min(1, step / totalSteps);
      const next = lerp(from, to, ratio);
      const heading = bearing(driverPos || from, next);
      setDriverPos(next);
      setDriverHeading(heading);
      setProgress(ratio);

      if (ratio >= 1) {
        clearInterval(interval);
        if (leg === 'to_store') {
          setLeg('at_store');
          // After 3s waiting at store, auto-progress order to PICKED_UP
          setTimeout(() => {
            updateOrderStatus(activeOrder.id, 'PICKED_UP');
            setLeg('to_client');
            setDriverPos({ lat: store.lat, lng: store.lng });
            setProgress(0);
          }, 3000);
        } else if (leg === 'to_client') {
          setLeg('delivered');
          updateOrderStatus(activeOrder.id, 'DELIVERED');
        }
      }
    }, stepMs);

    return () => clearInterval(interval);
  }, [leg, activeOrder?.id]);

  // Fit map to bounds whenever the active order or driver position changes
  useEffect(() => {
    if (!isLoaded || !mapRef.current || !activeOrder) return;
    const map = mapRef.current;
    const bounds = new window.google.maps.LatLngBounds();
    if (driverPos) bounds.extend(driverPos);
    bounds.extend(activeOrder.storeLocation);
    bounds.extend(activeOrder.userLocation);
    map.fitBounds(bounds, { top: 80, right: 60, bottom: 280, left: 60 });
  }, [isLoaded, activeOrder?.id, driverPos]);

  const center = useMemo(() => {
    if (activeOrder) {
      return {
        lat: (activeOrder.storeLocation.lat + activeOrder.userLocation.lat) / 2,
        lng: (activeOrder.storeLocation.lng + activeOrder.userLocation.lng) / 2,
      };
    }
    return userLocation || { lat: 10.4961, lng: -66.8983 };
  }, [activeOrder, userLocation]);

  const etaMinutes = useMemo(() => {
    if (!activeOrder || !driverPos) return null;
    const target = leg === 'to_store' ? activeOrder.storeLocation : activeOrder.userLocation;
    const distKm = calculateDistance(driverPos.lat, driverPos.lng, target.lat, target.lng);
    const minutes = Math.max(1, Math.round((distKm / 22) * 60) + 2);
    return minutes;
  }, [driverPos, leg, activeOrder]);

  if (!isLoaded) {
    return (
      <div className="live-map-loading">
        <Spinner size="lg" />
        <p>Cargando mapa en vivo…</p>
      </div>
    );
  }

  return (
    <div className="live-map-page">
      <GoogleMap
        mapContainerClassName="live-map-canvas"
        center={center}
        zoom={14}
        options={{ ...DEFAULT_MAP_OPTIONS, mapTypeControl: false }}
        onLoad={(m) => (mapRef.current = m)}
      >
        {activeOrder && (
          <>
            {/* Route polyline */}
            <Polyline
              path={[
                leg === 'to_store'
                  ? { lat: activeOrder.storeLocation.lat + 0.0055, lng: activeOrder.storeLocation.lng - 0.0072 }
                  : { lat: activeOrder.storeLocation.lat, lng: activeOrder.storeLocation.lng },
                leg === 'to_store'
                  ? { lat: activeOrder.storeLocation.lat, lng: activeOrder.storeLocation.lng }
                  : { lat: activeOrder.userLocation.lat, lng: activeOrder.userLocation.lng },
              ]}
              options={{
                strokeColor: '#06C167',
                strokeOpacity: 0,
                icons: [
                  {
                    icon: {
                      path: 'M 0,-1 0,1',
                      strokeOpacity: 1,
                      strokeColor: '#06C167',
                      scale: 4,
                    },
                    offset: '0',
                    repeat: '14px',
                  },
                ],
              }}
            />

            {/* Store pin */}
            <OverlayView
              position={activeOrder.storeLocation}
              mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
            >
              <div className="live-pin live-pin--store">
                <StoreIcon size={16} />
              </div>
            </OverlayView>

            {/* User home pin */}
            <OverlayView
              position={activeOrder.userLocation}
              mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
            >
              <div className="live-pin live-pin--home">
                <MapPin size={16} />
              </div>
            </OverlayView>

            {/* Driver pin — animated scooter */}
            {driverPos && (
              <OverlayView
                position={driverPos}
                mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
              >
                <div className="live-pin live-pin--driver">
                  <div className="live-pin__pulse" />
                  <div
                    className="live-pin__driver-icon"
                    style={{ transform: `rotate(${driverHeading - 90}deg)` }}
                  >
                    <Bike size={18} />
                  </div>
                </div>
              </OverlayView>
            )}
          </>
        )}

        {!activeOrder && userLocation && (
          <OverlayView position={userLocation} mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}>
            <div className="live-pin live-pin--home">
              <MapPin size={16} />
            </div>
          </OverlayView>
        )}
      </GoogleMap>

      {/* Locate me */}
      <button
        className="live-locate-btn"
        onClick={() => {
          if (mapRef.current && userLocation) {
            mapRef.current.panTo(userLocation);
          }
        }}
        aria-label="Centrar en mi ubicación"
      >
        <Locate size={18} />
      </button>

      {/* Top status chip */}
      <AnimatePresence>
        {activeOrder && (
          <motion.div
            className="live-top-status"
            initial={{ y: -40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -40, opacity: 0 }}
          >
            <span className="live-top-status__dot" />
            <span>
              {leg === 'to_store' && 'Higo Driver yendo a la tienda'}
              {leg === 'at_store' && 'Recogiendo tu pedido en la tienda'}
              {leg === 'to_client' && '¡En camino a tu dirección!'}
              {leg === 'delivered' && '¡Pedido entregado!'}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom sheet — active order details or empty state */}
      <motion.div
        className="live-sheet"
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 240, damping: 26 }}
      >
        {activeOrder ? (
          <ActiveOrderCard
            order={activeOrder}
            leg={leg}
            progress={progress}
            etaMinutes={etaMinutes}
            onOpenOrder={() => navigate(`/orders/${activeOrder.id}`)}
          />
        ) : (
          <EmptyTrackerCard onBrowse={() => navigate('/')} />
        )}
      </motion.div>
    </div>
  );
}

function ActiveOrderCard({ order, leg, progress, etaMinutes, onOpenOrder }) {
  const stageLabel =
    leg === 'to_store' ? 'En camino a recoger' :
    leg === 'at_store' ? 'En la tienda' :
    leg === 'to_client' ? 'En camino a ti' :
    'Entregado';

  const stageIcon =
    leg === 'to_store' ? <Package size={14} /> :
    leg === 'at_store' ? <ShoppingBag size={14} /> :
    leg === 'to_client' ? <Bike size={14} /> :
    <Navigation size={14} />;

  const totalProgress = leg === 'to_store' ? progress * 0.5
    : leg === 'at_store' ? 0.5
    : leg === 'to_client' ? 0.5 + progress * 0.5
    : 1;

  return (
    <div className="live-sheet__inner">
      <div className="live-sheet__grip" />

      {/* ETA Hero */}
      <div className="live-eta">
        <div className="live-eta__left">
          <div className="live-eta__time">
            {etaMinutes ? `${etaMinutes} min` : '— min'}
          </div>
          <div className="live-eta__meta">
            <span className="live-eta__stage-chip">
              {stageIcon}
              {stageLabel}
            </span>
          </div>
        </div>
        <div className="live-eta__driver-avatar">
          <Bike size={22} />
        </div>
      </div>

      {/* Progress bar */}
      <div className="live-progress-track">
        <div className="live-progress-fill" style={{ width: `${Math.round(totalProgress * 100)}%` }} />
        <div className="live-progress-stops">
          <span className={`live-progress-stop ${totalProgress > 0 ? 'reached' : ''}`}>
            <StoreIcon size={10} />
          </span>
          <span className={`live-progress-stop ${totalProgress >= 0.5 ? 'reached' : ''}`}>
            <Package size={10} />
          </span>
          <span className={`live-progress-stop ${totalProgress >= 1 ? 'reached' : ''}`}>
            <MapPin size={10} />
          </span>
        </div>
      </div>

      <div className="live-stop-labels">
        <span>Tienda</span>
        <span>Retiro</span>
        <span>Entrega</span>
      </div>

      {/* Order card */}
      <button className="live-order-link" onClick={onOpenOrder}>
        <div className="live-order-link__icon">
          <StoreIcon size={18} />
        </div>
        <div className="live-order-link__text">
          <div className="live-order-link__title">{order.storeName}</div>
          <div className="live-order-link__subtitle">
            Pedido #{order.id.slice(-6).toUpperCase()} · {order.items.length} artículos
          </div>
        </div>
        <ChevronRight size={18} />
      </button>

      {/* Driver contact actions */}
      <div className="live-driver-actions">
        <button className="live-driver-action live-driver-action--ghost">
          <MessageCircle size={16} />
          Mensaje
        </button>
        <button className="live-driver-action live-driver-action--ghost">
          <Phone size={16} />
          Llamar
        </button>
      </div>
    </div>
  );
}

function EmptyTrackerCard({ onBrowse }) {
  return (
    <div className="live-sheet__inner live-sheet__inner--empty">
      <div className="live-sheet__grip" />
      <div className="live-empty">
        <div className="live-empty__icon">
          <Bike size={28} />
        </div>
        <h3>Sin pedidos en curso</h3>
        <p>
          Cuando tengas un pedido activo, podrás ver a tu Higo Driver moverse en tiempo
          real desde la tienda hasta tu puerta.
        </p>
        <button className="live-empty__cta" onClick={onBrowse}>
          Pedir ahora
        </button>
      </div>
    </div>
  );
}

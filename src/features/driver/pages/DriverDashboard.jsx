import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Truck, Navigation, MapPin, Store, MessageCircle, Send, Check, Phone,
  TrendingUp, AlertTriangle, ShieldCheck, CreditCard, Banknote, Smartphone
} from 'lucide-react';
import { useOrderStore } from '../../../stores/useOrderStore.js';
import { useChatStore } from '../../../stores/useChatStore.js';
import { formatCurrency } from '../../../services/deliveryPricing.js';
import { MapView, AutoFitBounds } from '../../../components/maps/MapView.jsx';
import { EmojiMarker } from '../../../components/maps/EmojiMarker.jsx';
import { RoutePolyline } from '../../../components/maps/RoutePolyline.jsx';
import { useDirections } from '../../../hooks/useDirections.js';
import { formatDurationMin } from '../../../services/geolocation.js';
import './DriverDashboard.css';

function DriverDeliveryMap({ storeLatLng, userLatLng, status }) {
  const { path, duration } = useDirections(storeLatLng, userLatLng);
  const mapCenter = useMemo(() => ({
    lat: (storeLatLng.lat + userLatLng.lat) / 2,
    lng: (storeLatLng.lng + userLatLng.lng) / 2,
  }), [storeLatLng.lat, storeLatLng.lng, userLatLng.lat, userLatLng.lng]);

  // Highlight different leg colors depending on driver progress.
  const isEnRoute = status === 'PICKED_UP';
  const routeColor = isEnRoute ? '#10B981' : '#3B82F6';

  return (
    <div className="driver-mini-map">
      <MapView center={mapCenter} zoom={13}>
        <AutoFitBounds
          points={[storeLatLng, userLatLng]}
          padding={50}
          fitKey={`${storeLatLng.lat},${userLatLng.lat}`}
        />
        <EmojiMarker position={storeLatLng} preset="store" zIndex={20} />
        <EmojiMarker position={userLatLng} preset="user" zIndex={20} />
        {path && <RoutePolyline path={path} color={routeColor} weight={4} opacity={0.9} />}
      </MapView>
      {duration != null && (
        <div className="driver-mini-map__eta">
          🛵 {formatDurationMin(duration)} en moto
        </div>
      )}
    </div>
  );
}

export function DriverDashboard() {
  const { orders, updateOrderStatus, assignDriver } = useOrderStore();
  const { chats, addMessage, initializeChat } = useChatStore();
  
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [chatInputText, setChatInputText] = useState('');

  // 1. Filter available dispatchable orders in the zone (READY_TO_DISPATCH)
  const dispatchableOrders = useMemo(() => {
    return orders.filter(o => o.status === 'READY_TO_DISPATCH');
  }, [orders]);

  // 2. Filter orders assigned to this driver ('driver-carlos') that are active
  const myActiveOrders = useMemo(() => {
    return orders.filter(o => 
      o.driverId === 'driver-carlos' && 
      ['DRIVER_ASSIGNED', 'PICKED_UP'].includes(o.status)
    );
  }, [orders]);

  // 3. Filter orders assigned to this driver that are completed
  const myCompletedOrders = useMemo(() => {
    return orders.filter(o => 
      o.driverId === 'driver-carlos' && 
      o.status === 'DELIVERED'
    );
  }, [orders]);

  // Combined selected order view
  const selectedOrder = useMemo(() => {
    if (selectedOrderId) {
      return orders.find(o => o.id === selectedOrderId) || null;
    }
    return myActiveOrders[0] || dispatchableOrders[0] || null;
  }, [orders, selectedOrderId, myActiveOrders, dispatchableOrders]);

  // Keep selectedOrderId updated
  useEffect(() => {
    if (selectedOrder) {
      setSelectedOrderId(selectedOrder.id);
    }
  }, [selectedOrder]);

  const orderChat = useMemo(() => {
    if (!selectedOrder) return { driverMessages: [] };
    initializeChat(selectedOrder.id);
    return chats[selectedOrder.id] || { driverMessages: [] };
  }, [selectedOrder, chats]);

  // Handles sending driver message
  const handleSendDriverMessage = (e) => {
    e.preventDefault();
    if (!chatInputText.trim() || !selectedOrder) return;

    addMessage(selectedOrder.id, 'driverMessages', {
      sender: 'driver',
      text: chatInputText
    });
    setChatInputText('');
  };

  const handleAcceptDelivery = (orderId) => {
    assignDriver(orderId, 'driver-carlos');
    
    // Add greeting message
    addMessage(orderId, 'driverMessages', {
      sender: 'driver',
      text: '🛵 Higo Driver "Carlos Mendoza" ha aceptado tu entrega y va en camino al local.',
      system: true
    });

    addMessage(orderId, 'driverMessages', {
      sender: 'driver',
      text: '¡Hola! Buenas noches, soy tu Higo Driver. Ya voy en camino a retirar tu pedido en el comercio. ⚡'
    });

    addMessage(orderId, 'storeMessages', {
      sender: 'store',
      text: '🛵 El repartidor Carlos Mendoza ha aceptado el despacho y va en camino al local.'
    });
  };

  const handlePickupPackage = (orderId) => {
    updateOrderStatus(orderId, 'PICKED_UP');
    
    addMessage(orderId, 'driverMessages', {
      sender: 'driver',
      text: '🚀 ¡Pedido retirado con éxito! Voy en camino a tu ubicación. Ya puedes rastrearme en el mapa.'
    });
  };

  const handleDeliverPackage = (orderId) => {
    updateOrderStatus(orderId, 'DELIVERED');
    
    addMessage(orderId, 'driverMessages', {
      sender: 'driver',
      text: '👋 ¡He llegado a tu ubicación! Estoy afuera para entregarte el pedido. ¡Muchas gracias!'
    });
  };

  // Calculations for Driver Statistics
  const stats = useMemo(() => {
    const totalEarnings = myCompletedOrders.reduce((sum, o) => sum + o.deliveryFee, 0);
    return {
      trips: myCompletedOrders.length,
      earnings: totalEarnings,
    };
  }, [myCompletedOrders]);

  return (
    <div className="driver-dashboard animate-fade-in">
      {/* 1. STATUS SUMMARY BANNER */}
      <div className="driver-hero-header">
        <div className="driver-hero-header__logo">
          <Truck size={22} />
        </div>
        <div className="driver-profile-info">
          <h1>Panel de Higo Driver</h1>
          <span>Conductor: <strong>Carlos Mendoza (Moto)</strong></span>
        </div>
        <div className="driver-stats">
          <div className="stat-card">
            <span className="label">Viajes</span>
            <span className="val">{stats.trips}</span>
          </div>
          <div className="stat-card stat-card--earnings">
            <span className="label">Gagancias</span>
            <span className="val">{formatCurrency(stats.earnings)}</span>
          </div>
        </div>
      </div>

      {/* 2. MAIN ACTIVE DELIVERY AREA */}
      {selectedOrder ? (
        <div className="driver-split-layout">
          {/* Left Details Panel */}
          <div className="driver-delivery-details">
            <div className="delivery-card">
              <div className="delivery-card__title">
                <span>Orden Ref: {selectedOrder.id.slice(0, 8)}...</span>
                <span className={`status-pill status-pill--${selectedOrder.status.toLowerCase()}`}>
                  {selectedOrder.status}
                </span>
              </div>

              {selectedOrder.storeLocation && selectedOrder.userLocation && (
                <DriverDeliveryMap
                  storeLatLng={selectedOrder.storeLocation}
                  userLatLng={selectedOrder.userLocation}
                  status={selectedOrder.status}
                />
              )}

              {/* ROUTE INFO */}
              <div className="delivery-route-block">
                <div className="route-node">
                  <div className="node-icon node-icon--store">🏪</div>
                  <div className="node-details">
                    <span className="label">Comercio (Retiro)</span>
                    <strong className="name">{selectedOrder.storeName}</strong>
                    <span className="address">Av. Francisco de Miranda, Caracas</span>
                  </div>
                </div>
                <div className="route-line" />
                <div className="route-node">
                  <div className="node-icon node-icon--user">📍</div>
                  <div className="node-details">
                    <span className="label">Cliente (Entrega)</span>
                    <strong className="name">{selectedOrder.deliveryAddress}</strong>
                  </div>
                </div>
              </div>

              {/* SMART PAYMENT INFO */}
              <div className="driver-payment-card">
                <h4>Método de Pago del Envío</h4>
                <div className="payment-row">
                  {selectedOrder.payment_method === 'cash' ? (
                    <>
                      <div className="payment-method-badge">
                        <Banknote size={16} />
                        Efectivo al Conductor
                      </div>
                      <div className="payout-amount">
                        Tarifa: {formatCurrency(selectedOrder.deliveryFee)}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="payment-method-badge payment-method-badge--pago-movil">
                        <Smartphone size={16} />
                        Pago Móvil al Conductor
                      </div>
                      <div className="payout-amount">
                        Tarifa: {formatCurrency(selectedOrder.deliveryFee)}
                      </div>
                    </>
                  )}
                </div>
                {selectedOrder.payment_method === 'cash' && selectedOrder.paidWithAmount > 0 && (
                  <div className="payment-change-alert">
                    ⚠️ Cliente paga con <strong>{formatCurrency(selectedOrder.paidWithAmount)}</strong>. Llevar vuelto de: <strong>{formatCurrency(selectedOrder.changeAmount)}</strong>
                  </div>
                )}
              </div>

              {/* ACTION BUTTONS */}
              <div className="driver-action-buttons">
                {selectedOrder.status === 'READY_TO_DISPATCH' && (
                  <button
                    className="driver-btn driver-btn--primary"
                    onClick={() => handleAcceptDelivery(selectedOrder.id)}
                  >
                    🛵 Aceptar este Despacho
                  </button>
                )}

                {selectedOrder.status === 'DRIVER_ASSIGNED' && (
                  <button
                    className="driver-btn driver-btn--success"
                    onClick={() => handlePickupPackage(selectedOrder.id)}
                  >
                    📦 Confirmar Retiro en Comercio
                  </button>
                )}

                {selectedOrder.status === 'PICKED_UP' && (
                  <button
                    className="driver-btn driver-btn--complete"
                    onClick={() => handleDeliverPackage(selectedOrder.id)}
                  >
                    🏁 Completar Entrega del Pedido
                  </button>
                )}

                {selectedOrder.status === 'DELIVERED' && (
                  <div className="driver-status-delivered">
                    <ShieldCheck size={20} />
                    ¡Entrega Completada con éxito!
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Chat Panel */}
          <div className="driver-chat-panel">
            <div className="driver-chat-header">
              <MessageCircle size={16} />
              <h4>Chat con el Cliente</h4>
            </div>
            <div className="driver-chat-messages">
              {orderChat.driverMessages.map(msg => {
                if (msg.system) {
                  return (
                    <div key={msg.id} className="driver-system-message">
                      <span>{msg.text}</span>
                    </div>
                  );
                }
                const isMe = msg.sender === 'driver';
                return (
                  <div key={msg.id} className={`driver-chat-bubble-wrapper ${isMe ? 'me' : 'other'}`}>
                    <div className={`driver-chat-bubble ${isMe ? 'me' : 'other'}`}>
                      <p>{msg.text}</p>
                      <span className="timestamp">
                        {new Date(msg.timestamp).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
            <form className="driver-chat-form" onSubmit={handleSendDriverMessage}>
              <input
                type="text"
                placeholder="Escribe al cliente..."
                value={chatInputText}
                onChange={(e) => setChatInputText(e.target.value)}
                disabled={['READY_TO_DISPATCH', 'DELIVERED'].includes(selectedOrder.status)}
              />
              <button
                type="submit"
                disabled={!chatInputText.trim() || ['READY_TO_DISPATCH', 'DELIVERED'].includes(selectedOrder.status)}
              >
                <Send size={15} />
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="driver-empty-dashboard">
          <TrendingUp size={48} strokeWidth={1} color="var(--higo-gray-300)" />
          <h3>Sin entregas activas</h3>
          <p>Conéctate y espera a que los comercios preparen órdenes en la zona. ¡Tus solicitudes de envío aparecerán aquí!</p>
        </div>
      )}

      {/* 3. BOTTOM PENDING REQUESTS PANEL */}
      {dispatchableOrders.length > 0 && (
        <div className="driver-pending-pane">
          <div className="pending-header">
            <AlertTriangle size={16} color="var(--higo-warning)" />
            <h4>Despachos Pendientes en Higuerote ({dispatchableOrders.length})</h4>
          </div>
          <div className="pending-list">
            {dispatchableOrders.map(o => (
              <div key={o.id} className="pending-card">
                <div className="pending-card__info">
                  <div className="store-name">🏪 {o.storeName}</div>
                  <div className="delivery-address">📍 Hacia: {o.deliveryAddress}</div>
                </div>
                <div className="pending-card__actions">
                  <span className="fee">{formatCurrency(o.deliveryFee)}</span>
                  <button
                    className="accept-mini-btn"
                    onClick={() => handleAcceptDelivery(o.id)}
                  >
                    Aceptar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

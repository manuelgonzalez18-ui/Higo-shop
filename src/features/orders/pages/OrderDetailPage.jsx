import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Store, Truck, Navigation, Clock,
  Send, ShieldAlert, Image, Check, Smartphone, Sparkles
} from 'lucide-react';
import { useOrderStore } from '../../../stores/useOrderStore.js';
import { useChatStore } from '../../../stores/useChatStore.js';
import { fetchStoreById } from '../../../services/storeService.js';
import { formatCurrency } from '../../../services/deliveryPricing.js';
import { useDirections } from '../../../hooks/useDirections.js';
import { Spinner } from '../../../components/ui/Spinner.jsx';
import { GoogleMapsProvider, MapView } from '../../../components/maps/MapView.jsx';
import { EmojiMarker } from '../../../components/maps/EmojiMarker.jsx';
import { RoutePolyline } from '../../../components/maps/RoutePolyline.jsx';
import './OrderDetailPage.css';

const STATUS_STEPS = [
  { id: 'PENDING_PAYMENT', label: 'Pago', icon: '💳' },
  { id: 'PAYMENT_VERIFIED', label: 'Verificado', icon: '✅' },
  { id: 'PREPARING', label: 'Cocina', icon: '👨‍🍳' },
  { id: 'READY_TO_DISPATCH', label: 'Listo', icon: '📦' },
  { id: 'DRIVER_ASSIGNED', label: 'Asignado', icon: '🛵' },
  { id: 'PICKED_UP', label: 'En Camino', icon: '🚀' },
  { id: 'DELIVERED', label: 'Entregado', icon: '🏁' }
];

// Computes driver position along a polyline path given a 0..1 progress ratio.
function interpolateAlongPath(path, ratio) {
  if (!path || path.length < 2) return null;
  if (ratio <= 0) return path[0];
  if (ratio >= 1) return path[path.length - 1];
  const target = ratio * (path.length - 1);
  const idx = Math.floor(target);
  const frac = target - idx;
  const a = path[idx];
  const b = path[idx + 1];
  return {
    lat: a.lat + (b.lat - a.lat) * frac,
    lng: a.lng + (b.lng - a.lng) * frac,
  };
}

function TrackingMap({ order, currentLeg, legStep }) {
  const storeLatLng = useMemo(() => ({
    lat: order.storeLocation.lat,
    lng: order.storeLocation.lng,
  }), [order.storeLocation.lat, order.storeLocation.lng]);

  const userLatLng = useMemo(() => ({
    lat: order.userLocation.lat,
    lng: order.userLocation.lng,
  }), [order.userLocation.lat, order.userLocation.lng]);

  const driverStartLatLng = useMemo(() => ({
    lat: storeLatLng.lat + 0.006,
    lng: storeLatLng.lng - 0.008,
  }), [storeLatLng.lat, storeLatLng.lng]);

  // Active leg origin/destination
  const legOrigin = currentLeg === 'to_store' ? driverStartLatLng : storeLatLng;
  const legDest = currentLeg === 'to_store' ? storeLatLng : userLatLng;

  const { path: legPath } = useDirections(legOrigin, legDest);
  const { path: fullDeliveryPath } = useDirections(storeLatLng, userLatLng);

  // Active leg progress
  const totalSteps = currentLeg === 'to_store' ? 10 : 12;
  const ratio = Math.min(1, legStep / totalSteps);
  const driverPos = useMemo(() => {
    if (currentLeg === 'delivered') return userLatLng;
    if (currentLeg === 'at_store') return storeLatLng;
    if (currentLeg === 'none') return driverStartLatLng;
    return interpolateAlongPath(legPath || [legOrigin, legDest], ratio) || driverStartLatLng;
  }, [currentLeg, legPath, ratio, userLatLng, storeLatLng, driverStartLatLng, legOrigin, legDest]);

  const mapCenter = useMemo(() => ({
    lat: (userLatLng.lat + storeLatLng.lat) / 2,
    lng: (userLatLng.lng + storeLatLng.lng) / 2,
  }), [userLatLng.lat, userLatLng.lng, storeLatLng.lat, storeLatLng.lng]);

  return (
    <MapView center={mapCenter} zoom={14}>
      <EmojiMarker position={userLatLng} preset="user" zIndex={20} />
      <EmojiMarker position={storeLatLng} preset="store" zIndex={20} />

      {fullDeliveryPath && (
        <RoutePolyline
          path={fullDeliveryPath}
          color={currentLeg === 'to_store' ? '#94A3B8' : '#3B82F6'}
          weight={4}
          opacity={currentLeg === 'to_store' ? 0.4 : 0.85}
        />
      )}

      {currentLeg === 'to_store' && legPath && (
        <RoutePolyline path={legPath} color="#10B981" weight={4} opacity={0.95} dashed />
      )}

      {driverPos && (
        <EmojiMarker position={driverPos} preset="driver" bounce zIndex={100} />
      )}
    </MapView>
  );
}

export function OrderDetailPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const { getOrderById, updateOrderStatus } = useOrderStore();
  const { chats, initializeChat, addMessage } = useChatStore();

  const order = getOrderById(orderId);
  const [store, setStore] = useState(null);
  const [isLoadingStore, setIsLoadingStore] = useState(true);
  const [activeTab, setActiveTab] = useState('store');
  const [inputText, setInputText] = useState('');

  const chatEndRef = useRef(null);
  const simulationTimers = useRef([]);

  const [currentLeg, setCurrentLeg] = useState('none');
  const [legStep, setLegStep] = useState(0);

  useEffect(() => {
    if (!order) return;

    initializeChat(orderId);

    fetchStoreById(order.storeId).then(data => {
      setStore(data);
      setIsLoadingStore(false);
    });

    if (order.status === 'DRIVER_ASSIGNED') {
      setCurrentLeg('to_store');
      setLegStep(0);
    } else if (order.status === 'PICKED_UP') {
      setCurrentLeg('to_client');
      setLegStep(0);
    } else if (order.status === 'DELIVERED') {
      setCurrentLeg('delivered');
      setLegStep(12);
    } else {
      setCurrentLeg('none');
      setLegStep(0);
    }
  }, [orderId, order?.status]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chats, activeTab]);

  useEffect(() => {
    return () => {
      simulationTimers.current.forEach(t => clearTimeout(t));
    };
  }, []);

  // Leg 1: animate driver to store
  useEffect(() => {
    if (!order || currentLeg !== 'to_store') return;
    const totalSteps = 10;
    const interval = setInterval(() => {
      setLegStep(prev => {
        const nextStep = prev + 1;
        if (nextStep >= totalSteps) {
          clearInterval(interval);
          setCurrentLeg('at_store');
          addMessage(orderId, 'driverMessages', {
            sender: 'driver',
            text: '🏪 Ya he llegado a la tienda. Estoy esperando el empaquetado final de tu pedido.',
          });
          return totalSteps;
        }
        return nextStep;
      });
    }, 1500);
    return () => clearInterval(interval);
  }, [currentLeg]);

  // Leg 2: wait at store, then trigger pickup
  useEffect(() => {
    if (!order || currentLeg !== 'at_store') return;
    const timer = setTimeout(() => {
      updateOrderStatus(orderId, 'PICKED_UP');
      addMessage(orderId, 'driverMessages', {
        sender: 'driver',
        text: '🚀 ¡Pedido retirado con éxito! Voy conduciendo en dirección a tu domicilio. Puedes seguirme en vivo en el mapa.',
      });
      addMessage(orderId, 'storeMessages', {
        sender: 'store',
        text: '📦 El driver retiró tu paquete y va en camino a entregártelo. ¡Buen provecho!'
      });
    }, 4500);
    return () => clearTimeout(timer);
  }, [currentLeg]);

  // Leg 3: animate driver to client
  useEffect(() => {
    if (!order || currentLeg !== 'to_client') return;
    const totalSteps = 12;
    const interval = setInterval(() => {
      setLegStep(prev => {
        const nextStep = prev + 1;
        if (nextStep >= totalSteps) {
          clearInterval(interval);
          setCurrentLeg('delivered');
          updateOrderStatus(orderId, 'DELIVERED');
          addMessage(orderId, 'driverMessages', {
            sender: 'driver',
            text: '👋 ¡He llegado! Estoy afuera con tu pedido listo. ¡Gracias por elegir Higo Shop!',
          });
          return totalSteps;
        }
        return nextStep;
      });
    }, 1500);
    return () => clearInterval(interval);
  }, [currentLeg]);

  if (!order) {
    return (
      <div className="order-detail-page" style={{ padding: '2rem', textAlign: 'center' }}>
        <ShieldAlert size={48} color="var(--higo-error)" style={{ marginBottom: '1rem' }} />
        <h3>Pedido no encontrado</h3>
        <p style={{ color: 'var(--higo-gray-500)', marginBottom: '1.5rem' }}>El identificador de la orden no corresponde a tus registros.</p>
        <button className="higo-btn" onClick={() => navigate('/orders')}>Volver a pedidos</button>
      </div>
    );
  }

  const orderChat = chats[orderId] || { storeMessages: [], driverMessages: [] };
  const currentMessages = activeTab === 'store' ? orderChat.storeMessages : orderChat.driverMessages;

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    const text = inputText;
    setInputText('');
    const targetTab = activeTab === 'store' ? 'storeMessages' : 'driverMessages';
    addMessage(orderId, targetTab, { sender: 'customer', text });

    if (activeTab === 'store') {
      const timer = setTimeout(() => {
        addMessage(orderId, 'storeMessages', {
          sender: 'store',
          text: 'Recibimos tu mensaje. Nuestro equipo está atento a tu orden. ¡Muchas gracias por escribirnos! 👍'
        });
      }, 2500);
      simulationTimers.current.push(timer);
    } else {
      const timer = setTimeout(() => {
        addMessage(orderId, 'driverMessages', {
          sender: 'driver',
          text: '¡Entendido! Ya voy conduciendo para entregarte tu pedido lo antes posible. 🛵⚡'
        });
      }, 2000);
      simulationTimers.current.push(timer);
    }
  };

  const handleSimulatePaymentProof = () => {
    addMessage(orderId, 'storeMessages', {
      sender: 'customer',
      text: '📄 Comprobante_Pago_Movil.jpg',
      image: 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=300&auto=format&fit=crop&q=60'
    });

    const t1 = setTimeout(() => {
      addMessage(orderId, 'storeMessages', {
        sender: 'store',
        text: '👋 ¡Hola! Recibimos el capture de tu Pago Móvil. Estamos validando la referencia en nuestra cuenta bancaria. Demorará unos segundos.'
      });
    }, 2000);
    simulationTimers.current.push(t1);

    const t2 = setTimeout(() => {
      updateOrderStatus(orderId, 'PAYMENT_VERIFIED');
      addMessage(orderId, 'storeMessages', {
        sender: 'store',
        text: `💰 ¡Listo! Pago verificado en cuenta. Su pedido por total de ${formatCurrency(order.productTotal)} ha sido aprobado. Pasa a cocina inmediatamente.`
      });
    }, 4500);
    simulationTimers.current.push(t2);

    const t3 = setTimeout(() => {
      updateOrderStatus(orderId, 'PREPARING');
      addMessage(orderId, 'storeMessages', {
        sender: 'store',
        text: '👨‍🍳 Tu pedido ya se está preparando con ingredientes frescos. ¡Huele delicioso!'
      });
    }, 8500);
    simulationTimers.current.push(t3);

    const t4 = setTimeout(() => {
      updateOrderStatus(orderId, 'READY_TO_DISPATCH');
      addMessage(orderId, 'storeMessages', {
        sender: 'store',
        text: '📦 ¡Pedido listo y empaquetado! Buscando al Higo Driver más cercano para el retiro...'
      });
    }, 12500);
    simulationTimers.current.push(t4);

    const t5 = setTimeout(() => {
      updateOrderStatus(orderId, 'DRIVER_ASSIGNED');
      addMessage(orderId, 'driverMessages', {
        sender: 'driver',
        text: '🛵 Higo Driver "Carlos Mendoza" ha aceptado el despacho.',
        system: true
      });
      addMessage(orderId, 'driverMessages', {
        sender: 'driver',
        text: '¡Buenas noches! Soy Carlos Mendoza, tu Higo Driver asignado. Ya arranqué y voy conduciendo en dirección a la tienda para recoger tu pedido. 💨'
      });
      addMessage(orderId, 'storeMessages', {
        sender: 'store',
        text: '🛵 El driver Carlos Mendoza ha sido asignado y va en camino a retirar el paquete.'
      });
      setActiveTab('driver');
    }, 16500);
    simulationTimers.current.push(t5);
  };

  const getStepIndex = (status) => STATUS_STEPS.findIndex(s => s.id === status);
  const currentStepIndex = getStepIndex(order.status);

  return (
    <GoogleMapsProvider>
      <div className="order-detail-page">
        <div className="order-detail-header">
          <button className="back-btn" onClick={() => navigate('/orders')}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2>Seguimiento de Orden</h2>
            <span className="order-id-label">Ref: {order.id.slice(0, 8)}...</span>
          </div>
        </div>

        {/* MAP TRACKING VIEW */}
        <div className="tracking-map-container">
          <TrackingMap order={order} currentLeg={currentLeg} legStep={legStep} />

          {currentLeg !== 'none' && (
            <div className="floating-driver-eta">
              <Clock size={14} className="spinning-icon" />
              <span>
                {currentLeg === 'to_store' && 'Repartidor en camino a la tienda...'}
                {currentLeg === 'at_store' && 'Repartidor en tienda verificando pedido...'}
                {currentLeg === 'to_client' && '¡Pedido en camino a tu dirección!'}
                {currentLeg === 'delivered' && '¡Entregado! Disfruta tu compra'}
              </span>
            </div>
          )}
        </div>

        {/* FLOATING BOTTOM PANEL */}
        <div className="order-detail-bottom-panel">
          <div className="timeline-container">
            <div className="timeline-steps">
              {STATUS_STEPS.map((step, idx) => {
                const isCompleted = idx < currentStepIndex;
                const isActive = idx === currentStepIndex;
                const isPending = idx > currentStepIndex;
                return (
                  <div
                    key={step.id}
                    className={`timeline-step ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''} ${isPending ? 'pending' : ''}`}
                  >
                    <div className="timeline-icon">
                      {isActive ? <span className="breathing-glow" /> : null}
                      {step.icon}
                    </div>
                    <div className="timeline-label">{step.label}</div>
                    {idx < STATUS_STEPS.length - 1 && (
                      <div className={`timeline-line ${idx < currentStepIndex ? 'completed' : ''}`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="order-summary-header">
            <Store size={16} />
            <h3>{order.storeName}</h3>
            <span className="order-grand-total">{formatCurrency(order.grandTotal)}</span>
          </div>

          <div className="order-chat-container">
            <div className="chat-tabs">
              <button
                className={`chat-tab-btn ${activeTab === 'store' ? 'active' : ''}`}
                onClick={() => setActiveTab('store')}
              >
                <Store size={16} />
                Tienda
                {orderChat.storeMessages.length > 1 && <span className="tab-indicator" />}
              </button>
              <button
                className={`chat-tab-btn ${activeTab === 'driver' ? 'active' : ''}`}
                onClick={() => setActiveTab('driver')}
                disabled={getStepIndex(order.status) < 4}
              >
                <Truck size={16} />
                Higo Driver
                {orderChat.driverMessages.length > 1 && <span className="tab-indicator" />}
              </button>
            </div>

            <div className="chat-messages-thread">
              <AnimatePresence initial={false}>
                {currentMessages.map((msg) => {
                  if (msg.system) {
                    return (
                      <div key={msg.id} className="system-chat-message">
                        <span>{msg.text}</span>
                      </div>
                    );
                  }
                  const isMe = msg.sender === 'customer';
                  return (
                    <motion.div
                      key={msg.id}
                      className={`chat-bubble-wrapper ${isMe ? 'chat-bubble-wrapper--me' : 'chat-bubble-wrapper--other'}`}
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className={`chat-bubble ${isMe ? 'chat-bubble--me' : 'chat-bubble--other'}`}>
                        {msg.image ? (
                          <div className="chat-image-attachment">
                            <img src={msg.image} alt="Adjunto de Pago" />
                            <div className="chat-image-attachment__label">
                              <Image size={14} /> {msg.text}
                            </div>
                          </div>
                        ) : (
                          <p>{msg.text}</p>
                        )}
                        <span className="chat-timestamp">
                          {new Date(msg.timestamp).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              <div ref={chatEndRef} />
            </div>

            {activeTab === 'store' && order.status === 'PENDING_PAYMENT' && (
              <motion.div
                className="payment-prompt-bar"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="payment-prompt-info">
                  <Smartphone size={16} />
                  <span>Realiza tu Pago Móvil de <strong>{formatCurrency(order.productTotal)}</strong> y reporta tu comprobante aquí.</span>
                </div>
                <button
                  className="payment-report-btn"
                  onClick={handleSimulatePaymentProof}
                >
                  <Sparkles size={14} />
                  Reportar Pago (Simulado)
                </button>
              </motion.div>
            )}

            <form className="chat-input-bar" onSubmit={handleSendMessage}>
              <input
                type="text"
                placeholder={
                  activeTab === 'driver' && getStepIndex(order.status) < 4
                    ? 'Esperando asignación de Driver...'
                    : `Mensaje a ${activeTab === 'store' ? 'la tienda' : 'repartidor'}...`
                }
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                disabled={activeTab === 'driver' && getStepIndex(order.status) < 4}
              />
              <button
                type="submit"
                className="chat-send-btn"
                disabled={!inputText.trim() || (activeTab === 'driver' && getStepIndex(order.status) < 4)}
              >
                <Send size={18} />
              </button>
            </form>
          </div>
        </div>
      </div>
    </GoogleMapsProvider>
  );
}

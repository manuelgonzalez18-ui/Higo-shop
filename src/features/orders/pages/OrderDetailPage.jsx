import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Store, Truck, MapPin, Navigation, Clock,
  MessageCircle, Send, ShieldAlert, Image, Check, Smartphone, Sparkles
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { useOrderStore } from '../../../stores/useOrderStore.js';
import { useChatStore } from '../../../stores/useChatStore.js';
import { fetchStoreById } from '../../../services/storeService.js';
import { formatCurrency } from '../../../services/deliveryPricing.js';
import { Spinner } from '../../../components/ui/Spinner.jsx';
import './OrderDetailPage.css';

// Fix Leaflet default icon issues
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom icons using Emojis for high visual premium appeal
const userIcon = L.divIcon({
  html: '<div style="font-size: 24px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">📍</div>',
  iconSize: [30, 30],
  iconAnchor: [15, 30]
});

const storeIcon = L.divIcon({
  html: '<div style="font-size: 24px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">🏪</div>',
  iconSize: [30, 30],
  iconAnchor: [15, 30]
});

const driverIcon = L.divIcon({
  html: '<div style="font-size: 28px; filter: drop-shadow(0 3px 6px rgba(0,0,0,0.4)); animation: bounce 1s infinite alternate;">🛵</div>',
  iconSize: [36, 36],
  iconAnchor: [18, 36]
});

const STATUS_STEPS = [
  { id: 'PENDING_PAYMENT', label: 'Pago', icon: '💳' },
  { id: 'PAYMENT_VERIFIED', label: 'Verificado', icon: '✅' },
  { id: 'PREPARING', label: 'Cocina', icon: '👨‍🍳' },
  { id: 'READY_TO_DISPATCH', label: 'Listo', icon: '📦' },
  { id: 'DRIVER_ASSIGNED', label: 'Asignado', icon: '🛵' },
  { id: 'PICKED_UP', label: 'En Camino', icon: '🚀' },
  { id: 'DELIVERED', label: 'Entregado', icon: '🏁' }
];

export function OrderDetailPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  
  const { getOrderById, updateOrderStatus } = useOrderStore();
  const { chats, initializeChat, addMessage } = useChatStore();
  
  const order = getOrderById(orderId);
  const [store, setStore] = useState(null);
  const [isLoadingStore, setIsLoadingStore] = useState(true);
  const [activeTab, setActiveTab] = useState('store'); // 'store' | 'driver'
  const [inputText, setInputText] = useState('');
  
  const chatEndRef = useRef(null);
  const simulationTimers = useRef([]);

  // Driver Tracking & Leg State
  const [driverPos, setDriverPos] = useState(null);
  const [currentLeg, setCurrentLeg] = useState('none'); // 'none' | 'to_store' | 'at_store' | 'to_client' | 'delivered'
  const [legStep, setLegStep] = useState(0);

  // Set initial driver position & Leg state matching order status
  useEffect(() => {
    if (!order) return;
    
    initializeChat(orderId);
    
    fetchStoreById(order.storeId).then(data => {
      setStore(data);
      setIsLoadingStore(false);
    });

    const storeLat = order.storeLocation.lat;
    const storeLng = order.storeLocation.lng;
    const startLat = storeLat + 0.006;
    const startLng = storeLng - 0.008;

    if (order.status === 'DRIVER_ASSIGNED') {
      setCurrentLeg('to_store');
    } else if (order.status === 'PICKED_UP') {
      setCurrentLeg('to_client');
    } else if (order.status === 'DELIVERED') {
      setDriverPos({ lat: order.userLocation.lat, lng: order.userLocation.lng });
      setCurrentLeg('delivered');
    } else {
      setDriverPos({ lat: startLat, lng: startLng });
      setCurrentLeg('none');
      setLegStep(0);
    }
  }, [orderId, order?.status]);

  // Scroll chat to bottom automatically
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chats, activeTab]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      simulationTimers.current.forEach(t => clearTimeout(t));
    };
  }, []);

  // Anim Leg 1: Driver moving from start position to Store
  useEffect(() => {
    if (!order || currentLeg !== 'to_store') return;

    const storeLat = order.storeLocation.lat;
    const storeLng = order.storeLocation.lng;
    const startLat = storeLat + 0.006;
    const startLng = storeLng - 0.008;

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

        const ratio = nextStep / totalSteps;
        const currentLat = startLat + (storeLat - startLat) * ratio;
        const currentLng = startLng + (storeLng - startLng) * ratio;
        setDriverPos({ lat: currentLat, lng: currentLng });

        return nextStep;
      });
    }, 1500);

    return () => clearInterval(interval);
  }, [currentLeg]);

  // Leg 2: Driver waiting at Store (triggers pickup after 4s)
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

  // Anim Leg 3: Driver moving from Store to Client
  useEffect(() => {
    if (!order || currentLeg !== 'to_client') return;

    const storeLat = order.storeLocation.lat;
    const storeLng = order.storeLocation.lng;
    const userLat = order.userLocation.lat;
    const userLng = order.userLocation.lng;

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

        const ratio = nextStep / totalSteps;
        const currentLat = storeLat + (userLat - storeLat) * ratio;
        const currentLng = storeLng + (userLng - storeLng) * ratio;
        setDriverPos({ lat: currentLat, lng: currentLng });

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

  // Handles text messages sent by user
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const text = inputText;
    setInputText('');

    const targetTab = activeTab === 'store' ? 'storeMessages' : 'driverMessages';
    
    // 1. Add User Message
    addMessage(orderId, targetTab, {
      sender: 'customer',
      text: text
    });

    // 2. Simulate smart replies based on status
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

  // Simulates uploading and sharing the Pago Móvil transfer proof screenshot
  const handleSimulatePaymentProof = () => {
    addMessage(orderId, 'storeMessages', {
      sender: 'customer',
      text: '📄 Comprobante_Pago_Movil.jpg',
      image: 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=300&auto=format&fit=crop&q=60'
    });

    let timer1 = setTimeout(() => {
      addMessage(orderId, 'storeMessages', {
        sender: 'store',
        text: '👋 ¡Hola! Recibimos el capture de tu Pago Móvil. Estamos validando la referencia en nuestra cuenta bancaria. Demorará unos segundos.'
      });
    }, 2000);
    simulationTimers.current.push(timer1);

    let timer2 = setTimeout(() => {
      updateOrderStatus(orderId, 'PAYMENT_VERIFIED');
      addMessage(orderId, 'storeMessages', {
        sender: 'store',
        text: `💰 ¡Listo! Pago verificado en cuenta. Su pedido por total de ${formatCurrency(order.productTotal)} ha sido aprobado. Pasa a cocina inmediatamente.`
      });
    }, 4500);
    simulationTimers.current.push(timer2);

    let timer3 = setTimeout(() => {
      updateOrderStatus(orderId, 'PREPARING');
      addMessage(orderId, 'storeMessages', {
        sender: 'store',
        text: '👨‍🍳 Tu pedido ya se está preparando con ingredientes frescos. ¡Huele delicioso!'
      });
    }, 8500);
    simulationTimers.current.push(timer3);

    let timer4 = setTimeout(() => {
      updateOrderStatus(orderId, 'READY_TO_DISPATCH');
      addMessage(orderId, 'storeMessages', {
        sender: 'store',
        text: '📦 ¡Pedido listo y empaquetado! Buscando al Higo Driver más cercano para el retiro...'
      });
    }, 12500);
    simulationTimers.current.push(timer4);

    let timer5 = setTimeout(() => {
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
    simulationTimers.current.push(timer5);
  };

  const getStepIndex = (status) => {
    return STATUS_STEPS.findIndex(s => s.id === status);
  };

  const currentStepIndex = getStepIndex(order.status);

  // Map settings
  const mapCenter = [
    (order.userLocation.lat + order.storeLocation.lat) / 2,
    (order.userLocation.lng + order.storeLocation.lng) / 2,
  ];

  // Helper variables for movement polylines
  const storeLat = order.storeLocation.lat;
  const storeLng = order.storeLocation.lng;
  const startLat = storeLat + 0.006;
  const startLng = storeLng - 0.008;

  return (
    <div className="order-detail-page">
      {/* Header */}
      <div className="order-detail-header">
        <button className="back-btn" onClick={() => navigate('/orders')}>
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2>Seguimiento de Orden</h2>
          <span className="order-id-label">Ref: {order.id.slice(0, 8)}...</span>
        </div>
      </div>

      {/* 1. MAP TRACKING VIEW */}
      <div className="tracking-map-container">
        <MapContainer
          center={mapCenter}
          zoom={14}
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
          attributionControl={false}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          
          {/* User Location */}
          <Marker position={[order.userLocation.lat, order.userLocation.lng]} icon={userIcon}>
            <Popup>📍 Tu ubicación: {order.deliveryAddress}</Popup>
          </Marker>

          {/* Store Location */}
          <Marker position={[order.storeLocation.lat, order.storeLocation.lng]} icon={storeIcon}>
            <Popup>🏪 {order.storeName}</Popup>
          </Marker>

          {/* Dynamic Polylines based on real-time leg */}
          {currentLeg === 'to_store' ? (
            <Polyline
              positions={[
                [startLat, startLng],
                [storeLat, storeLng],
              ]}
              color="var(--higo-success)"
              weight={4}
              opacity={0.8}
              dashArray="6, 8"
            />
          ) : (
            <Polyline
              positions={[
                [storeLat, storeLng],
                [order.userLocation.lat, order.userLocation.lng],
              ]}
              color="var(--higo-gray-900)"
              weight={4}
              opacity={0.7}
            />
          )}

          {/* Driver Location Marker */}
          {driverPos && (
            <Marker position={[driverPos.lat, driverPos.lng]} icon={driverIcon}>
              <Popup>🛵 Carlos Mendoza (Higo Driver)</Popup>
            </Marker>
          )}
        </MapContainer>

        {/* Floating Leg Status Card */}
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
        {/* 2. VISUAL PROGRESS TIMELINE */}
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

        {/* 3. ORDER INFO SLIDE */}
        <div className="order-summary-header">
          <Store size={16} />
          <h3>{order.storeName}</h3>
          <span className="order-grand-total">{formatCurrency(order.grandTotal)}</span>
        </div>

        {/* 4. REALTIME CHAT CLIENT */}
        <div className="order-chat-container">
          {/* Chat Tabs */}
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
              disabled={getStepIndex(order.status) < 4} // Disabled until driver is assigned
            >
              <Truck size={16} />
              Higo Driver
              {orderChat.driverMessages.length > 1 && <span className="tab-indicator" />}
            </button>
          </div>

          {/* Chat Thread */}
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

          {/* Dynamic Action Bar (For uploading payment capture) */}
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

          {/* Input Bar */}
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
  );
}

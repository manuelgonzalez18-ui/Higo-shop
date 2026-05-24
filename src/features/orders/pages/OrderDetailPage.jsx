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

  // Geolocation & Driver Tracking Animation State
  const [driverPos, setDriverPos] = useState(null);
  const [animationStep, setAnimationStep] = useState(0);

  // Initialize Chat and Fetch Store metadata
  useEffect(() => {
    if (!order) return;
    
    initializeChat(orderId);
    
    fetchStoreById(order.storeId).then(data => {
      setStore(data);
      setIsLoadingStore(false);
    });

    // Set initial driver position at the store
    setDriverPos({ lat: order.storeLocation.lat, lng: order.storeLocation.lng });
  }, [orderId, order]);

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

  // Driver Realtime Movement Simulation along the route path
  useEffect(() => {
    if (!order || order.status !== 'PICKED_UP') return;

    const startLat = order.storeLocation.lat;
    const startLng = order.storeLocation.lng;
    const endLat = order.userLocation.lat;
    const endLng = order.userLocation.lng;

    // Slide driver coordinates from store to user location in 15 steps
    const totalSteps = 15;
    const interval = setInterval(() => {
      setAnimationStep(prev => {
        const nextStep = prev + 1;
        if (nextStep >= totalSteps) {
          clearInterval(interval);
          // Auto advance to DELIVERED once driver arrives
          updateOrderStatus(orderId, 'DELIVERED');
          
          addMessage(orderId, 'driverMessages', {
            sender: 'driver',
            text: '👋 ¡He llegado! Estoy afuera de tu dirección de entrega. ¡Gracias por preferir Higo Shop!',
          });
          
          return totalSteps;
        }

        // Interpolate position
        const ratio = nextStep / totalSteps;
        const currentLat = startLat + (endLat - startLat) * ratio;
        const currentLng = startLng + (endLng - startLng) * ratio;
        setDriverPos({ lat: currentLat, lng: currentLng });

        return nextStep;
      });
    }, 1500);

    return () => clearInterval(interval);
  }, [order?.status]);

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
          text: '¡Entendido! Ya voy en camino para completar el servicio lo antes posible. 🛵⚡'
        });
      }, 2000);
      simulationTimers.current.push(timer);
    }
  };

  // Simulates uploading and sharing the Pago Móvil transfer proof screenshot
  const handleSimulatePaymentProof = () => {
    // 1. Send simulated payment capture
    addMessage(orderId, 'storeMessages', {
      sender: 'customer',
      text: '📄 Comprobante_Pago_Movil.jpg',
      image: 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=300&auto=format&fit=crop&q=60'
    });

    // 2. Reply 1: Store starts validation
    let timer1 = setTimeout(() => {
      addMessage(orderId, 'storeMessages', {
        sender: 'store',
        text: '👋 ¡Hola! Recibimos el capture de tu Pago Móvil. Estamos validando la referencia en nuestra cuenta bancaria. Demorará unos segundos.'
      });
    }, 2500);
    simulationTimers.current.push(timer1);

    // 3. Reply 2: Store validates payment, advances status to PAYMENT_VERIFIED
    let timer2 = setTimeout(() => {
      updateOrderStatus(orderId, 'PAYMENT_VERIFIED');
      addMessage(orderId, 'storeMessages', {
        sender: 'store',
        text: `💰 ¡Listo! Pago verificado en cuenta. Su pedido por total de ${formatCurrency(order.productTotal)} ha sido aprobado. Pasa a cocina inmediatamente.`
      });
    }, 6000);
    simulationTimers.current.push(timer2);

    // 4. Reply 3: Store preparing, status to PREPARING
    let timer3 = setTimeout(() => {
      updateOrderStatus(orderId, 'PREPARING');
      addMessage(orderId, 'storeMessages', {
        sender: 'store',
        text: '👨‍🍳 Tu pedido ya se está preparando con ingredientes frescos. ¡Huele delicioso!'
      });
    }, 11000);
    simulationTimers.current.push(timer3);

    // 5. Reply 4: Store packed, status to READY_TO_DISPATCH
    let timer4 = setTimeout(() => {
      updateOrderStatus(orderId, 'READY_TO_DISPATCH');
      addMessage(orderId, 'storeMessages', {
        sender: 'store',
        text: '📦 ¡Pedido listo y empaquetado! Buscando al Higo Driver más cercano para el retiro...'
      });
    }, 17000);
    simulationTimers.current.push(timer4);

    // 6. Driver Assignment, status to DRIVER_ASSIGNED
    let timer5 = setTimeout(() => {
      updateOrderStatus(orderId, 'DRIVER_ASSIGNED');
      
      // Post system message in Driver tab
      addMessage(orderId, 'driverMessages', {
        sender: 'driver',
        text: '🛵 Higo Driver "Carlos Mendoza" ha aceptado el despacho.',
        system: true
      });

      // Post driver's greeting
      addMessage(orderId, 'driverMessages', {
        sender: 'driver',
        text: '¡Buenas noches! Soy Carlos Mendoza, tu Higo Driver asignado. Ya voy en camino a retirar tu pedido en el comercio. 💨'
      });

      // Notify in store chat too
      addMessage(orderId, 'storeMessages', {
        sender: 'store',
        text: '🛵 El driver Carlos Mendoza ha sido asignado y va en camino a retirar el paquete.'
      });
      
      // Auto switch active tab to Driver to show the new assignee
      setActiveTab('driver');
    }, 22000);
    simulationTimers.current.push(timer5);

    // 7. Dispatch, status to PICKED_UP
    let timer6 = setTimeout(() => {
      updateOrderStatus(orderId, 'PICKED_UP');
      
      addMessage(orderId, 'driverMessages', {
        sender: 'driver',
        text: '🚀 ¡Pedido retirado con éxito! Voy en camino a tu dirección. Puedes seguir mi trayecto en vivo en el mapa de arriba.'
      });
    }, 28000);
    simulationTimers.current.push(timer6);
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

          {/* Route path */}
          <Polyline
            positions={[
              [order.userLocation.lat, order.userLocation.lng],
              [order.storeLocation.lat, order.storeLocation.lng],
            ]}
            color="var(--higo-blue)"
            weight={3.5}
            opacity={0.6}
            dashArray="6, 8"
          />

          {/* Driver Location (only when assigned, preparing or picked up) */}
          {(order.status === 'DRIVER_ASSIGNED' || order.status === 'PICKED_UP' || order.status === 'DELIVERED') && driverPos && (
            <Marker position={[driverPos.lat, driverPos.lng]} icon={driverIcon}>
              <Popup>🛵 Carlos Mendoza (Higo Driver)</Popup>
            </Marker>
          )}
        </MapContainer>

        {/* Floating Distance Badge */}
        {order.status === 'PICKED_UP' && (
          <div className="floating-driver-eta">
            <Clock size={14} className="spinning-icon" />
            <span>Repartidor en camino — Llegada estimada ~{15 - animationStep}s</span>
          </div>
        )}
      </div>

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
  );
}

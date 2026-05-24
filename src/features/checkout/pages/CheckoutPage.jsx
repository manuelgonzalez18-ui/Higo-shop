import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, MapPin, Store, Truck, Phone, Building2,
  CreditCard, Banknote, Smartphone, Copy, Check,
  Navigation, Clock, ShoppingBag, Send
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { mockStores } from '../../../data/stores.js';
import { useCartStore } from '../../../stores/useCartStore.js';
import { useLocationStore } from '../../../stores/useLocationStore.js';
import { useOrderStore } from '../../../stores/useOrderStore.js';
import { useDeliveryFee } from '../../../hooks/useDeliveryFee.js';
import { formatCurrency, calculateChange } from '../../../services/deliveryPricing.js';
import './CheckoutPage.css';

// Fix Leaflet default icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

export function CheckoutPage() {
  const { storeId } = useParams();
  const navigate = useNavigate();
  const store = mockStores.find(s => s.id === storeId);
  const { carts, clearCart } = useCartStore();
  const { userLocation, deliveryAddress } = useLocationStore();
  const { createOrder } = useOrderStore();
  const { distance, distanceText, fee, feeText, estimatedTime } = useDeliveryFee(store?.latitude, store?.longitude);

  const [deliveryPayMethod, setDeliveryPayMethod] = useState('cash');
  const [paidWithAmount, setPaidWithAmount] = useState('');
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const items = carts[storeId]?.items || [];
  const productTotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const grandTotal = productTotal + fee;

  const change = useMemo(() => {
    if (!paidWithAmount) return 0;
    return calculateChange(fee, parseFloat(paidWithAmount));
  }, [fee, paidWithAmount]);

  const handleCopyPagoMovil = () => {
    if (!store) return;
    const text = `Pago Móvil\nTeléfono: ${store.pagoMovil.phone}\nBanco: ${store.pagoMovil.bank}\nCédula: ${store.pagoMovil.cedula}\nTitular: ${store.pagoMovil.holder}\nMonto: ${formatCurrency(productTotal)}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleConfirmOrder = () => {
    if (!store) return;
    setIsSubmitting(true);

    const order = createOrder({
      storeId: store.id,
      storeName: store.name,
      items: items.map(i => ({ id: i.id, name: i.name, price: i.price, quantity: i.quantity })),
      productTotal,
      deliveryFee: fee,
      grandTotal,
      deliveryPayMethod,
      paidWithAmount: deliveryPayMethod === 'cash' ? parseFloat(paidWithAmount) || 0 : 0,
      changeAmount: deliveryPayMethod === 'cash' ? change : 0,
      deliveryAddress,
      userLocation,
      storeLocation: { lat: store.latitude, lng: store.longitude },
      storePagoMovil: store.pagoMovil,
    });

    clearCart(storeId);

    setTimeout(() => {
      setIsSubmitting(false);
      navigate(`/orders`, { replace: true });
    }, 800);
  };

  if (!store || items.length === 0) {
    return (
      <div className="checkout-page">
        <div className="checkout-header">
          <button className="checkout-header__back" onClick={() => navigate(-1)}>
            <ArrowLeft size={20} />
          </button>
          <h1>Checkout</h1>
        </div>
        <div className="cart-empty" style={{ padding: '4rem 1rem' }}>
          <ShoppingBag size={48} strokeWidth={1.5} style={{ color: 'var(--higo-gray-300)', marginBottom: '1rem' }} />
          <h2 style={{ fontSize: 'var(--font-lg)', color: 'var(--higo-gray-600)' }}>No hay productos</h2>
          <p style={{ fontSize: 'var(--font-sm)', color: 'var(--higo-gray-400)' }}>Agrega productos antes de continuar</p>
        </div>
      </div>
    );
  }

  const mapCenter = [
    (userLocation.lat + store.latitude) / 2,
    (userLocation.lng + store.longitude) / 2,
  ];

  return (
    <div className="checkout-page">
      {/* Header */}
      <div className="checkout-header">
        <button className="checkout-header__back" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
        </button>
        <h1>Confirmar Pedido</h1>
      </div>

      {/* Delivery Address */}
      <motion.div
        className="checkout-section"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <div className="checkout-section__header">
          <MapPin size={18} color="var(--higo-blue)" />
          Dirección de entrega
        </div>
        <div className="checkout-section__body">
          <div className="checkout-address">
            <Navigation size={16} />
            <span className="checkout-address__text">{deliveryAddress}</span>
          </div>
          <div className="checkout-map">
            <MapContainer
              center={mapCenter}
              zoom={14}
              style={{ height: '100%', width: '100%' }}
              zoomControl={false}
              attributionControl={false}
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <Marker position={[userLocation.lat, userLocation.lng]}>
                <Popup>📍 Tu ubicación</Popup>
              </Marker>
              <Marker position={[store.latitude, store.longitude]}>
                <Popup>🏪 {store.name}</Popup>
              </Marker>
              <Polyline
                positions={[
                  [userLocation.lat, userLocation.lng],
                  [store.latitude, store.longitude],
                ]}
                color="#2563EB"
                weight={3}
                opacity={0.7}
                dashArray="8, 8"
              />
            </MapContainer>
          </div>
          <div className="distance-info" style={{ marginTop: 'var(--space-2)' }}>
            <Navigation size={15} />
            <span>{distanceText} de distancia</span>
            <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Clock size={14} /> {estimatedTime}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Order Items Summary */}
      <motion.div
        className="checkout-section"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="checkout-section__header">
          <ShoppingBag size={18} color="var(--higo-blue)" />
          Resumen del pedido — {store.name}
        </div>
        <div className="checkout-section__body">
          <div className="checkout-items">
            {items.map(item => (
              <div key={item.id} className="checkout-item">
                <span>
                  {item.name}
                  <span className="checkout-item__qty">x{item.quantity}</span>
                </span>
                <span style={{ fontWeight: 600 }}>{formatCurrency(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* PAYMENT BLOCK 1: Store Payment */}
      <motion.div
        className="checkout-section"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <div className="checkout-section__body" style={{ padding: 'var(--space-4)' }}>
          <div className="payment-block payment-block--store">
            <div className="payment-block__label">
              <Store size={15} />
              Pago al comercio (productos)
            </div>
            <div className="payment-block__amount">
              {formatCurrency(productTotal)}
            </div>
            <div className="payment-block__divider" />
            <p style={{ fontSize: 'var(--font-xs)', color: 'var(--higo-gray-500)', marginBottom: 'var(--space-3)' }}>
              Pagar vía Pago Móvil directamente al comercio:
            </p>
            <div className="pago-movil-info">
              <div className="pago-movil-row">
                <Phone size={14} />
                <span>Teléfono:</span>
                <span style={{ fontWeight: 600 }}>{store.pagoMovil.phone}</span>
              </div>
              <div className="pago-movil-row">
                <Building2 size={14} />
                <span>Banco:</span>
                <span style={{ fontWeight: 600 }}>{store.pagoMovil.bank}</span>
              </div>
              <div className="pago-movil-row">
                <CreditCard size={14} />
                <span>Cédula:</span>
                <span style={{ fontWeight: 600 }}>{store.pagoMovil.cedula}</span>
              </div>
              <div className="pago-movil-row">
                <span style={{ width: 14 }}>👤</span>
                <span>Titular:</span>
                <span style={{ fontWeight: 600 }}>{store.pagoMovil.holder}</span>
              </div>
            </div>
            <button
              className={`copy-btn ${copied ? 'copy-btn--copied' : ''}`}
              onClick={handleCopyPagoMovil}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? 'Datos copiados' : 'Copiar datos de pago'}
            </button>
          </div>
        </div>
      </motion.div>

      {/* PAYMENT BLOCK 2: Driver Payment */}
      <motion.div
        className="checkout-section"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="checkout-section__body" style={{ padding: 'var(--space-4)' }}>
          <div className="payment-block payment-block--driver">
            <div className="payment-block__label">
              <Truck size={15} />
              Tarifa de envío (al Driver)
            </div>
            <div className="payment-block__amount">
              {feeText}
            </div>
            <div className="distance-info">
              <Navigation size={14} />
              <span>Distancia: {distanceText}</span>
            </div>
            <div className="payment-block__divider" />

            <p style={{ fontSize: 'var(--font-xs)', color: 'var(--higo-gray-500)', marginBottom: 'var(--space-2)' }}>
              Método de pago al Driver:
            </p>
            <div className="payment-method-group">
              <button
                className={`payment-method-option ${deliveryPayMethod === 'cash' ? 'payment-method-option--active' : ''}`}
                onClick={() => setDeliveryPayMethod('cash')}
              >
                <Banknote size={18} />
                Efectivo
              </button>
              <button
                className={`payment-method-option ${deliveryPayMethod === 'pago_movil' ? 'payment-method-option--active' : ''}`}
                onClick={() => setDeliveryPayMethod('pago_movil')}
              >
                <Smartphone size={18} />
                Pago Móvil
              </button>
            </div>

            {deliveryPayMethod === 'cash' && (
              <motion.div
                className="change-calculator"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                transition={{ duration: 0.25 }}
              >
                <label htmlFor="paid-with">
                  💵 ¿Con cuánto vas a pagar?
                </label>
                <input
                  id="paid-with"
                  type="number"
                  min="0"
                  step="0.5"
                  placeholder={`Mínimo ${feeText}`}
                  value={paidWithAmount}
                  onChange={(e) => setPaidWithAmount(e.target.value)}
                />
                {paidWithAmount && parseFloat(paidWithAmount) >= fee && (
                  <div className="change-result">
                    🪙 Requiere vuelto de: {formatCurrency(change)}
                  </div>
                )}
                {paidWithAmount && parseFloat(paidWithAmount) < fee && (
                  <div className="change-result" style={{ color: 'var(--higo-error)' }}>
                    ⚠️ Monto insuficiente
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Confirm Bar */}
      <div className="checkout-confirm-bar">
        <div className="checkout-confirm-total">
          <span>Total general</span>
          <span>{formatCurrency(grandTotal)}</span>
        </div>
        <motion.button
          className="checkout-confirm-btn"
          onClick={handleConfirmOrder}
          disabled={isSubmitting}
          whileTap={{ scale: 0.97 }}
        >
          {isSubmitting ? (
            <span>Procesando...</span>
          ) : (
            <>
              <Send size={18} />
              <span>Confirmar Pedido</span>
            </>
          )}
        </motion.button>
      </div>
    </div>
  );
}

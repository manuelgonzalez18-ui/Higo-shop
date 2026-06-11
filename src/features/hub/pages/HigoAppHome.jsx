import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, ChevronRight, Clock } from 'lucide-react';
import { MODULES } from '../../../config/modules.js';
import { useLocationStore } from '../../../stores/useLocationStore.js';
import { useOrderStore } from '../../../stores/useOrderStore.js';
import { formatOrderStatus } from '../../../services/orderStatus.js';
import './HigoAppHome.css';

const ACTIVE_STATUSES = [
  'PENDING_PRODUCT_PAYMENT', 'PRODUCT_PAYMENT_REPORTED', 'PRODUCT_PAYMENT_VERIFIED',
  'PREPARING', 'READY_FOR_DRIVER_MATCH', 'DRIVER_CANDIDATE_BROADCASTED',
  'DRIVER_ASSIGNED', 'DRIVER_EN_ROUTE_TO_STORE', 'PICKED_UP',
  'DRIVER_EN_ROUTE_TO_CUSTOMER', 'DELIVERY_PAYMENT_PENDING',
  'DELIVERY_PAYMENT_REPORTED', 'DELIVERY_PAYMENT_CONFIRMED',
  // legacy
  'PENDING_PAYMENT', 'PAYMENT_VERIFIED', 'READY_TO_DISPATCH',
];

export function HigoAppHome() {
  const navigate = useNavigate();
  const { deliveryAddress } = useLocationStore();
  const orders = useOrderStore((s) => s.orders);

  const activeOrders = useMemo(
    () => orders.filter((o) => ACTIVE_STATUSES.includes(o.status)),
    [orders],
  );

  const handleModuleClick = (mod) => {
    if (mod.status !== 'active') return;
    navigate(mod.route);
  };

  return (
    <div className="higo-hub">
      <header className="higo-hub__header">
        <div className="higo-hub__brand">
          <span className="higo-hub__logo">🐐</span>
          <div>
            <h1>Higo App</h1>
            <p>¿Qué necesitas hoy?</p>
          </div>
        </div>
        {deliveryAddress && (
          <div className="higo-hub__location">
            <MapPin size={14} />
            <span>{deliveryAddress}</span>
          </div>
        )}
      </header>

      {activeOrders.length > 0 && (
        <motion.button
          className="higo-hub__active-order"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => navigate('/orders')}
        >
          <Clock size={18} />
          <div className="higo-hub__active-order-text">
            <strong>{activeOrders.length} pedido{activeOrders.length > 1 ? 's' : ''} en curso</strong>
            <span>{formatOrderStatus(activeOrders[0].status)}</span>
          </div>
          <ChevronRight size={18} />
        </motion.button>
      )}

      <section className="higo-hub__modules">
        {MODULES.map((mod, i) => {
          const soon = mod.status !== 'active';
          return (
            <motion.button
              key={mod.id}
              className={`higo-module-card ${soon ? 'higo-module-card--soon' : ''}`}
              style={{ '--module-accent': mod.accent }}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i }}
              whileTap={soon ? undefined : { scale: 0.98 }}
              onClick={() => handleModuleClick(mod)}
              disabled={soon}
            >
              <span className="higo-module-card__emoji">{mod.emoji}</span>
              <div className="higo-module-card__text">
                <span className="higo-module-card__name">{mod.name}</span>
                <span className="higo-module-card__tagline">{mod.tagline}</span>
              </div>
              {soon ? (
                <span className="higo-module-card__badge">Próximamente</span>
              ) : (
                <ChevronRight size={20} className="higo-module-card__chevron" />
              )}
            </motion.button>
          );
        })}
      </section>

      <p className="higo-hub__footer">Una sola app para moverte, pedir y enviar en Higuerote.</p>
    </div>
  );
}

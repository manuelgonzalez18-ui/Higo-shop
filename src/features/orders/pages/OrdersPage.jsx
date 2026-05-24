import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ClipboardList, Package, Clock, CheckCircle2, XCircle, ArrowLeft } from 'lucide-react';
import { useOrderStore } from '../../../stores/useOrderStore.js';
import { formatCurrency } from '../../../services/deliveryPricing.js';
import './OrdersPage.css';

const STATUS_MAP = {
  PENDING_PAYMENT: { label: 'Pendiente por Pago', color: 'var(--higo-warning)', icon: '⏳', bg: 'var(--higo-warning-light)' },
  PAYMENT_VERIFIED: { label: 'Pago Verificado', color: 'var(--higo-info)', icon: '✅', bg: 'var(--higo-info-light)' },
  PREPARING: { label: 'En Preparación', color: 'var(--higo-blue)', icon: '👨‍🍳', bg: 'var(--higo-blue-50)' },
  READY_TO_DISPATCH: { label: 'Listo para Despachar', color: 'var(--higo-blue)', icon: '📦', bg: 'var(--higo-blue-50)' },
  DRIVER_ASSIGNED: { label: 'Driver Asignado', color: 'var(--higo-info)', icon: '🛵', bg: 'var(--higo-info-light)' },
  PICKED_UP: { label: 'En Camino', color: 'var(--higo-blue)', icon: '🚀', bg: 'var(--higo-blue-50)' },
  DELIVERED: { label: 'Entregado', color: 'var(--higo-success)', icon: '✅', bg: 'var(--higo-success-light)' },
  CANCELLED: { label: 'Cancelado', color: 'var(--higo-error)', icon: '❌', bg: 'var(--higo-error-light)' },
};

export function OrdersPage() {
  const navigate = useNavigate();
  const { orders } = useOrderStore();

  return (
    <div className="orders-page">
      <div className="orders-header">
        <button className="orders-header__back" onClick={() => navigate('/')}>
          <ArrowLeft size={20} />
        </button>
        <h1>Mis Pedidos</h1>
      </div>

      {orders.length === 0 ? (
        <div className="orders-empty">
          <ClipboardList size={56} strokeWidth={1.2} />
          <h2>Sin pedidos aún</h2>
          <p>Tus pedidos aparecerán aquí</p>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map((order, index) => {
            const statusInfo = STATUS_MAP[order.status] || STATUS_MAP.PENDING_PAYMENT;
            return (
              <motion.div
                key={order.id}
                className="order-card"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <div className="order-card__top">
                  <div>
                    <div className="order-card__store">{order.storeName}</div>
                    <div className="order-card__id">{order.id}</div>
                  </div>
                  <div
                    className="order-card__status"
                    style={{ background: statusInfo.bg, color: statusInfo.color }}
                  >
                    <span>{statusInfo.icon}</span>
                    {statusInfo.label}
                  </div>
                </div>

                <div className="order-card__items">
                  {order.items.slice(0, 3).map(item => (
                    <span key={item.id} className="order-card__item-tag">
                      {item.name} x{item.quantity}
                    </span>
                  ))}
                  {order.items.length > 3 && (
                    <span className="order-card__item-tag">+{order.items.length - 3} más</span>
                  )}
                </div>

                <div className="order-card__bottom">
                  <div className="order-card__totals">
                    <span>Productos: {formatCurrency(order.productTotal)}</span>
                    <span>Envío: {formatCurrency(order.deliveryFee)}</span>
                  </div>
                  <div className="order-card__grand-total">
                    {formatCurrency(order.grandTotal)}
                  </div>
                </div>

                <div className="order-card__date">
                  {new Date(order.createdAt).toLocaleDateString('es-VE', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

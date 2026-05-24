import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Plus, Minus, Trash2, ShoppingBag, ArrowRight, Store } from 'lucide-react';
import { useCartStore } from '../../../stores/useCartStore.js';
import { mockStores } from '../../../data/stores.js';
import { formatCurrency } from '../../../services/deliveryPricing.js';
import './CartPage.css';

export function CartPage() {
  const navigate = useNavigate();
  const { carts, updateQuantity, removeItem, clearCart } = useCartStore();

  const storeIds = Object.keys(carts).filter(id => carts[id]?.items?.length > 0);

  if (storeIds.length === 0) {
    return (
      <div className="cart-page">
        <div className="cart-header">
          <button className="cart-header__back" onClick={() => navigate(-1)}>
            <ArrowLeft size={20} />
          </button>
          <h1>Mi Carrito</h1>
        </div>
        <div className="cart-empty">
          <ShoppingBag size={64} strokeWidth={1.2} />
          <h2>Tu carrito está vacío</h2>
          <p>Explora los comercios y agrega productos</p>
          <Link to="/" className="cart-empty__btn">
            <Store size={18} />
            Ver comercios
          </Link>
        </div>
      </div>
    );
  }

  // For now, handle first store cart (single-store checkout)
  const currentStoreId = storeIds[0];
  const store = mockStores.find(s => s.id === currentStoreId);
  const items = carts[currentStoreId]?.items || [];
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className="cart-page">
      <div className="cart-header">
        <button className="cart-header__back" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
        </button>
        <h1>Mi Carrito</h1>
      </div>

      {storeIds.map(storeId => {
        const st = mockStores.find(s => s.id === storeId);
        const cartItems = carts[storeId]?.items || [];
        const storeTotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

        return (
          <div key={storeId} className="cart-store-section">
            <div className="cart-store-name">
              <Store size={16} />
              {st?.name || 'Comercio'}
            </div>

            <div className="cart-items">
              <AnimatePresence>
                {cartItems.map(item => (
                  <motion.div
                    key={item.id}
                    className="cart-item"
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20, height: 0, marginBottom: 0, padding: 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    <div className="cart-item__image">
                      📦
                    </div>
                    <div className="cart-item__info">
                      <div className="cart-item__name">{item.name}</div>
                      <div className="cart-item__price">
                        {formatCurrency(item.price * item.quantity)}
                      </div>
                    </div>
                    <div className="cart-item__controls">
                      <button
                        className="cart-item__qty-btn cart-item__qty-btn--minus"
                        onClick={() => updateQuantity(storeId, item.id, item.quantity - 1)}
                      >
                        <Minus size={14} />
                      </button>
                      <span className="cart-item__qty">{item.quantity}</span>
                      <button
                        className="cart-item__qty-btn cart-item__qty-btn--plus"
                        onClick={() => updateQuantity(storeId, item.id, item.quantity + 1)}
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    <button
                      className="cart-item__delete"
                      onClick={() => removeItem(storeId, item.id)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        );
      })}

      {/* Summary */}
      <div className="cart-summary">
        <div className="cart-summary__row">
          <span>Subtotal ({items.length} productos)</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>
        <div className="cart-summary__row">
          <span>Envío</span>
          <span style={{ color: 'var(--higo-gray-400)', fontSize: 'var(--font-xs)' }}>
            Calculado en checkout
          </span>
        </div>
        <div className="cart-summary__row cart-summary__row--total">
          <span>Total productos</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>
      </div>

      {/* Checkout Bar */}
      <div className="cart-checkout-bar">
        <Link
          to={`/checkout/${currentStoreId}`}
          className="cart-checkout-btn"
          id="go-to-checkout"
        >
          <span>Ir al Checkout</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {formatCurrency(subtotal)}
            <ArrowRight size={18} />
          </span>
        </Link>
      </div>
    </div>
  );
}

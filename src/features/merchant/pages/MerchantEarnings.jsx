import { useEffect, useMemo, useState } from 'react';
import { TrendingUp, CircleDollarSign, Package, Clock } from 'lucide-react';
import { Spinner } from '../../../components/ui/Spinner.jsx';
import { fetchStoreOrdersRemote } from '../../../services/orderService.js';
import { formatCurrency } from '../../../services/deliveryPricing.js';
import './MerchantEarnings.css';

const PERIODS = [
  { id: 'today', label: 'Hoy' },
  { id: 'week', label: '7 días' },
  { id: 'month', label: '30 días' },
  { id: 'all', label: 'Total' },
];

function withinPeriod(iso, periodId) {
  if (!iso) return false;
  if (periodId === 'all') return true;
  const ts = new Date(iso).getTime();
  if (Number.isNaN(ts)) return false;
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  if (periodId === 'today') {
    const start = new Date(); start.setHours(0, 0, 0, 0);
    return ts >= start.getTime();
  }
  if (periodId === 'week') return now - ts <= 7 * day;
  if (periodId === 'month') return now - ts <= 30 * day;
  return false;
}

const COMPLETED = new Set([
  'DELIVERED',
  'DELIVERY_PAYMENT_CONFIRMED', // por si la entrega cerró antes del cambio final
]);

export function MerchantEarnings({ store }) {
  const storeId = store?.id;
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState('week');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!storeId) return;
    let mounted = true;
    setIsLoading(true);
    fetchStoreOrdersRemote(storeId)
      .then((rows) => { if (mounted) setOrders(rows); })
      .catch((err) => { if (mounted) setError(err.message || 'Error cargando pedidos'); })
      .finally(() => { if (mounted) setIsLoading(false); });
    return () => { mounted = false; };
  }, [storeId]);

  const summary = useMemo(() => {
    const completed = orders.filter((o) => COMPLETED.has(o.status));
    const inPeriod = completed.filter((o) => withinPeriod(o.createdAt, period));
    const totalProduct = inPeriod.reduce((sum, o) => sum + Number(o.productTotal || 0), 0);
    const totalGrand = inPeriod.reduce((sum, o) => sum + Number(o.grandTotal || 0), 0);
    const totalDelivery = inPeriod.reduce((sum, o) => sum + Number(o.deliveryFee || 0), 0);
    return {
      count: inPeriod.length,
      totalProduct,
      totalDelivery,
      totalGrand,
      lastFive: inPeriod.slice(0, 5),
    };
  }, [orders, period]);

  if (isLoading) return <div className="merchant-loading"><Spinner size="md" /></div>;

  return (
    <div className="merchant-earnings">
      <div className="merchant-earnings__period">
        {PERIODS.map((p) => (
          <button
            key={p.id}
            className={`merchant-earnings__pill ${period === p.id ? 'active' : ''}`}
            onClick={() => setPeriod(p.id)}
          >
            {p.label}
          </button>
        ))}
      </div>

      {error && <div className="merchant-earnings__error">{error}</div>}

      <div className="merchant-earnings__cards">
        <div className="merchant-earnings__card">
          <CircleDollarSign size={20} color="#10b981" />
          <div>
            <span>Ingresos por productos</span>
            <strong>{formatCurrency(summary.totalProduct)}</strong>
          </div>
        </div>
        <div className="merchant-earnings__card">
          <Package size={20} color="#3b82f6" />
          <div>
            <span>Pedidos entregados</span>
            <strong>{summary.count}</strong>
          </div>
        </div>
        <div className="merchant-earnings__card">
          <TrendingUp size={20} color="#f59e0b" />
          <div>
            <span>Total con envío</span>
            <strong>{formatCurrency(summary.totalGrand)}</strong>
          </div>
        </div>
      </div>

      <section className="merchant-earnings__recent">
        <h3><Clock size={14} /> Últimos pedidos en el período</h3>
        {summary.lastFive.length === 0 ? (
          <div className="merchant-empty"><p>Sin pedidos completados en este período.</p></div>
        ) : (
          <ul>
            {summary.lastFive.map((o) => (
              <li key={o.id}>
                <div>
                  <strong>Ref {(o.id || '').slice(0, 8)}</strong>
                  <span>{new Date(o.createdAt).toLocaleString('es-VE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <span className="merchant-earnings__amount">{formatCurrency(o.productTotal)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="merchant-earnings__note">
        La tarifa de envío la cobra el driver al momento de la entrega y no se incluye en
        los ingresos por productos del comercio.
      </p>
    </div>
  );
}

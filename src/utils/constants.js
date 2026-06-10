export const APP_NAME = 'Higo App';

// Estados de pedido. Se exponen como objeto (acceso por nombre) e incluyen
// tanto los estados granulares del flujo de pago dividido como los alias
// legacy, para que useOrderStore y otros consumidores existentes sigan
// funcionando sin cambios. La fuente de verdad del array ordenado y los
// labels en español vive en src/services/orderStatus.js.
export const ORDER_STATUSES = {
  // Pago de productos (al comercio)
  PENDING_PRODUCT_PAYMENT: 'PENDING_PRODUCT_PAYMENT',
  PRODUCT_PAYMENT_REPORTED: 'PRODUCT_PAYMENT_REPORTED',
  PRODUCT_PAYMENT_VERIFIED: 'PRODUCT_PAYMENT_VERIFIED',
  // Preparación + matcheo de driver
  PREPARING: 'PREPARING',
  READY_FOR_DRIVER_MATCH: 'READY_FOR_DRIVER_MATCH',
  DRIVER_CANDIDATE_BROADCASTED: 'DRIVER_CANDIDATE_BROADCASTED',
  DRIVER_ASSIGNED: 'DRIVER_ASSIGNED',
  // Recogida y traslado
  DRIVER_EN_ROUTE_TO_STORE: 'DRIVER_EN_ROUTE_TO_STORE',
  PICKED_UP: 'PICKED_UP',
  DRIVER_EN_ROUTE_TO_CUSTOMER: 'DRIVER_EN_ROUTE_TO_CUSTOMER',
  // Pago de envío (al driver)
  DELIVERY_PAYMENT_PENDING: 'DELIVERY_PAYMENT_PENDING',
  DELIVERY_PAYMENT_REPORTED: 'DELIVERY_PAYMENT_REPORTED',
  DELIVERY_PAYMENT_CONFIRMED: 'DELIVERY_PAYMENT_CONFIRMED',
  // Cierre
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
  // Alias legacy (compatibilidad con pedidos viejos)
  PENDING_PAYMENT: 'PENDING_PAYMENT',
  PAYMENT_VERIFIED: 'PAYMENT_VERIFIED',
  READY_TO_DISPATCH: 'READY_TO_DISPATCH',
};

export const STORE_CATEGORIES = [
  { id: 'all', label: 'Todos', icon: 'grid' },
  { id: 'restaurant', label: 'Restaurantes', icon: 'utensils' },
  { id: 'pharmacy', label: 'Farmacias', icon: 'first-aid' },
  { id: 'bakery', label: 'Panaderías', icon: 'cake' },
  { id: 'grocery', label: 'Bodegones', icon: 'shopping-bag' },
  { id: 'cafe', label: 'Cafeterías', icon: 'coffee' }
];

export const DELIVERY_CONFIG = {
  baseFee: 1.50,
  perKmRate: 1.00,
  minFee: 2.00,
  maxFee: 10.00
};


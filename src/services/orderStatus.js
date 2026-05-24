export const ORDER_STATUSES = Object.freeze([
  'PENDING_PAYMENT',
  'PAYMENT_VERIFIED',
  'PREPARING',
  'READY_TO_DISPATCH',
  'DRIVER_ASSIGNED',
  'PICKED_UP',
  'DELIVERED',
  'CANCELLED',
]);

export const ORDER_STATUS_LABELS = Object.freeze({
  PENDING_PAYMENT: 'Pago pendiente',
  PAYMENT_VERIFIED: 'Pago verificado',
  PREPARING: 'Preparando pedido',
  READY_TO_DISPATCH: 'Listo para despachar',
  DRIVER_ASSIGNED: 'Driver asignado',
  PICKED_UP: 'En camino',
  DELIVERED: 'Entregado',
  CANCELLED: 'Cancelado',
});

export function assertValidOrderStatus(status) {
  if (!status || typeof status !== 'string' || !ORDER_STATUSES.includes(status)) {
    throw new Error(`orderStatus: status inválido (${status ?? 'null'})`);
  }
}

export function formatOrderStatus(status) {
  return ORDER_STATUS_LABELS[status] || status || 'Sin estado';
}

const ORDER_EVENT_LABELS = Object.freeze({
  ORDER_CREATED: 'Pedido creado',
  PAYMENT_VERIFIED: 'Pago verificado',
  PREPARING: 'Preparando pedido',
  READY_TO_DISPATCH: 'Listo para despacho',
  DRIVER_ASSIGNED: 'Driver asignado',
  ORDER_PICKED_UP: 'Pedido retirado',
  PICKED_UP: 'Pedido retirado',
  ORDER_DELIVERED: 'Pedido entregado',
  DELIVERED: 'Pedido entregado',
  ORDER_CANCELLED: 'Pedido cancelado',
});

export function formatOrderEventType(eventType) {
  return ORDER_EVENT_LABELS[eventType] || eventType || 'Evento';
}

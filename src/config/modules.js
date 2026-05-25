// Registro de módulos (verticales) de Higo App.
// Higo Shop es el módulo activo; Viajes y Envíos quedan como fundación
// "Próximamente" — comparten el mismo core (auth, mapas, tracking, pagos)
// y se habilitan agregando su flujo + orderType sin re-arquitectura.
export const MODULES = [
  {
    id: 'shop',
    name: 'Higo Shop',
    tagline: 'Comida, farmacia, bodegón y más',
    emoji: '🛍️',
    route: '/shop',
    status: 'active',
    orderType: 'shop',
    accent: '#3B82F6',
  },
  {
    id: 'viajes',
    name: 'Higo Viajes',
    tagline: 'Viajes en moto y carro',
    emoji: '🛵',
    route: '/viajes',
    status: 'soon',
    orderType: 'ride',
    accent: '#10B981',
  },
  {
    id: 'envios',
    name: 'Higo Envíos',
    tagline: 'Envía paquetes en la ciudad',
    emoji: '📦',
    route: '/envios',
    status: 'soon',
    orderType: 'parcel',
    accent: '#F59E0B',
  },
];

export const DEFAULT_ORDER_TYPE = 'shop';

export function getModule(id) {
  return MODULES.find((m) => m.id === id) || null;
}

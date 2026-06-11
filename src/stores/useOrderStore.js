import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { nanoid } from 'nanoid';
import { ORDER_STATUSES } from '../utils/constants.js';

export const useOrderStore = create(
  persist(
    (set, get) => ({
      orders: [],
      activeOrderId: null,

      createOrder: (orderData) => {
        const order = {
          id: `order-${nanoid(8)}`,
          // Default v2: arranca en el flujo granular de pago dividido
          // y queda etiquetado como módulo Shop. Si el caller pasa su
          // propio status/orderType/sub-estados, gana el del caller.
          status: ORDER_STATUSES.PENDING_PRODUCT_PAYMENT,
          orderType: 'shop',
          productPaymentStatus: ORDER_STATUSES.PENDING_PRODUCT_PAYMENT,
          deliveryPaymentStatus: ORDER_STATUSES.DELIVERY_PAYMENT_PENDING,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          driverId: null,
          ...orderData,
        };

        set((state) => ({
          orders: [order, ...state.orders],
          activeOrderId: order.id,
        }));

        return order;
      },

      updateOrderStatus: (orderId, status) => {
        set((state) => ({
          orders: state.orders.map(o =>
            o.id === orderId
              ? { ...o, status, updatedAt: new Date().toISOString() }
              : o
          ),
        }));
      },

      assignDriver: (orderId, driverId) => {
        set((state) => ({
          orders: state.orders.map(o =>
            o.id === orderId
              ? {
                  ...o,
                  driverId,
                  status: ORDER_STATUSES.DRIVER_ASSIGNED,
                  updatedAt: new Date().toISOString(),
                }
              : o
          ),
        }));
      },

      getActiveOrders: () => {
        return get().orders.filter(
          o => o.status !== ORDER_STATUSES.DELIVERED && o.status !== ORDER_STATUSES.CANCELLED
        );
      },

      getOrderById: (id) => {
        return get().orders.find(o => o.id === id);
      },

      setActiveOrder: (orderId) => {
        set({ activeOrderId: orderId });
      },

      upsertRemoteOrder: (remoteOrder) => {
        set((state) => {
          const idx = state.orders.findIndex((o) => o.id === remoteOrder.id);
          if (idx === -1) {
            return { orders: [remoteOrder, ...state.orders] };
          }
          const merged = [...state.orders];
          merged[idx] = { ...merged[idx], ...remoteOrder };
          return { orders: merged };
        });
      },
    }),
    {
      name: 'higo-shop-orders',
    }
  )
);

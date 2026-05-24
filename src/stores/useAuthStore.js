import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set) => ({
      role: 'customer',
      userId: 'driver-higuerote-demo',
      userName: 'Usuario',
      userPhone: '0412-0000000',

      setRole: (role) => set({ role }),
      setUserInfo: ({ userId, userName, userPhone }) => set({ userId: userId || 'driver-higuerote-demo', userName, userPhone }),
    }),
    {
      name: 'higo-shop-auth',
    }
  )
);

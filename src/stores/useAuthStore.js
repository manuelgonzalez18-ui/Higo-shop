import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set) => ({
      role: 'customer',
      userId: '00000000-0000-0000-0000-000000000001',
      userName: 'Usuario',
      userPhone: '0412-0000000',

      setRole: (role) => set({ role }),
      setUserInfo: ({ userId, userName, userPhone }) => set({ userId: userId || '00000000-0000-0000-0000-000000000001', userName, userPhone }),
    }),
    {
      name: 'higo-shop-auth',
    }
  )
);

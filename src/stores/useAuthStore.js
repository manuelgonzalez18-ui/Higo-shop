import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set) => ({
      role: 'customer',
      userName: 'Usuario',
      userPhone: '0412-0000000',

      setRole: (role) => set({ role }),
      setUserInfo: ({ userName, userPhone }) => set({ userName, userPhone }),
    }),
    {
      name: 'higo-shop-auth',
    }
  )
);

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product, quantity = 1) => {
        const items = get().items;
        const existing = items.find((i) => i.product.id === product.id);
        if (existing) {
          set({
            items: items.map((i) =>
              i.product.id === product.id
                ? { ...i, quantity: i.quantity + quantity }
                : i
            ),
          });
        } else {
          set({ items: [...items, { product, quantity }] });
        }
      },

      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          set({ items: get().items.filter((i) => i.product.id !== productId) });
          return;
        }
        set({
          items: get().items.map((i) =>
            i.product.id === productId ? { ...i, quantity } : i
          ),
        });
      },

      removeItem: (productId) => {
        set({ items: get().items.filter((i) => i.product.id !== productId) });
      },

      clearCart: () => set({ items: [] }),

      getTotal: () => {
        return get().items.reduce(
          (total, item) => total + item.product.price * item.quantity,
          0
        );
      },

      getItemCount: () => {
        return get().items.reduce((count, item) => count + item.quantity, 0);
      },
    }),
    { name: 'vyta-cart' }
  )
);

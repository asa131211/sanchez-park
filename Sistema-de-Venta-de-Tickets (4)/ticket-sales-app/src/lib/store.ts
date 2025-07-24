import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Product, Sale, CashBox } from './database';

interface CartItem {
  product: Product;
  quantity: number;
}

interface AppState {
  // Autenticación
  currentUser: User | null;
  isAuthenticated: boolean;

  // UI
  darkMode: boolean;
  sidebarOpen: boolean;

  // Carrito
  cart: CartItem[];

  // Caja
  currentCashBox: CashBox | null;

  // Datos
  products: Product[];
  users: User[];
  sales: Sale[];

  // Estado offline
  isOnline: boolean;
  lastSync: Date | null;

  // Acciones de autenticación
  login: (user: User) => void;
  logout: () => void;

  // Acciones de UI
  toggleDarkMode: () => void;
  toggleSidebar: () => void;

  // Acciones de carrito
  addToCart: (product: Product) => void;
  removeFromCart: (productId: number) => void;
  updateCartQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;

  // Acciones de caja
  openCashBox: (cashBox: CashBox) => void;
  closeCashBox: () => void;

  // Acciones de datos
  setProducts: (products: Product[]) => void;
  setUsers: (users: User[]) => void;
  setSales: (sales: Sale[]) => void;

  // Acciones de sincronización
  setOnlineStatus: (isOnline: boolean) => void;
  updateLastSync: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Estado inicial
      currentUser: null,
      isAuthenticated: false,
      darkMode: false,
      sidebarOpen: true,
      cart: [],
      currentCashBox: null,
      products: [],
      users: [],
      sales: [],
      isOnline: navigator?.onLine ?? true,
      lastSync: null,

      // Acciones de autenticación
      login: (user) => set({
        currentUser: user,
        isAuthenticated: true
      }),

      logout: () => set({
        currentUser: null,
        isAuthenticated: false,
        cart: [],
        currentCashBox: null
      }),

      // Acciones de UI
      toggleDarkMode: () => set((state) => ({
        darkMode: !state.darkMode
      })),

      toggleSidebar: () => set((state) => ({
        sidebarOpen: !state.sidebarOpen
      })),

      // Acciones de carrito
      addToCart: (product) => set((state) => {
        const existingItem = state.cart.find(item => item.product.id === product.id);
        if (existingItem) {
          return {
            cart: state.cart.map(item =>
              item.product.id === product.id
                ? { ...item, quantity: item.quantity + 1 }
                : item
            )
          };
        }
        return {
          cart: [...state.cart, { product, quantity: 1 }]
        };
      }),

      removeFromCart: (productId) => set((state) => ({
        cart: state.cart.filter(item => item.product.id !== productId)
      })),

      updateCartQuantity: (productId, quantity) => set((state) => {
        if (quantity <= 0) {
          return {
            cart: state.cart.filter(item => item.product.id !== productId)
          };
        }
        return {
          cart: state.cart.map(item =>
            item.product.id === productId
              ? { ...item, quantity }
              : item
          )
        };
      }),

      clearCart: () => set({ cart: [] }),

      // Acciones de caja
      openCashBox: (cashBox) => set({ currentCashBox: cashBox }),
      closeCashBox: () => set({ currentCashBox: null }),

      // Acciones de datos
      setProducts: (products) => set({ products }),
      setUsers: (users) => set({ users }),
      setSales: (sales) => set({ sales }),

      // Acciones de sincronización
      setOnlineStatus: (isOnline) => set({ isOnline }),
      updateLastSync: () => set({ lastSync: new Date() }),
    }),
    {
      name: 'ticket-sales-storage',
      partialize: (state) => ({
        darkMode: state.darkMode,
        currentUser: state.currentUser,
        isAuthenticated: state.isAuthenticated,
        lastSync: state.lastSync,
      }),
    }
  )
);

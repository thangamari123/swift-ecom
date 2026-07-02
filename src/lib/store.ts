import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from 'firebase/auth';

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  size?: string;
  color?: string;
}

interface StoreSettings {
  storeName: string;
  logoUrl?: string;
  supportEmail?: string;
  supportPhone?: string;
  taxRate?: number;
  flatShippingRate?: number;
  freeShippingThreshold?: number;
  enableStripe?: boolean;
  enablePayPal?: boolean;
  enableCOD?: boolean;
}

interface AppState {
  user: User | null;
  userRole: 'customer' | 'admin' | 'Administrator' | 'Manager' | 'Editor' | 'Support' | string | null;
  setUser: (user: User | null, role?: 'customer' | 'admin' | 'Administrator' | 'Manager' | 'Editor' | 'Support' | string | null) => void;
  
  storeSettings: StoreSettings;
  setStoreSettings: (settings: StoreSettings) => void;
  
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  
  wishlist: string[];
  toggleWishlist: (id: string) => void;
  clearWishlist: () => void;

  isLoginPopupOpen: boolean;
  setLoginPopupOpen: (isOpen: boolean) => void;
  pendingAuthAction: (() => void) | null;
  setPendingAuthAction: (action: (() => void) | null) => void;
  executePendingAction: () => void;
  requireAuth: (action: () => void) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      user: null,
      userRole: null,
      setUser: (user, role = null) => set({ user, userRole: role }),
      
      storeSettings: { storeName: 'Shoply.' },
      setStoreSettings: (storeSettings) => set({ storeSettings }),
      
      cart: [],
      addToCart: (item) => set((state) => {
        const existingItem = state.cart.find((c) => c.id === item.id);
        if (existingItem) {
          return {
            cart: state.cart.map((c) => 
              c.id === item.id ? { ...c, quantity: c.quantity + item.quantity } : c
            )
          };
        }
        return { cart: [...state.cart, item] };
      }),
      removeFromCart: (id) => set((state) => ({
        cart: state.cart.filter((c) => c.id !== id)
      })),
      updateQuantity: (id, quantity) => set((state) => ({
        cart: state.cart.map((c) => c.id === id ? { ...c, quantity } : c)
      })),
      clearCart: () => set({ cart: [] }),
      
      wishlist: [],
      toggleWishlist: (id) => set((state) => {
        if (state.wishlist.includes(id)) {
          return { wishlist: state.wishlist.filter((w) => w !== id) };
        }
        return { wishlist: [...state.wishlist, id] };
      }),
      clearWishlist: () => set({ wishlist: [] }),

      isLoginPopupOpen: false,
      setLoginPopupOpen: (isOpen) => set({ isLoginPopupOpen: isOpen }),
      pendingAuthAction: null,
      setPendingAuthAction: (action) => set({ pendingAuthAction: action }),
      executePendingAction: () => {
        const { pendingAuthAction } = get();
        if (pendingAuthAction) {
          pendingAuthAction();
          set({ pendingAuthAction: null });
        }
      },
      requireAuth: (action) => {
        const { user } = get();
        if (user) {
          action();
        } else {
          set({ pendingAuthAction: action, isLoginPopupOpen: true });
        }
      }
    }),
    {
      name: 'ecommerce-storage',
      partialize: (state) => ({ cart: state.cart, wishlist: state.wishlist }), // Only persist cart and wishlist
    }
  )
);

import { useState, useEffect } from 'react';

// --- Cart Types ---
export interface CartItem {
  id: string; // The Product ID
  name: string;
  priceValue: number; // Stored as a pure number for math (e.g. 1290 instead of "$1,290")
  priceString: string; // Display string "$1,290"
  imageUrl: string;
  quantity: number;
}

const CART_STORAGE_KEY = 'ceylonvista_cart_v1';

// --- Simple Global Store (Alternative to Context for speed/simplicity) ---
// Since React router components need this globally but we want to avoid wrapping the whole app
// in a provider if not strictly necessary, we can use a custom hook that syncs to localStorage
// and emits custom events to cross-communicate between components (like Navbar <-> ProductPage).

export function useCart() {
  const [items, setItems] = useState<CartItem[]>(() => {
    const savedCart = localStorage.getItem(CART_STORAGE_KEY);
    if (savedCart) {
      try {
        return JSON.parse(savedCart);
      } catch (e) {
        console.error('Failed to parse cart JSON', e);
        return [];
      }
    }
    return [];
  });

  useEffect(() => {

    // 2. Listen for tab-sync or custom events to update state globally
    const handleCartUpdate = () => {
      const refreshedCart = localStorage.getItem(CART_STORAGE_KEY);
      if (refreshedCart) setItems(JSON.parse(refreshedCart));
    };

    window.addEventListener('storage', handleCartUpdate);
    window.addEventListener('cart-updated', handleCartUpdate);

    return () => {
      window.removeEventListener('storage', handleCartUpdate);
      window.removeEventListener('cart-updated', handleCartUpdate);
    };
  }, []);

  const saveToStorageAndNotify = (newItems: CartItem[]) => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(newItems));
    setItems(newItems);
    // Dispatch custom event so other components (like Navbar) instantly re-render
    window.dispatchEvent(new Event('cart-updated'));
  };

  const addItem = (newItem: CartItem) => {
    const existingItems = [...items];
    const index = existingItems.findIndex(i => i.id === newItem.id);

    if (index >= 0) {
      // If item exists, just add the quantity
      existingItems[index].quantity += newItem.quantity;
    } else {
      // Otherwise push new product
      existingItems.push(newItem);
    }
    saveToStorageAndNotify(existingItems);
  };

  const removeItem = (id: string) => {
    const filteredItems = items.filter(item => item.id !== id);
    saveToStorageAndNotify(filteredItems);
  };

  const updateQuantity = (id: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(id);
      return;
    }
    const updatedItems = items.map(item => 
      item.id === id ? { ...item, quantity: newQuantity } : item
    );
    saveToStorageAndNotify(updatedItems);
  };

  const clearCart = () => {
    saveToStorageAndNotify([]);
  };

  // --- Computed Helpers ---
  const totalItemsCount = items.reduce((acc, item) => acc + item.quantity, 0);
  const cartSubtotal = items.reduce((acc, item) => acc + (item.priceValue * item.quantity), 0);

  return {
    items,
    totalItemsCount,
    cartSubtotal,
    addItem,
    removeItem,
    updateQuantity,
    clearCart
  };
}

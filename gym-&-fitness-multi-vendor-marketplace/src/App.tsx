import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import NavigationSidebar from './components/NavigationSidebar';
import HomeView from './components/HomeView';
import CartView from './components/CartView';
import OrdersView from './components/OrdersView';
import RegistryView from './components/RegistryView';
import AuthView from './components/AuthView';
import ProductDetailsModal from './components/ProductDetailsModal';
import VendorDashboard from './components/VendorDashboard';

import { INITIAL_PRODUCTS, INITIAL_VENDORS } from './data';
import { Product, Vendor, User, CartItem, Order } from './types';

export default function App() {
  // --- Persistent States (backed by localStorage) ---
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const raw = localStorage.getItem('vyta_user_jwt');
    return raw ? JSON.parse(raw) : null;
  });

  const [products, setProducts] = useState<Product[]>(() => {
    const raw = localStorage.getItem('vyta_catalog');
    return raw ? JSON.parse(raw) : INITIAL_PRODUCTS;
  });

  const [vendors, setVendors] = useState<Vendor[]>(() => {
    const raw = localStorage.getItem('vyta_sellers');
    return raw ? JSON.parse(raw) : INITIAL_VENDORS;
  });

  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    const raw = localStorage.getItem('vyta_cart');
    return raw ? JSON.parse(raw) : [];
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    const raw = localStorage.getItem('vyta_orders_ledger');
    return raw ? JSON.parse(raw) : [];
  });

  // --- UI Layout state engines ---
  const [selectedView, setSelectedView] = useState<'home' | 'cart' | 'orders' | 'registry' | 'dashboard' | 'auth'>('home');
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Departments');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [deliveryRegion, setDeliveryRegion] = useState('Sri Lanka');

  // --- LocalStorage synchronizer effects ---
  useEffect(() => {
    localStorage.setItem('vyta_user_jwt', currentUser ? JSON.stringify(currentUser) : '');
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('vyta_catalog', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('vyta_sellers', JSON.stringify(vendors));
  }, [vendors]);

  useEffect(() => {
    localStorage.setItem('vyta_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  useEffect(() => {
    localStorage.setItem('vyta_orders_ledger', JSON.stringify(orders));
  }, [orders]);

  // --- Dynamic Operations Callbacks ---
  const handleAddToCart = (product: Product, quantity: number) => {
    setCartItems((prevItems) => {
      const exists = prevItems.find((item) => item.product.id === product.id);
      if (exists) {
        return prevItems.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prevItems, { product, quantity }];
    });
  };

  const handleUpdateCartQuantity = (productId: string, quantity: number) => {
    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const handleRemoveCartItem = (productId: string) => {
    setCartItems((prevItems) => prevItems.filter((item) => item.product.id !== productId));
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  const handleCheckoutComplete = (newOrder: Order) => {
    setOrders((prevOrders) => [newOrder, ...prevOrders]);
    
    // Vendor earnings increase logic
    setVendors((prevVendors) => 
      prevVendors.map((vendor) => {
        // Calculate vendor-specific share from this order
        const vendorAmount = newOrder.items
          .filter((item) => item.vendorId === vendor.id)
          .reduce((sum, item) => sum + (item.price * item.quantity), 0);

        if (vendorAmount === 0) return vendor;
        return {
          ...vendor,
          earnings: vendor.earnings + vendorAmount
        };
      })
    );
  };

  const handleAddProduct = (newProduct: Product) => {
    setProducts((prevProducts) => [newProduct, ...prevProducts]);
  };

  const handleUpdateProductStock = (productId: string, newStock: number) => {
    setProducts((prevProducts) =>
      prevProducts.map((p) => (p.id === productId ? { ...p, stock: newStock } : p))
    );
  };

  const handleUpdateProductPrice = (productId: string, newPrice: number) => {
    setProducts((prevProducts) =>
      prevProducts.map((p) => (p.id === productId ? { ...p, price: newPrice } : p))
    );
  };

  const handleUpdateOrderStatus = (orderId: string, status: 'Pending' | 'Processing' | 'Shipped' | 'Delivered') => {
    setOrders((prevOrders) =>
      prevOrders.map((o) => (o.id === orderId ? { ...o, status } : o))
    );
  };

  const handleAuthSuccess = (user: User) => {
    setCurrentUser(user);
    if (user.role === 'vendor') {
      setSelectedView('dashboard');
    } else {
      setSelectedView('home');
    }
  };

  const handleSignOut = () => {
    setCurrentUser(null);
    setSelectedView('home');
    // Clear custom vendor states
  };

  const handleGoHome = () => {
    setSelectedView('home');
  };

  const cartItemsCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className="min-h-screen bg-[#f7f7f7] text-gray-850 flex flex-col font-sans transition-all duration-150 relative">
      
      {/* Global Header */}
      <Header
        currentUser={currentUser}
        onSignOut={handleSignOut}
        onOpenCart={() => setSelectedView('cart')}
        onOpenOrders={() => setSelectedView('orders')}
        onOpenAuth={(tab) => {
          setAuthTab(tab);
          setSelectedView('auth');
        }}
        searchQuery={searchQuery}
        onSetSearchQuery={(q) => {
          setSearchQuery(q);
          setSelectedView('home');
        }}
        selectedCategory={selectedCategory}
        onSetSelectedCategory={(cat) => {
          setSelectedCategory(cat);
          setSearchQuery('');
          setSelectedView('home');
        }}
        cartItemsCount={cartItemsCount}
        onOpenRegistry={() => setSelectedView('registry')}
        onOpenDashboard={() => setSelectedView('dashboard')}
        onOpenAllSidebar={() => setIsSidebarOpen(true)}
        setDeliveryRegion={setDeliveryRegion}
        deliveryRegion={deliveryRegion}
        onGoHome={handleGoHome}
      />

      {/* Global Hamburger Sidebar navigation drawer overlay */}
      <NavigationSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        currentUser={currentUser}
        onOpenAuth={(tab) => {
          setAuthTab(tab);
          setSelectedView('auth');
        }}
        onSetSelectedCategory={(cat) => {
          setSelectedCategory(cat);
          setSelectedView('home');
        }}
        onOpenOrders={() => setSelectedView('orders')}
        onOpenRegistry={() => setSelectedView('registry')}
        onSignOut={handleSignOut}
        onGoHome={handleGoHome}
      />

      {/* Primary Page Layout router switcher */}
      <main className="flex-1">
        {selectedView === 'home' && (
          <HomeView
            products={products}
            onViewProduct={(p) => setSelectedProduct(p)}
            onAddToCart={handleAddToCart}
            selectedCategory={selectedCategory}
            onSetSelectedCategory={setSelectedCategory}
            searchQuery={searchQuery}
            onOpenRegistry={() => setSelectedView('registry')}
          />
        )}

        {selectedView === 'cart' && (
          <CartView
            cartItems={cartItems}
            onUpdateQuantity={handleUpdateCartQuantity}
            onRemoveItem={handleRemoveCartItem}
            onClearCart={handleClearCart}
            onCheckoutComplete={handleCheckoutComplete}
            currentUser={currentUser}
            deliveryRegion={deliveryRegion}
          />
        )}

        {selectedView === 'orders' && (
          <OrdersView
            orders={orders}
            currentUser={currentUser}
            onGoHome={handleGoHome}
          />
        )}

        {selectedView === 'registry' && (
          <RegistryView
            products={products}
            onAddToCart={handleAddToCart}
            currentUser={currentUser}
          />
        )}

        {selectedView === 'auth' && (
          <AuthView
            initialTab={authTab}
            onAuthSuccess={handleAuthSuccess}
            onCancel={handleGoHome}
          />
        )}

        {selectedView === 'dashboard' && (
          <VendorDashboard
            currentUser={currentUser}
            products={products}
            onAddProduct={handleAddProduct}
            onUpdateProductStock={handleUpdateProductStock}
            onUpdateProductPrice={handleUpdateProductPrice}
            orders={orders}
            onUpdateOrderStatus={handleUpdateOrderStatus}
            vendors={vendors}
          />
        )}
      </main>

      {/* Global Product specification Modal detail layer */}
      {selectedProduct && (
        <ProductDetailsModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={handleAddToCart}
          deliveryRegion={deliveryRegion}
        />
      )}

      {/* Global Footer */}
      <Footer onGoHome={handleGoHome} deliveryRegion={deliveryRegion} />

    </div>
  );
}

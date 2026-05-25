import { lazy, Suspense, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell.jsx';
import { GoogleMapsProvider } from './components/maps/MapView.jsx';
import { RouteErrorBoundary } from './components/layout/RouteErrorBoundary.jsx';
import { Spinner } from './components/ui/Spinner.jsx';
import { useAuthStore } from './stores/useAuthStore.js';

// Route-level code splitting: each feature page becomes its own chunk so the
// initial bundle only loads what's needed for the landing screen. Maps SDK
// itself is lazy-loaded by APIProvider on its own.
const loadHigoAppHome = () => import('./features/hub/pages/HigoAppHome.jsx').then((m) => ({ default: m.HigoAppHome }));
const loadMarketplaceHome = () => import('./features/marketplace/pages/MarketplaceHome.jsx').then((m) => ({ default: m.MarketplaceHome }));
const loadSearchMap = () => import('./features/marketplace/pages/SearchMap.jsx').then((m) => ({ default: m.SearchMap }));
const loadStoreView = () => import('./features/marketplace/pages/StoreView.jsx').then((m) => ({ default: m.StoreView }));
const loadCartPage = () => import('./features/cart/pages/CartPage.jsx').then((m) => ({ default: m.CartPage }));
const loadCheckoutPage = () => import('./features/checkout/pages/CheckoutPage.jsx').then((m) => ({ default: m.CheckoutPage }));
const loadOrdersPage = () => import('./features/orders/pages/OrdersPage.jsx').then((m) => ({ default: m.OrdersPage }));
const loadOrderDetailPage = () => import('./features/orders/pages/OrderDetailPage.jsx').then((m) => ({ default: m.OrderDetailPage }));
const loadProfilePage = () => import('./features/profile/pages/ProfilePage.jsx').then((m) => ({ default: m.ProfilePage }));
const loadMerchantDashboard = () => import('./features/merchant/pages/MerchantDashboard.jsx').then((m) => ({ default: m.MerchantDashboard }));
const loadDriverDashboard = () => import('./features/driver/pages/DriverDashboard.jsx').then((m) => ({ default: m.DriverDashboard }));

const HigoAppHome = lazy(loadHigoAppHome);
const MarketplaceHome = lazy(loadMarketplaceHome);
const SearchMap = lazy(loadSearchMap);
const StoreView = lazy(loadStoreView);
const CartPage = lazy(loadCartPage);
const CheckoutPage = lazy(loadCheckoutPage);
const OrdersPage = lazy(loadOrdersPage);
const OrderDetailPage = lazy(loadOrderDetailPage);
const ProfilePage = lazy(loadProfilePage);
const MerchantDashboard = lazy(loadMerchantDashboard);
const DriverDashboard = lazy(loadDriverDashboard);

// Routes reachable from the bottom nav from any screen — preloading their
// chunks during idle time after first paint makes the next tap feel instant.
function prefetchBottomNavRoutes() {
  const run = () => {
    loadSearchMap();
    loadCartPage();
    loadProfilePage();
  };
  if (typeof window === 'undefined') return;
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(run, { timeout: 2000 });
  } else {
    setTimeout(run, 1500);
  }
}

function HomeSelector() {
  const role = useAuthStore((s) => s.role);
  if (role === 'merchant') return <MerchantDashboard />;
  if (role === 'driver') return <DriverDashboard />;
  return <HigoAppHome />;
}

function RouteFallback() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60dvh',
    }}>
      <Spinner size="lg" />
    </div>
  );
}

export default function App() {
  useEffect(() => {
    prefetchBottomNavRoutes();
  }, []);

  return (
    <GoogleMapsProvider>
      <RouteErrorBoundary>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route element={<AppShell />}>
              <Route path="/" element={<HomeSelector />} />
              <Route path="/shop" element={<MarketplaceHome />} />
              <Route path="/search" element={<SearchMap />} />
              <Route path="/store/:storeId" element={<StoreView />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/checkout/:storeId" element={<CheckoutPage />} />
              <Route path="/orders" element={<OrdersPage />} />
              <Route path="/orders/:orderId" element={<OrderDetailPage />} />
              <Route path="/profile" element={<ProfilePage />} />
            </Route>
          </Routes>
        </Suspense>
      </RouteErrorBoundary>
    </GoogleMapsProvider>
  );
}

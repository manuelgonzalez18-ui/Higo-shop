import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell.jsx';
import { GoogleMapsProvider } from './components/maps/MapView.jsx';
import { Spinner } from './components/ui/Spinner.jsx';
import { useAuthStore } from './stores/useAuthStore.js';

// Route-level code splitting: each feature page becomes its own chunk so the
// initial bundle only loads what's needed for the landing screen. Maps SDK
// itself is lazy-loaded by APIProvider on its own.
const MarketplaceHome = lazy(() =>
  import('./features/marketplace/pages/MarketplaceHome.jsx').then((m) => ({ default: m.MarketplaceHome }))
);
const SearchMap = lazy(() =>
  import('./features/marketplace/pages/SearchMap.jsx').then((m) => ({ default: m.SearchMap }))
);
const StoreView = lazy(() =>
  import('./features/marketplace/pages/StoreView.jsx').then((m) => ({ default: m.StoreView }))
);
const CartPage = lazy(() =>
  import('./features/cart/pages/CartPage.jsx').then((m) => ({ default: m.CartPage }))
);
const CheckoutPage = lazy(() =>
  import('./features/checkout/pages/CheckoutPage.jsx').then((m) => ({ default: m.CheckoutPage }))
);
const OrdersPage = lazy(() =>
  import('./features/orders/pages/OrdersPage.jsx').then((m) => ({ default: m.OrdersPage }))
);
const OrderDetailPage = lazy(() =>
  import('./features/orders/pages/OrderDetailPage.jsx').then((m) => ({ default: m.OrderDetailPage }))
);
const ProfilePage = lazy(() =>
  import('./features/profile/pages/ProfilePage.jsx').then((m) => ({ default: m.ProfilePage }))
);
const MerchantDashboard = lazy(() =>
  import('./features/merchant/pages/MerchantDashboard.jsx').then((m) => ({ default: m.MerchantDashboard }))
);
const DriverDashboard = lazy(() =>
  import('./features/driver/pages/DriverDashboard.jsx').then((m) => ({ default: m.DriverDashboard }))
);

function HomeSelector() {
  const role = useAuthStore((s) => s.role);
  if (role === 'merchant') return <MerchantDashboard />;
  if (role === 'driver') return <DriverDashboard />;
  return <MarketplaceHome />;
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
  return (
    <GoogleMapsProvider>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/" element={<HomeSelector />} />
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
    </GoogleMapsProvider>
  );
}

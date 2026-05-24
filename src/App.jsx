import { Routes, Route } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell.jsx';
import { MarketplaceHome } from './features/marketplace/pages/MarketplaceHome.jsx';
import { SearchMap } from './features/marketplace/pages/SearchMap.jsx';
import { StoreView } from './features/marketplace/pages/StoreView.jsx';
import { CartPage } from './features/cart/pages/CartPage.jsx';
import { CheckoutPage } from './features/checkout/pages/CheckoutPage.jsx';
import { OrdersPage } from './features/orders/pages/OrdersPage.jsx';
import { OrderDetailPage } from './features/orders/pages/OrderDetailPage.jsx';
import { ProfilePage } from './features/profile/pages/ProfilePage.jsx';
import { MerchantDashboard } from './features/merchant/pages/MerchantDashboard.jsx';
import { DriverDashboard } from './features/driver/pages/DriverDashboard.jsx';
import { useAuthStore } from './stores/useAuthStore.js';

function HomeSelector() {
  const role = useAuthStore((s) => s.role);
  if (role === 'merchant') return <MerchantDashboard />;
  if (role === 'driver') return <DriverDashboard />;
  return <MarketplaceHome />;
}

export default function App() {
  return (
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
  );
}

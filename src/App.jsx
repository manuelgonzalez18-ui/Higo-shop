import { Routes, Route } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell.jsx';
import { MarketplaceHome } from './features/marketplace/pages/MarketplaceHome.jsx';
import { StoreView } from './features/marketplace/pages/StoreView.jsx';
import { CartPage } from './features/cart/pages/CartPage.jsx';
import { CheckoutPage } from './features/checkout/pages/CheckoutPage.jsx';
import { OrdersPage } from './features/orders/pages/OrdersPage.jsx';
import { OrderDetailPage } from './features/orders/pages/OrderDetailPage.jsx';
import { ProfilePage } from './features/profile/pages/ProfilePage.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<MarketplaceHome />} />
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

import { Routes, Route } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell.jsx';
import { RouteErrorBoundary } from './components/layout/RouteErrorBoundary.jsx';
import { ViajesListPage } from './features/viajes/pages/ViajesListPage.jsx';
import { ViajeDetallePage } from './features/viajes/pages/ViajeDetallePage.jsx';

export default function App() {
  return (
    <RouteErrorBoundary>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<ViajesListPage />} />
          <Route path="/viajes/:id" element={<ViajeDetallePage />} />
        </Route>
      </Routes>
    </RouteErrorBoundary>
  );
}

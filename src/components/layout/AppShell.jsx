import { Link, Outlet } from 'react-router-dom';
import { Bus } from 'lucide-react';
import './AppShell.css';

export function AppShell() {
  return (
    <div className="app-shell">
      <header className="app-shell__header">
        <Link to="/" className="app-shell__brand">
          <Bus size={20} />
          <span>Agencia de Viajes</span>
        </Link>
      </header>

      <div className="app-shell__content">
        <Outlet />
      </div>
    </div>
  );
}

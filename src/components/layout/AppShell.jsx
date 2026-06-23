import { Link, Outlet } from 'react-router-dom';
import { Bus } from 'lucide-react';
import './AppShell.css';

export function AppShell() {
  return (
    <div className="app-shell">
      <header className="app-shell__header">
        <Link to="/" className="app-shell__brand">
          <Bus size={20} />
          <span className="app-shell__brand-name">
            Gaby Tours <span className="app-shell__brand-year">2021</span>
          </span>
        </Link>
      </header>

      <div className="app-shell__content">
        <Outlet />
      </div>
    </div>
  );
}

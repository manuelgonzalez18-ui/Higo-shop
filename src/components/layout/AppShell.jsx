import { Link, Outlet } from 'react-router-dom';
import { Bus, LogOut } from 'lucide-react';
import { supabase } from '../../services/supabase.js';
import './AppShell.css';

const AUTH_REQUIRED = String(import.meta.env.VITE_REQUIRE_AUTH ?? 'false').toLowerCase() === 'true';

export function AppShell() {
  return (
    <div className="app-shell">
      <header className="app-shell__header">
        <Link to="/" className="app-shell__brand">
          <Bus size={20} />
          <span className="app-shell__brand-name">Gaby Tours <span className="app-shell__brand-year">2021</span></span>
        </Link>
        {AUTH_REQUIRED && (
          <button aria-label="Cerrar sesión" title="Cerrar sesión" onClick={() => supabase.auth.signOut()} style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--higo-gray-600)' }}>
            <LogOut size={18} /> <span className="app-shell__logout-label">Salir</span>
          </button>
        )}
      </header>
      <div className="app-shell__content"><Outlet /></div>
    </div>
  );
}

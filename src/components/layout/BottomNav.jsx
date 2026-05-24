import { NavLink } from 'react-router-dom';
import { Home, Map, Search, ShoppingBag, User } from 'lucide-react';
import { useCartStore } from '../../stores/useCartStore.js';
import './BottomNav.css';

export function BottomNav() {
  const totalItems = useCartStore((s) => s.getTotalItemCount());

  const tabs = [
    { to: '/', icon: Home, label: 'Inicio', variant: 'pill' },
    { to: '/map', icon: Map, label: 'Mapa', variant: 'pill' },
    { to: '/search', icon: Search, label: 'Buscar', variant: 'pill-wide' },
    { to: '/cart', icon: ShoppingBag, label: 'Carritos', badge: totalItems, variant: 'pill' },
    { to: '/profile', icon: User, label: 'Perfil', variant: 'pill' },
  ];

  return (
    <nav className="higo-bottom-nav" id="bottom-nav">
      <div className="higo-bottom-nav__inner">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) =>
              `higo-bottom-nav__item higo-bottom-nav__item--${tab.variant} ${isActive ? 'active' : ''}`
            }
            id={`nav-${tab.label.toLowerCase()}`}
            end={tab.to === '/'}
          >
            <span className="higo-bottom-nav__icon">
              <tab.icon size={20} strokeWidth={2.1} />
              {tab.badge > 0 && (
                <span className="higo-bottom-nav__badge">{tab.badge > 9 ? '9+' : tab.badge}</span>
              )}
            </span>
            {tab.variant === 'pill-wide' && (
              <span className="higo-bottom-nav__label">{tab.label}</span>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

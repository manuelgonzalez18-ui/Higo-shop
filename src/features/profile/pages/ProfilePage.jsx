import { Link } from 'react-router-dom';
import {
  Heart, Wallet, Bookmark, Car, Tag, Gift, HelpCircle, Users,
  Briefcase, ChevronRight, Settings, User
} from 'lucide-react';
import { useAuthStore } from '../../../stores/useAuthStore.js';
import './ProfilePage.css';

export function ProfilePage() {
  const { userName } = useAuthStore();
  const displayName = userName && userName !== 'Usuario' ? userName : 'Manuel Gonzalez';

  const quickActions = [
    { icon: Heart, label: 'Favoritos', to: '/profile' },
    { icon: Wallet, label: 'Billetera', to: '/profile' },
    { icon: Bookmark, label: 'Pedidos', to: '/orders' },
  ];

  const menuItems = [
    { icon: Car, label: 'Viajes' },
    { icon: Tag, label: 'Promociones' },
    { icon: Gift, label: 'Enviar un regalo' },
    { icon: HelpCircle, label: 'Ayuda' },
    { icon: Users, label: 'Grupos guardados', badge: 'NUEVO' },
  ];

  return (
    <div className="profile-page animate-fade-in">
      {/* Header */}
      <header className="profile-page__header">
        <h1>{displayName}</h1>
        <Link to="/profile/settings" className="profile-page__avatar" aria-label="Configuración">
          <User size={26} />
        </Link>
      </header>

      {/* Quick actions */}
      <div className="profile-quick-grid">
        {quickActions.map((a) => (
          <Link key={a.label} to={a.to} className="profile-quick-card">
            <a.icon size={20} />
            <span>{a.label}</span>
          </Link>
        ))}
      </div>

      {/* Promo banner */}
      <div className="profile-promo">
        <div className="profile-promo__text">
          <strong>Prueba Higo One sin costo</strong>
          <span>Llegan las mejores ofertas del año hasta el 24 de mayo</span>
        </div>
        <div className="profile-promo__art">✨</div>
      </div>

      {/* Menu list */}
      <nav className="profile-menu">
        {menuItems.map((m) => (
          <button key={m.label} className="profile-menu__item">
            <m.icon size={20} className="profile-menu__icon" />
            <span className="profile-menu__label">{m.label}</span>
            {m.badge && <span className="profile-menu__pill">{m.badge}</span>}
          </button>
        ))}

        {/* Business profile */}
        <button className="profile-menu__item profile-menu__item--stacked">
          <Briefcase size={20} className="profile-menu__icon" />
          <div className="profile-menu__stacked-text">
            <span className="profile-menu__label">Configura tu perfil de negocios</span>
            <span className="profile-menu__sub">Automatiza los gastos de viajes y comidas de trabajo</span>
          </div>
        </button>

        <Link to="/profile/settings" className="profile-menu__item">
          <Settings size={20} className="profile-menu__icon" />
          <span className="profile-menu__label">Configuración</span>
          <ChevronRight size={16} className="profile-menu__chevron" />
        </Link>
      </nav>
    </div>
  );
}

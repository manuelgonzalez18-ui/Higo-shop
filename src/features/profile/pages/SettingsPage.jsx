import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, User } from 'lucide-react';
import { useAuthStore } from '../../../stores/useAuthStore.js';
import './SettingsPage.css';

export function SettingsPage() {
  const navigate = useNavigate();
  const { role, setRole, userName } = useAuthStore();
  const displayName = userName && userName !== 'Usuario' ? userName : 'Manuel Gonzalez';

  const savedLocations = [
    { alias: 'casa', address: 'Miami Beach' },
    { alias: 'trabajo', address: 'Torre La Previsora' },
  ];

  const handleSwitchAccount = () => {
    if (role === 'customer') setRole('merchant');
    else if (role === 'merchant') setRole('driver');
    else setRole('customer');
  };

  return (
    <div className="settings-page animate-fade-in">
      {/* Header */}
      <header className="settings-page__header">
        <button className="settings-page__back" onClick={() => navigate(-1)} aria-label="Volver">
          <ArrowLeft size={22} />
        </button>
        <h1>Configuración</h1>
      </header>

      {/* Profile block */}
      <section className="settings-profile">
        <div className="settings-profile__avatar">
          <User size={36} strokeWidth={1.5} />
        </div>
        <h2 className="settings-profile__name">{displayName}</h2>
        <button className="settings-profile__edit">EDITA LA CUENTA</button>
      </section>

      <hr className="settings-divider" />

      {/* Saved locations */}
      <section className="settings-section">
        <h3 className="settings-section__title">Ubicaciones guardadas</h3>
        <div className="settings-locations">
          {savedLocations.map((loc) => (
            <button key={loc.alias} className="settings-location-row">
              <div className="settings-location-row__icon">
                <MapPin size={20} strokeWidth={1.6} />
              </div>
              <div className="settings-location-row__text">
                <div className="settings-location-row__alias">{loc.alias}</div>
                <div className="settings-location-row__addr">{loc.address}</div>
              </div>
            </button>
          ))}
        </div>
      </section>

      <hr className="settings-divider" />

      {/* Account actions */}
      <section className="settings-actions">
        <button className="settings-action settings-action--default" onClick={handleSwitchAccount}>
          Cambiar de cuenta
        </button>
        <button
          className="settings-action settings-action--danger"
          onClick={() => alert('Sesión cerrada correctamente.')}
        >
          Cerrar sesión
        </button>
      </section>
    </div>
  );
}

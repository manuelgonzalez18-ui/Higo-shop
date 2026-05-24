import { useAuthStore } from '../../../stores/useAuthStore.js';
import { useLocationStore } from '../../../stores/useLocationStore.js';
import { MapPin, Phone, Shield, Home, Briefcase, ArrowRight } from 'lucide-react';
import './ProfilePage.css';

export function ProfilePage() {
  const { role, userName, userPhone, setRole } = useAuthStore();
  const { deliveryAddress } = useLocationStore();

  const handleRoleCycle = () => {
    // Cycles role for easy testing in profile
    if (role === 'customer') setRole('merchant');
    else if (role === 'merchant') setRole('driver');
    else setRole('customer');
  };

  const handleLogout = () => {
    alert('Sesión cerrada correctamente.');
  };

  const savedLocations = [
    { alias: 'Casa', address: 'Miami Beach, FL, EE. UU.', icon: Home },
    { alias: 'Trabajo', address: 'Torre La Previsora, Caracas, VE', icon: Briefcase },
  ];

  return (
    <div className="profile-page animate-fade-in">
      {/* Profile Header Block */}
      <div className="profile-header-uber">
        <div className="profile-avatar-circle">
          {userName ? userName.charAt(0) : 'U'}
        </div>
        <div className="profile-info-col">
          <h2>{userName || 'Usuario Higo'}</h2>
          <span className="profile-edit-link" onClick={() => alert('Edición de cuenta en desarrollo')}>
            EDITA LA CUENTA
          </span>
        </div>
      </div>

      {/* Saved Locations */}
      <div className="profile-saved-locations">
        <h3 className="profile-section-title">Lugares guardados</h3>
        <div className="saved-locations-list">
          {savedLocations.map((loc) => (
            <div key={loc.alias} className="saved-location-item" onClick={() => alert(`Ubicación seleccionada: ${loc.alias}`)}>
              <div className="location-icon-bg">
                <loc.icon size={18} />
              </div>
              <div className="location-details">
                <span className="location-alias">{loc.alias}</span>
                <span className="location-address truncate">{loc.address}</span>
              </div>
              <ArrowRight size={14} style={{ color: 'var(--higo-gray-400)' }} />
            </div>
          ))}
        </div>
      </div>

      {/* Meta Info Panel */}
      <div className="profile-meta-info">
        <h3 className="profile-section-title" style={{ fontSize: '0.85rem', marginBottom: '8px' }}>
          Configuración de la app
        </h3>
        <div className="profile-meta-row">
          <span className="label">
            <Phone size={14} style={{ marginRight: 6, verticalAlign: -2 }} /> Teléfono
          </span>
          <span className="value">{userPhone}</span>
        </div>
        <div className="profile-meta-row">
          <span className="label">
            <MapPin size={14} style={{ marginRight: 6, verticalAlign: -2 }} /> Dirección
          </span>
          <span className="value truncate" style={{ maxWidth: '160px' }}>{deliveryAddress}</span>
        </div>
        <div className="profile-meta-row">
          <span className="label">
            <Shield size={14} style={{ marginRight: 6, verticalAlign: -2 }} /> Rol activo
          </span>
          <span className="value" style={{ textTransform: 'capitalize' }}>
            {role === 'customer' ? 'Cliente' : role === 'merchant' ? 'Comercio' : 'Repartidor'}
          </span>
        </div>
      </div>

      {/* Footer Critical Actions */}
      <div className="profile-footer-actions">
        <button className="btn-profile-switch-account" onClick={handleRoleCycle}>
          Cambiar de cuenta (Simular {role === 'customer' ? 'Comercio' : role === 'merchant' ? 'Repartidor' : 'Cliente'})
        </button>
        <button className="btn-profile-logout" onClick={handleLogout}>
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}

import { useAuthStore } from '../../../stores/useAuthStore.js';
import { useLocationStore } from '../../../stores/useLocationStore.js';
import { MapPin, User, Phone, Shield, Navigation, RefreshCw } from 'lucide-react';

export function ProfilePage() {
  const { role, userName, userPhone } = useAuthStore();
  const { deliveryAddress, requestLocation, isLocating } = useLocationStore();

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--higo-gray-50)' }}>
      {/* Profile Header */}
      <div style={{
        background: 'linear-gradient(135deg, var(--higo-blue), var(--higo-blue-dark))',
        padding: '2.5rem 1.5rem 3rem',
        textAlign: 'center',
        color: 'white',
      }}>
        <div style={{
          width: 72, height: 72, borderRadius: '50%', margin: '0 auto 1rem',
          background: 'rgba(255,255,255,0.2)', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <User size={32} />
        </div>
        <h1 style={{ fontSize: 'var(--font-xl)', fontWeight: 700, marginBottom: 4 }}>
          {userName}
        </h1>
        <p style={{ fontSize: 'var(--font-sm)', opacity: 0.75 }}>
          {role === 'customer' ? '👤 Cliente' : role === 'merchant' ? '🏪 Comercio' : '🛵 Driver'}
        </p>
      </div>

      <div style={{ padding: '1rem', marginTop: -20 }}>
        {/* Info Card */}
        <div style={{
          background: 'white', borderRadius: 16, padding: '1.25rem',
          boxShadow: 'var(--shadow-md)', marginBottom: '1rem',
        }}>
          <h3 style={{ fontSize: 'var(--font-base)', fontWeight: 700, marginBottom: '1rem' }}>
            Información
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 'var(--font-sm)', color: 'var(--higo-gray-600)' }}>
              <Phone size={16} color="var(--higo-blue)" />
              {userPhone}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 'var(--font-sm)', color: 'var(--higo-gray-600)' }}>
              <MapPin size={16} color="var(--higo-blue)" />
              {deliveryAddress}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 'var(--font-sm)', color: 'var(--higo-gray-600)' }}>
              <Shield size={16} color="var(--higo-blue)" />
              Rol actual: {role}
            </div>
          </div>
        </div>

        {/* Location Card */}
        <div style={{
          background: 'white', borderRadius: 16, padding: '1.25rem',
          boxShadow: 'var(--shadow-sm)', border: '1px solid var(--higo-gray-100)',
        }}>
          <h3 style={{ fontSize: 'var(--font-base)', fontWeight: 700, marginBottom: '0.75rem' }}>
            <Navigation size={16} style={{ marginRight: 8, verticalAlign: -2 }} />
            Ubicación
          </h3>
          <button
            onClick={requestLocation}
            disabled={isLocating}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 16px', background: 'var(--higo-blue-50)',
              color: 'var(--higo-blue)', borderRadius: 8,
              fontSize: 'var(--font-sm)', fontWeight: 600,
              opacity: isLocating ? 0.6 : 1,
            }}
          >
            <RefreshCw size={15} className={isLocating ? 'spin' : ''} />
            {isLocating ? 'Obteniendo...' : 'Actualizar ubicación'}
          </button>
        </div>
      </div>
    </div>
  );
}

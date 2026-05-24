import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, LocateFixed } from 'lucide-react';
import { useMapsLibrary } from '@vis.gl/react-google-maps';
import { AddressAutocomplete } from '../maps/AddressAutocomplete.jsx';
import { getCurrentPosition } from '../../services/geolocation.js';
import './AddressPickerSheet.css';

// Reusable bottom-sheet for picking a delivery address. Wraps the Places
// autocomplete + a one-tap "use my current location" reverse-geocode flow.
// onSelect receives { address, lat, lng } when the user commits a choice.
export function AddressPickerSheet({
  isOpen,
  title = 'Cambiar dirección',
  currentAddress,
  onClose,
  onSelect,
}) {
  const [draft, setDraft] = useState(currentAddress || '');
  const [isLocating, setIsLocating] = useState(false);
  const geocodingLib = useMapsLibrary('geocoding');

  useEffect(() => {
    if (isOpen) setDraft(currentAddress || '');
  }, [isOpen, currentAddress]);

  const handleUseMyLocation = async () => {
    setIsLocating(true);
    try {
      const pos = await getCurrentPosition();
      if (!geocodingLib) {
        onSelect({ address: 'Mi ubicación actual', lat: pos.lat, lng: pos.lng });
        setIsLocating(false);
        return;
      }
      const geocoder = new geocodingLib.Geocoder();
      geocoder.geocode({ location: pos }, (results, status) => {
        const address = status === 'OK' && results[0]
          ? results[0].formatted_address
          : 'Mi ubicación actual';
        onSelect({ address, lat: pos.lat, lng: pos.lng });
        setIsLocating(false);
      });
    } catch {
      setIsLocating(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="address-picker-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="address-picker-sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 260 }}
          >
            <div className="address-picker-header">
              <h3>{title}</h3>
              <button className="address-picker-close" onClick={onClose} type="button">
                <X size={18} />
              </button>
            </div>
            <div className="address-picker-body">
              <AddressAutocomplete
                value={draft}
                onChange={setDraft}
                onPlaceSelect={onSelect}
                placeholder="Buscar dirección con Google Maps..."
                className="address-picker-input"
                autoFocus
              />
              <button
                className="address-picker-locate"
                onClick={handleUseMyLocation}
                disabled={isLocating}
                type="button"
              >
                <LocateFixed size={16} className={isLocating ? 'spinning-icon' : ''} />
                {isLocating ? 'Obteniendo ubicación...' : 'Usar mi ubicación actual'}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

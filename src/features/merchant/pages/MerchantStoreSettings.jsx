import { useEffect, useState } from 'react';
import { Save, X, Store as StoreIcon, Phone, MapPin, Clock, ToggleLeft, ToggleRight } from 'lucide-react';
import { Spinner } from '../../../components/ui/Spinner.jsx';
import { updateStore } from '../../../services/storeService.js';
import './MerchantStoreSettings.css';

const CATEGORIES = [
  ['restaurant', 'Restaurante'],
  ['pharmacy', 'Farmacia'],
  ['bakery', 'Panadería'],
  ['grocery', 'Bodega'],
  ['cafe', 'Café'],
];

function emptyForm(store) {
  return {
    name: store?.name || '',
    category: store?.category || 'restaurant',
    description: store?.description || '',
    openHours: store?.openHours || '8:00 AM - 10:00 PM',
    deliveryTime: store?.deliveryTime || '20-30 min',
    address: store?.address || '',
    phone: store?.phone || '',
    isOpen: store?.isOpen !== false,
    pmPhone: store?.pagoMovil?.phone || '',
    pmBank: store?.pagoMovil?.bank || '',
    pmCedula: store?.pagoMovil?.cedula || '',
    pmHolder: store?.pagoMovil?.holder || '',
  };
}

export function MerchantStoreSettings({ store, onUpdated }) {
  const [form, setForm] = useState(emptyForm(store));
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => { setForm(emptyForm(store)); }, [store?.id]);

  if (!store) {
    return <div className="merchant-loading"><Spinner size="md" /></div>;
  }

  const setField = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));

  const submit = async () => {
    setIsSaving(true);
    setError(null);
    try {
      const updated = await updateStore(store.id, {
        name: form.name.trim(),
        category: form.category,
        description: form.description.trim(),
        openHours: form.openHours.trim(),
        deliveryTime: form.deliveryTime.trim(),
        address: form.address.trim(),
        phone: form.phone.trim(),
        isOpen: form.isOpen,
        pagoMovil: {
          phone: form.pmPhone.trim(),
          bank: form.pmBank.trim(),
          cedula: form.pmCedula.trim(),
          holder: form.pmHolder.trim(),
        },
      });
      onUpdated?.(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err.message || 'No se pudo guardar');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleOpen = () => setField('isOpen', !form.isOpen);

  return (
    <div className="merchant-store-settings">
      <div className="merchant-store-settings__open-toggle" onClick={toggleOpen} role="button">
        {form.isOpen ? <ToggleRight size={32} color="#10b981" /> : <ToggleLeft size={32} color="#94a3b8" />}
        <div>
          <strong>{form.isOpen ? 'Comercio abierto' : 'Comercio cerrado'}</strong>
          <span>{form.isOpen ? 'Recibe pedidos en este momento' : 'Los clientes no pueden hacer pedidos'}</span>
        </div>
      </div>

      <section className="merchant-store-settings__section">
        <h3><StoreIcon size={14} /> Datos básicos</h3>
        <div className="grid">
          <label>
            Nombre del comercio
            <input value={form.name} onChange={(e) => setField('name', e.target.value)} />
          </label>
          <label>
            Categoría
            <select value={form.category} onChange={(e) => setField('category', e.target.value)}>
              {CATEGORIES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </label>
          <label className="full">
            Descripción
            <textarea rows={2} value={form.description} onChange={(e) => setField('description', e.target.value)} />
          </label>
        </div>
      </section>

      <section className="merchant-store-settings__section">
        <h3><Clock size={14} /> Horario y tiempos</h3>
        <div className="grid">
          <label>
            Horario de atención
            <input value={form.openHours} onChange={(e) => setField('openHours', e.target.value)} placeholder="7:00 AM - 11:00 PM" />
          </label>
          <label>
            Tiempo estimado de preparación
            <input value={form.deliveryTime} onChange={(e) => setField('deliveryTime', e.target.value)} placeholder="20-30 min" />
          </label>
        </div>
      </section>

      <section className="merchant-store-settings__section">
        <h3><MapPin size={14} /> Ubicación y contacto</h3>
        <div className="grid">
          <label className="full">
            Dirección
            <input value={form.address} onChange={(e) => setField('address', e.target.value)} />
          </label>
          <label>
            Teléfono
            <input value={form.phone} onChange={(e) => setField('phone', e.target.value)} placeholder="0412-1234567" />
          </label>
        </div>
      </section>

      <section className="merchant-store-settings__section">
        <h3><Phone size={14} /> Datos de Pago Móvil</h3>
        <div className="grid">
          <label>
            Teléfono
            <input value={form.pmPhone} onChange={(e) => setField('pmPhone', e.target.value)} />
          </label>
          <label>
            Banco
            <input value={form.pmBank} onChange={(e) => setField('pmBank', e.target.value)} />
          </label>
          <label>
            Cédula / RIF
            <input value={form.pmCedula} onChange={(e) => setField('pmCedula', e.target.value)} />
          </label>
          <label>
            Titular
            <input value={form.pmHolder} onChange={(e) => setField('pmHolder', e.target.value)} />
          </label>
        </div>
      </section>

      {error && <div className="merchant-store-settings__error">{error}</div>}
      {saved && <div className="merchant-store-settings__ok">Cambios guardados ✓</div>}

      <div className="merchant-store-settings__actions">
        <button className="btn-ghost" onClick={() => setForm(emptyForm(store))} disabled={isSaving}>
          <X size={14} /> Descartar
        </button>
        <button className="btn-primary" onClick={submit} disabled={isSaving}>
          <Save size={14} /> {isSaving ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </div>
    </div>
  );
}

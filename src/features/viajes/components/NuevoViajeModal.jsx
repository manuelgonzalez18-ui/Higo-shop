import { useState } from 'react';
import { Modal } from '../../../components/ui/Modal.jsx';
import { Input } from '../../../components/ui/Input.jsx';
import { Button } from '../../../components/ui/Button.jsx';
import { DESTINOS } from '../../../data/destinos.js';

const initialState = { destinoId: DESTINOS[0].id, fecha: '', precioPasajero: '' };

export function NuevoViajeModal({ isOpen, onClose, onCreate, creating }) {
  const [form, setForm] = useState(initialState);

  const setField = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const destino = DESTINOS.find((d) => d.id === form.destinoId);
    await onCreate({
      destinoId: destino.id,
      destinoNombre: destino.nombre,
      fecha: form.fecha,
      precioPasajero: Number(form.precioPasajero) || 0,
      capacidadUnidad: destino.capacidadUnidad,
    });
    setForm(initialState);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nuevo viaje">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        <label>
          Destino
          <select
            value={form.destinoId}
            onChange={setField('destinoId')}
            style={{ width: '100%', padding: '10px 0', borderBottom: '1px solid var(--higo-gray-300)' }}
          >
            {DESTINOS.map((d) => (
              <option key={d.id} value={d.id}>{d.nombre} ({d.vehiculo}, cupo {d.capacidadUnidad})</option>
            ))}
          </select>
        </label>

        <Input label="Fecha del viaje" type="date" value={form.fecha} onChange={setField('fecha')} required />
        <Input label="Precio por pasajero ($)" type="number" min="0" step="0.01" value={form.precioPasajero} onChange={setField('precioPasajero')} required />

        <Button type="submit" fullWidth loading={creating}>Crear viaje</Button>
      </form>
    </Modal>
  );
}

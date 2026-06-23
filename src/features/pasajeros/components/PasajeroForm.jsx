import { useState } from 'react';
import { Input } from '../../../components/ui/Input.jsx';
import { Button } from '../../../components/ui/Button.jsx';
import { PUNTOS_RECOGIDA } from '../../../data/puntosRecogida.js';
import { OPCIONES_DESAYUNO, OPCIONES_ALMUERZO } from '../../../data/comidaOpciones.js';
import './PasajeroForm.css';

const initialState = {
  nombre: '',
  apellido: '',
  cedula: '',
  telefono: '',
  grupoNumero: '',
  montoReservado: '',
  puntoRecogida: PUNTOS_RECOGIDA[0],
  servicioComida: false,
  desayunoSolicitado: OPCIONES_DESAYUNO[0],
  desayunoCantidad: '1',
  almuerzoSolicitado: OPCIONES_ALMUERZO[0],
  almuerzoCantidad: '1',
};

export function PasajeroForm({ onSubmit, submitting }) {
  const [form, setForm] = useState(initialState);

  const setField = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onSubmit({
      nombre: form.nombre.trim(),
      apellido: form.apellido.trim(),
      cedula: form.cedula.trim(),
      telefono: form.telefono.trim(),
      grupoNumero: Number(form.grupoNumero),
      montoReservado: Number(form.montoReservado) || 0,
      puntoRecogida: form.puntoRecogida,
      servicioComida: form.servicioComida,
      desayunoSolicitado: form.servicioComida ? form.desayunoSolicitado : '',
      desayunoCantidad: form.servicioComida ? Number(form.desayunoCantidad) || 1 : null,
      almuerzoSolicitado: form.servicioComida ? form.almuerzoSolicitado : '',
      almuerzoCantidad: form.servicioComida ? Number(form.almuerzoCantidad) || 1 : null,
    });
    setForm(initialState);
  };

  return (
    <form className="pasajero-form" onSubmit={handleSubmit}>
      <div className="pasajero-form__grid">
        <Input label="Nombre" value={form.nombre} onChange={setField('nombre')} required />
        <Input label="Apellido" value={form.apellido} onChange={setField('apellido')} required />
        <Input label="Cédula" value={form.cedula} onChange={setField('cedula')} required />
        <Input label="Teléfono" value={form.telefono} onChange={setField('telefono')} required />
        <Input label="Grupo" type="number" min="1" value={form.grupoNumero} onChange={setField('grupoNumero')} required />
        <Input label="Monto reservado ($)" type="number" min="0" step="0.01" value={form.montoReservado} onChange={setField('montoReservado')} required />

        <label className="pasajero-form__field">
          <span className="pasajero-form__field-label">Punto de recogida</span>
          <select className="pasajero-form__select" value={form.puntoRecogida} onChange={setField('puntoRecogida')} required>
            {PUNTOS_RECOGIDA.map((punto) => (
              <option key={punto} value={punto}>{punto}</option>
            ))}
          </select>
        </label>
      </div>

      <label className="pasajero-form__checkbox">
        <input type="checkbox" checked={form.servicioComida} onChange={setField('servicioComida')} />
        Solicitó servicio de comida
      </label>

      {form.servicioComida && (
        <div className="pasajero-form__grid">
          <label className="pasajero-form__field">
            <span className="pasajero-form__field-label">Desayuno</span>
            <select className="pasajero-form__select" value={form.desayunoSolicitado} onChange={setField('desayunoSolicitado')} required>
              {OPCIONES_DESAYUNO.map((opcion) => (
                <option key={opcion} value={opcion}>{opcion}</option>
              ))}
            </select>
          </label>
          <Input
            label="Cantidad de desayuno"
            type="number"
            min="1"
            value={form.desayunoCantidad}
            onChange={setField('desayunoCantidad')}
            required
          />

          <label className="pasajero-form__field">
            <span className="pasajero-form__field-label">Almuerzo</span>
            <select className="pasajero-form__select" value={form.almuerzoSolicitado} onChange={setField('almuerzoSolicitado')} required>
              {OPCIONES_ALMUERZO.map((opcion) => (
                <option key={opcion} value={opcion}>{opcion}</option>
              ))}
            </select>
          </label>
          <Input
            label="Cantidad de almuerzo"
            type="number"
            min="1"
            value={form.almuerzoCantidad}
            onChange={setField('almuerzoCantidad')}
            required
          />
        </div>
      )}

      <Button type="submit" fullWidth loading={submitting}>
        Registrar pasajero
      </Button>
    </form>
  );
}

import { useState } from 'react';
import { Input } from '../../../components/ui/Input.jsx';
import { Button } from '../../../components/ui/Button.jsx';
import './PasajeroForm.css';

const initialState = {
  nombre: '',
  apellido: '',
  cedula: '',
  telefono: '',
  grupoNumero: '',
  montoReservado: '',
  servicioComida: false,
  desayunoSolicitado: '',
  almuerzoSolicitado: '',
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
      servicioComida: form.servicioComida,
      desayunoSolicitado: form.servicioComida ? form.desayunoSolicitado.trim() : '',
      almuerzoSolicitado: form.servicioComida ? form.almuerzoSolicitado.trim() : '',
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
      </div>

      <label className="pasajero-form__checkbox">
        <input type="checkbox" checked={form.servicioComida} onChange={setField('servicioComida')} />
        Solicitó servicio de comida
      </label>

      {form.servicioComida && (
        <div className="pasajero-form__grid">
          <Input label="Desayuno solicitado" value={form.desayunoSolicitado} onChange={setField('desayunoSolicitado')} required />
          <Input label="Almuerzo solicitado" value={form.almuerzoSolicitado} onChange={setField('almuerzoSolicitado')} required />
        </div>
      )}

      <Button type="submit" fullWidth loading={submitting}>
        Registrar pasajero
      </Button>
    </form>
  );
}

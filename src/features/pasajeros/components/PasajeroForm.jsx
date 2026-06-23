import { useState } from 'react';
import { Input } from '../../../components/ui/Input.jsx';
import { Button } from '../../../components/ui/Button.jsx';
import { PUNTOS_RECOGIDA } from '../../../data/puntosRecogida.js';
import { OPCIONES_DESAYUNO, OPCIONES_ALMUERZO, MAX_EMPANADAS } from '../../../data/comidaOpciones.js';
import './PasajeroForm.css';

const desayunoInicial = () => Object.fromEntries(OPCIONES_DESAYUNO.map((opcion) => [opcion, '0']));

const initialState = {
  nombre: '',
  apellido: '',
  cedula: '',
  telefono: '',
  grupoNumero: '',
  montoReservado: '',
  puntoRecogida: PUNTOS_RECOGIDA[0],
  servicioComida: false,
  desayunoItems: desayunoInicial(),
  almuerzoSolicitado: OPCIONES_ALMUERZO[0],
};

export function PasajeroForm({ onSubmit, submitting }) {
  const [form, setForm] = useState(initialState);
  const [error, setError] = useState('');

  const setField = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const setDesayunoCantidad = (relleno) => (e) => {
    const value = e.target.value;
    setForm((prev) => ({
      ...prev,
      desayunoItems: { ...prev.desayunoItems, [relleno]: value },
    }));
  };

  const totalEmpanadas = Object.values(form.desayunoItems)
    .reduce((sum, cant) => sum + (Number(cant) || 0), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const base = {
      nombre: form.nombre.trim(),
      apellido: form.apellido.trim(),
      cedula: form.cedula.trim(),
      telefono: form.telefono.trim(),
      grupoNumero: Number(form.grupoNumero),
      montoReservado: Number(form.montoReservado) || 0,
      puntoRecogida: form.puntoRecogida,
    };

    if (form.servicioComida) {
      const items = {};
      let total = 0;
      for (const [relleno, cant] of Object.entries(form.desayunoItems)) {
        const n = Number(cant) || 0;
        if (n > 0) {
          items[relleno] = n;
          total += n;
        }
      }
      if (total < 1) {
        setError('Selecciona al menos una empanada de desayuno.');
        return;
      }
      if (total > MAX_EMPANADAS) {
        setError(`Máximo ${MAX_EMPANADAS} empanadas de desayuno por pasajero.`);
        return;
      }
      setError('');
      await onSubmit({
        ...base,
        servicioComida: true,
        desayunoItems: items,
        almuerzoSolicitado: form.almuerzoSolicitado,
      });
    } else {
      setError('');
      await onSubmit({
        ...base,
        servicioComida: false,
        desayunoItems: {},
        almuerzoSolicitado: '',
      });
    }

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
        <div className="pasajero-form__comida">
          <div className="pasajero-form__empanadas">
            <div className="pasajero-form__empanadas-header">
              <span className="pasajero-form__field-label">
                Desayuno — empanadas (máx. {MAX_EMPANADAS} en total)
              </span>
              <span className={`pasajero-form__contador${totalEmpanadas > MAX_EMPANADAS ? ' pasajero-form__contador--exceso' : ''}`}>
                {totalEmpanadas}/{MAX_EMPANADAS}
              </span>
            </div>
            <div className="pasajero-form__empanadas-grid">
              {OPCIONES_DESAYUNO.map((relleno) => (
                <label key={relleno} className="pasajero-form__empanada">
                  <span className="pasajero-form__empanada-nombre">{relleno}</span>
                  <input
                    type="number"
                    min="0"
                    max={MAX_EMPANADAS}
                    className="pasajero-form__empanada-input"
                    value={form.desayunoItems[relleno]}
                    onChange={setDesayunoCantidad(relleno)}
                  />
                </label>
              ))}
            </div>
          </div>

          <label className="pasajero-form__field">
            <span className="pasajero-form__field-label">Almuerzo</span>
            <select className="pasajero-form__select" value={form.almuerzoSolicitado} onChange={setField('almuerzoSolicitado')} required>
              {OPCIONES_ALMUERZO.map((opcion) => (
                <option key={opcion} value={opcion}>{opcion}</option>
              ))}
            </select>
          </label>
        </div>
      )}

      {error && <p className="pasajero-form__error">{error}</p>}

      <Button type="submit" fullWidth loading={submitting}>
        Registrar pasajero
      </Button>
    </form>
  );
}

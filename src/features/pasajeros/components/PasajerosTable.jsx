import { useMemo, useState } from 'react';
import { Banknote, Pencil, Trash2 } from 'lucide-react';
import { Badge } from '../../../components/ui/Badge.jsx';
import { Button } from '../../../components/ui/Button.jsx';
import { Input } from '../../../components/ui/Input.jsx';
import { Modal } from '../../../components/ui/Modal.jsx';
import { formatCurrency } from '../../../utils/formatters.js';
import { formatDesayunoItems, OPCIONES_ALMUERZO } from '../../../data/comidaOpciones.js';
import { PUNTOS_RECOGIDA } from '../../../data/puntosRecogida.js';
import './PasajerosTable.css';

function groupByUnidad(pasajeros) {
  const groups = new Map();
  for (const p of pasajeros) {
    if (!groups.has(p.unidad_numero)) groups.set(p.unidad_numero, []);
    groups.get(p.unidad_numero).push(p);
  }
  return [...groups.entries()].sort((a, b) => a[0] - b[0]);
}

export function PasajerosTable({ pasajeros, capacidadUnidad, onDeletePasajero, onUpdatePasajero, onRegistrarPago }) {
  const [pasajeroAEliminar, setPasajeroAEliminar] = useState(null);
  const [pasajeroAEditar, setPasajeroAEditar] = useState(null);
  const [pasajeroAPagar, setPasajeroAPagar] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [pagoForm, setPagoForm] = useState({ monto: '', metodo: 'efectivo', nota: '' });
  const [procesando, setProcesando] = useState(false);

  const unidades = useMemo(() => groupByUnidad(pasajeros), [pasajeros]);

  if (!pasajeros.length) {
    return <p className="pasajeros-table__empty">Aún no hay pasajeros registrados.</p>;
  }

  const totalReservado = pasajeros.reduce((sum, p) => sum + Number(p.monto_reservado), 0);
  const totalPendiente = pasajeros.reduce((sum, p) => sum + Number(p.monto_pendiente), 0);

  const abrirEdicion = (p) => {
    setPasajeroAEditar(p);
    setEditForm({
      nombre: p.nombre,
      apellido: p.apellido,
      cedula: p.cedula,
      telefono: p.telefono,
      grupoNumero: String(p.grupo_numero),
      puntoRecogida: p.punto_recogida || PUNTOS_RECOGIDA[0],
      servicioComida: Boolean(p.servicio_comida),
      desayunoItems: p.desayuno_items || {},
      almuerzoSolicitado: p.almuerzo_solicitado || OPCIONES_ALMUERZO[0],
    });
  };

  const guardarEdicion = async (e) => {
    e.preventDefault();
    setProcesando(true);
    try {
      await onUpdatePasajero(pasajeroAEditar.id, editForm);
      setPasajeroAEditar(null);
    } finally {
      setProcesando(false);
    }
  };

  const guardarPago = async (e) => {
    e.preventDefault();
    setProcesando(true);
    try {
      await onRegistrarPago(pasajeroAPagar.id, pagoForm);
      setPasajeroAPagar(null);
      setPagoForm({ monto: '', metodo: 'efectivo', nota: '' });
    } finally {
      setProcesando(false);
    }
  };

  const handleConfirmarEliminar = async () => {
    setProcesando(true);
    try {
      await onDeletePasajero(pasajeroAEliminar.id);
      setPasajeroAEliminar(null);
    } finally {
      setProcesando(false);
    }
  };

  return (
    <div className="pasajeros-table">
      {unidades.map(([unidadNumero, lista]) => {
        const reservado = lista.reduce((sum, p) => sum + Number(p.monto_reservado), 0);
        const pendiente = lista.reduce((sum, p) => sum + Number(p.monto_pendiente), 0);
        const completa = lista.length >= capacidadUnidad;

        return (
          <div key={unidadNumero} className="pasajeros-table__unidad">
            <div className="pasajeros-table__unidad-header">
              <h3>Unidad {unidadNumero}</h3>
              <Badge variant={completa ? 'success' : 'warning'}>{lista.length}/{capacidadUnidad}</Badge>
            </div>

            <div className="pasajeros-table__desktop">
              <div className="pasajeros-table__scroll">
                <table>
                  <thead><tr><th>Grupo</th><th>Pasajero</th><th>Cédula</th><th>Teléfono</th><th>Recogida</th><th>Reservado</th><th>Pendiente</th><th>Comida</th><th>Desayuno</th><th>Almuerzo</th><th>Acciones</th></tr></thead>
                  <tbody>
                    {lista.map((p) => (
                      <tr key={p.id}>
                        <td>{p.grupo_numero}</td><td>{p.nombre} {p.apellido}</td><td>{p.cedula}</td><td>{p.telefono}</td><td>{p.punto_recogida || '—'}</td>
                        <td>{formatCurrency(p.monto_reservado)}</td><td>{formatCurrency(p.monto_pendiente)}</td><td>{p.servicio_comida ? 'Sí' : 'No'}</td>
                        <td>{p.servicio_comida ? formatDesayunoItems(p.desayuno_items) : '—'}</td><td>{p.servicio_comida ? (p.almuerzo_solicitado || '—') : '—'}</td>
                        <td><div className="pasajeros-table__actions"><button aria-label="Editar" onClick={() => abrirEdicion(p)}><Pencil size={16} /></button><button aria-label="Registrar pago" onClick={() => setPasajeroAPagar(p)}><Banknote size={16} /></button><button aria-label="Eliminar" onClick={() => setPasajeroAEliminar(p)}><Trash2 size={16} /></button></div></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="pasajeros-table__mobile">
              {lista.map((p) => (
                <article key={p.id} className="pasajeros-table__card">
                  <div className="pasajeros-table__card-head"><strong>{p.nombre} {p.apellido}</strong><Badge variant={Number(p.monto_pendiente) <= 0 ? 'success' : 'warning'}>{Number(p.monto_pendiente) <= 0 ? 'Pagado' : 'Pendiente'}</Badge></div>
                  <p>Grupo {p.grupo_numero} · {p.punto_recogida || 'Sin recogida'}</p>
                  <p>{formatCurrency(p.monto_reservado)} abonado · {formatCurrency(p.monto_pendiente)} pendiente</p>
                  <p>{p.telefono} · C.I. {p.cedula}</p>
                  {p.servicio_comida && <p>Comida: {formatDesayunoItems(p.desayuno_items)} · {p.almuerzo_solicitado || 'Sin almuerzo'}</p>}
                  <div className="pasajeros-table__card-actions"><Button variant="secondary" onClick={() => abrirEdicion(p)}>Editar</Button><Button onClick={() => setPasajeroAPagar(p)}>Abono</Button><Button variant="danger" onClick={() => setPasajeroAEliminar(p)}>Eliminar</Button></div>
                </article>
              ))}
            </div>

            <p className="pasajeros-table__subtotal">Subtotal — Reservado: {formatCurrency(reservado)} · Pendiente: {formatCurrency(pendiente)}</p>
          </div>
        );
      })}

      <p className="pasajeros-table__total">Total — Reservado: {formatCurrency(totalReservado)} · Por cancelar: {formatCurrency(totalPendiente)}</p>

      <Modal isOpen={!!pasajeroAEditar} onClose={() => setPasajeroAEditar(null)} title="Editar pasajero">
        {editForm && <form onSubmit={guardarEdicion} className="pasajeros-table__form">
          <Input label="Nombre" value={editForm.nombre} onChange={(e) => setEditForm({ ...editForm, nombre: e.target.value })} required />
          <Input label="Apellido" value={editForm.apellido} onChange={(e) => setEditForm({ ...editForm, apellido: e.target.value })} required />
          <Input label="Cédula" value={editForm.cedula} onChange={(e) => setEditForm({ ...editForm, cedula: e.target.value })} required />
          <Input label="Teléfono" value={editForm.telefono} onChange={(e) => setEditForm({ ...editForm, telefono: e.target.value })} required />
          <Input label="Grupo" type="number" min="1" value={editForm.grupoNumero} onChange={(e) => setEditForm({ ...editForm, grupoNumero: e.target.value })} required />
          <label>Punto de recogida<select value={editForm.puntoRecogida} onChange={(e) => setEditForm({ ...editForm, puntoRecogida: e.target.value })}>{PUNTOS_RECOGIDA.map((p) => <option key={p}>{p}</option>)}</select></label>
          <label><input type="checkbox" checked={editForm.servicioComida} onChange={(e) => setEditForm({ ...editForm, servicioComida: e.target.checked })} /> Servicio de comida</label>
          {editForm.servicioComida && <label>Almuerzo<select value={editForm.almuerzoSolicitado} onChange={(e) => setEditForm({ ...editForm, almuerzoSolicitado: e.target.value })}>{OPCIONES_ALMUERZO.map((o) => <option key={o}>{o}</option>)}</select></label>}
          <Button type="submit" fullWidth loading={procesando}>Guardar cambios</Button>
        </form>}
      </Modal>

      <Modal isOpen={!!pasajeroAPagar} onClose={() => setPasajeroAPagar(null)} title="Registrar abono">
        {pasajeroAPagar && <form onSubmit={guardarPago} className="pasajeros-table__form">
          <p><strong>{pasajeroAPagar.nombre} {pasajeroAPagar.apellido}</strong> · Pendiente {formatCurrency(pasajeroAPagar.monto_pendiente)}</p>
          <Input label="Monto ($)" type="number" min="0.01" step="0.01" value={pagoForm.monto} onChange={(e) => setPagoForm({ ...pagoForm, monto: e.target.value })} required />
          <label>Método<select value={pagoForm.metodo} onChange={(e) => setPagoForm({ ...pagoForm, metodo: e.target.value })}><option value="efectivo">Efectivo</option><option value="pago_movil">Pago móvil</option><option value="transferencia">Transferencia</option><option value="otro">Otro</option></select></label>
          <Input label="Nota" value={pagoForm.nota} onChange={(e) => setPagoForm({ ...pagoForm, nota: e.target.value })} />
          <Button type="submit" fullWidth loading={procesando}>Registrar pago</Button>
        </form>}
      </Modal>

      <Modal isOpen={!!pasajeroAEliminar} onClose={() => setPasajeroAEliminar(null)} title="Eliminar pasajero">
        {pasajeroAEliminar && <><p>¿Seguro que quieres eliminar a <strong>{pasajeroAEliminar.nombre} {pasajeroAEliminar.apellido}</strong>? Las unidades se reorganizarán automáticamente.</p><div className="pasajeros-table__delete-actions"><Button variant="secondary" onClick={() => setPasajeroAEliminar(null)} disabled={procesando}>Cancelar</Button><Button variant="danger" onClick={handleConfirmarEliminar} loading={procesando}>Eliminar</Button></div></>}
      </Modal>
    </div>
  );
}

import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Badge } from '../../../components/ui/Badge.jsx';
import { Button } from '../../../components/ui/Button.jsx';
import { Modal } from '../../../components/ui/Modal.jsx';
import { formatCurrency } from '../../../utils/formatters.js';
import './PasajerosTable.css';

function groupByUnidad(pasajeros) {
  const groups = new Map();
  for (const p of pasajeros) {
    if (!groups.has(p.unidad_numero)) groups.set(p.unidad_numero, []);
    groups.get(p.unidad_numero).push(p);
  }
  return [...groups.entries()].sort((a, b) => a[0] - b[0]);
}

function formatComida(nombre, cantidad) {
  if (!nombre) return '—';
  return `${nombre} x${cantidad ?? 1}`;
}

export function PasajerosTable({ pasajeros, capacidadUnidad, onDeletePasajero }) {
  const [pasajeroAEliminar, setPasajeroAEliminar] = useState(null);
  const [eliminando, setEliminando] = useState(false);

  if (!pasajeros.length) {
    return <p className="pasajeros-table__empty">Aún no hay pasajeros registrados.</p>;
  }

  const unidades = groupByUnidad(pasajeros);
  const totalReservado = pasajeros.reduce((sum, p) => sum + Number(p.monto_reservado), 0);
  const totalPendiente = pasajeros.reduce((sum, p) => sum + Number(p.monto_pendiente), 0);

  const handleConfirmarEliminar = async () => {
    setEliminando(true);
    try {
      await onDeletePasajero(pasajeroAEliminar.id);
      setPasajeroAEliminar(null);
    } finally {
      setEliminando(false);
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
              <Badge variant={completa ? 'success' : 'warning'}>
                {lista.length}/{capacidadUnidad}
              </Badge>
            </div>

            <div className="pasajeros-table__scroll">
              <table>
                <thead>
                  <tr>
                    <th>Grupo</th>
                    <th>Nombre</th>
                    <th>Apellido</th>
                    <th>Cédula</th>
                    <th>Teléfono</th>
                    <th>Punto de recogida</th>
                    <th>Reservado</th>
                    <th>Pendiente</th>
                    <th>Comida</th>
                    <th>Desayuno</th>
                    <th>Almuerzo</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {lista.map((p) => (
                    <tr key={p.id}>
                      <td>{p.grupo_numero}</td>
                      <td>{p.nombre}</td>
                      <td>{p.apellido}</td>
                      <td>{p.cedula}</td>
                      <td>{p.telefono}</td>
                      <td>{p.punto_recogida || '—'}</td>
                      <td>{formatCurrency(p.monto_reservado)}</td>
                      <td>{formatCurrency(p.monto_pendiente)}</td>
                      <td>{p.servicio_comida ? 'Sí' : 'No'}</td>
                      <td>{p.servicio_comida ? formatComida(p.desayuno_solicitado, p.desayuno_cantidad) : '—'}</td>
                      <td>{p.servicio_comida ? formatComida(p.almuerzo_solicitado, p.almuerzo_cantidad) : '—'}</td>
                      <td>
                        <button
                          className="pasajeros-table__delete-btn"
                          aria-label="Eliminar pasajero"
                          onClick={() => setPasajeroAEliminar(p)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="pasajeros-table__subtotal">
              Subtotal — Reservado: {formatCurrency(reservado)} · Pendiente: {formatCurrency(pendiente)}
            </p>
          </div>
        );
      })}

      <p className="pasajeros-table__total">
        Total de todos los clientes — Reservado: {formatCurrency(totalReservado)} · Por cancelar: {formatCurrency(totalPendiente)}
      </p>

      <Modal
        isOpen={!!pasajeroAEliminar}
        onClose={() => setPasajeroAEliminar(null)}
        title="Eliminar pasajero"
      >
        {pasajeroAEliminar && (
          <>
            <p>
              ¿Seguro que quieres eliminar a{' '}
              <strong>{pasajeroAEliminar.nombre} {pasajeroAEliminar.apellido}</strong>? Esta acción
              no se puede deshacer.
            </p>
            <div className="pasajeros-table__delete-actions">
              <Button variant="secondary" onClick={() => setPasajeroAEliminar(null)} disabled={eliminando}>
                Cancelar
              </Button>
              <Button variant="danger" onClick={handleConfirmarEliminar} loading={eliminando}>
                Eliminar
              </Button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}

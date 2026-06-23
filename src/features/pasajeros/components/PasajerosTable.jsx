import { Badge } from '../../../components/ui/Badge.jsx';
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

export function PasajerosTable({ pasajeros, capacidadUnidad }) {
  if (!pasajeros.length) {
    return <p className="pasajeros-table__empty">Aún no hay pasajeros registrados.</p>;
  }

  const unidades = groupByUnidad(pasajeros);
  const totalReservado = pasajeros.reduce((sum, p) => sum + Number(p.monto_reservado), 0);
  const totalPendiente = pasajeros.reduce((sum, p) => sum + Number(p.monto_pendiente), 0);

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
                      <td>{p.servicio_comida ? p.desayuno_solicitado : '—'}</td>
                      <td>{p.servicio_comida ? p.almuerzo_solicitado : '—'}</td>
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
    </div>
  );
}

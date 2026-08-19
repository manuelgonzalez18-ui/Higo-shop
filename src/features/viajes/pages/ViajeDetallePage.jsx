import { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, FileDown, RefreshCw, Save, Sheet, Trash2 } from 'lucide-react';
import { Card } from '../../../components/ui/Card.jsx';
import { Button } from '../../../components/ui/Button.jsx';
import { Spinner } from '../../../components/ui/Spinner.jsx';
import { Modal } from '../../../components/ui/Modal.jsx';
import { PasajeroForm } from '../../pasajeros/components/PasajeroForm.jsx';
import { PasajerosTable } from '../../pasajeros/components/PasajerosTable.jsx';
import { obtenerViaje, eliminarViaje, actualizarGastosViaje } from '../../../services/viajeService.js';
import { listarPasajerosPorViaje, registrarPasajero, eliminarPasajero, actualizarPasajero, registrarPago } from '../../../services/pasajeroService.js';
import { generarPdfViaje } from '../../../services/pdfService.js';
import { exportarCsvPasajeros, exportarRespaldoViaje } from '../../../services/exportService.js';
import { formatCurrency, formatDate } from '../../../utils/formatters.js';
import './ViajeDetallePage.css';

const GASTOS_INICIALES = {
  gasto_logistica: 0,
  gasto_transporte_maritimo: 0,
  gasto_transporte_terrestre: 0,
  gasto_empleados: 0,
  gasto_comidas: 0,
  gasto_hidratacion: 0,
};

const CAMPOS_GASTOS = [
  ['gasto_logistica', 'Logística'],
  ['gasto_transporte_maritimo', 'Transporte Marítimo'],
  ['gasto_transporte_terrestre', 'Transporte Terrestre'],
  ['gasto_empleados', 'Empleados'],
  ['gasto_comidas', 'Comidas'],
  ['gasto_hidratacion', 'Hidratación'],
];

function gastosDesdeViaje(viaje) {
  return Object.fromEntries(
    CAMPOS_GASTOS.map(([campo]) => [campo, Number(viaje?.[campo]) || 0]),
  );
}

function mensajeError(err) {
  if (err instanceof TypeError || /failed to fetch|network/i.test(err?.message || '')) return 'No pudimos conectar con el servidor. Revisa tu conexión e intenta nuevamente.';
  if (/jwt|auth|permission|row-level|401|403/i.test(err?.message || '')) return 'Tu sesión no tiene permisos o expiró. Vuelve a iniciar sesión.';
  return err?.message || 'Ocurrió un error inesperado.';
}

export function ViajeDetallePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [viaje, setViaje] = useState(null);
  const [pasajeros, setPasajeros] = useState([]);
  const [gastos, setGastos] = useState(GASTOS_INICIALES);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [guardandoGastos, setGuardandoGastos] = useState(false);
  const [gastosGuardados, setGastosGuardados] = useState(false);
  const [error, setError] = useState(null);
  const [confirmandoEliminar, setConfirmandoEliminar] = useState(false);
  const [eliminando, setEliminando] = useState(false);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [viajeData, pasajerosData] = await Promise.all([obtenerViaje(id), listarPasajerosPorViaje(id)]);
      setViaje(viajeData);
      setGastos(gastosDesdeViaje(viajeData));
      setPasajeros(pasajerosData);
    } catch (err) {
      setError(mensajeError(err));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { cargar(); }, [cargar]);

  const ejecutarYRecargar = async (operacion) => {
    setError(null);
    try {
      await operacion();
      await cargar();
    } catch (err) {
      setError(mensajeError(err));
      throw err;
    }
  };

  const handleRegistrar = async (datos) => {
    setSubmitting(true);
    try { await ejecutarYRecargar(() => registrarPasajero(id, datos)); }
    finally { setSubmitting(false); }
  };

  const handleEliminarPasajero = (pasajeroId) => ejecutarYRecargar(() => eliminarPasajero(pasajeroId));
  const handleActualizarPasajero = (pasajeroId, datos) => ejecutarYRecargar(() => actualizarPasajero(pasajeroId, datos));
  const handleRegistrarPago = (pasajeroId, datos) => ejecutarYRecargar(() => registrarPago(pasajeroId, datos));

  const handleGastoChange = (campo, valor) => {
    setGastosGuardados(false);
    setGastos((actuales) => ({ ...actuales, [campo]: valor }));
  };

  const handleGuardarGastos = async () => {
    setGuardandoGastos(true);
    setGastosGuardados(false);
    setError(null);
    try {
      const viajeActualizado = await actualizarGastosViaje(id, gastos);
      setViaje(viajeActualizado);
      setGastos(gastosDesdeViaje(viajeActualizado));
      setGastosGuardados(true);
    } catch (err) {
      setError(mensajeError(err));
    } finally {
      setGuardandoGastos(false);
    }
  };

  const handleEliminar = async () => {
    setEliminando(true);
    setError(null);
    try { await eliminarViaje(id); navigate('/'); }
    catch (err) { setError(mensajeError(err)); setEliminando(false); }
  };

  if (loading) return <div className="viaje-detalle__loading"><Spinner /></div>;
  if (!viaje) return <div><p>{error || 'No se encontró el viaje.'}</p><Button icon={<RefreshCw size={16} />} onClick={cargar}>Reintentar</Button></div>;

  const totalReservado = pasajeros.reduce((sum, p) => sum + Number(p.monto_reservado), 0);
  const totalPendiente = pasajeros.reduce((sum, p) => sum + Number(p.monto_pendiente), 0);
  const ingresosProyectados = pasajeros.reduce(
    (sum, p) => sum + Number(p.servicio_comida ? viaje.precio_pasajero_comida : viaje.precio_pasajero),
    0,
  );
  const totalGastos = CAMPOS_GASTOS.reduce((sum, [campo]) => sum + (Number(gastos[campo]) || 0), 0);
  const gananciaActual = totalReservado - totalGastos;
  const gananciaProyectada = ingresosProyectados - totalGastos;
  const viajeParaPdf = { ...viaje, ...gastos };

  return (
    <div className="viaje-detalle">
      <Link to="/" className="viaje-detalle__back"><ArrowLeft size={16} /> Viajes</Link>

      <Card className="viaje-detalle__header">
        <h1>{viaje.destino_nombre}</h1>
        <p>{formatDate(viaje.fecha)} · Capacidad por unidad: {viaje.capacidad_unidad} · Solo traslado: {formatCurrency(viaje.precio_pasajero)} · Con comida: {formatCurrency(viaje.precio_pasajero_comida)}</p>
        <p>{pasajeros.length} pasajeros · Cobrado: {formatCurrency(totalReservado)} · Pendiente: {formatCurrency(totalPendiente)}</p>
        <div className="viaje-detalle__header-actions">
          <Button icon={<FileDown size={16} />} onClick={() => generarPdfViaje(viajeParaPdf, pasajeros)} disabled={!pasajeros.length}>PDF</Button>
          <Button variant="secondary" icon={<Sheet size={16} />} onClick={() => exportarCsvPasajeros(viaje, pasajeros)} disabled={!pasajeros.length}>CSV</Button>
          <Button variant="secondary" icon={<Save size={16} />} onClick={() => exportarRespaldoViaje(viaje, pasajeros)}>Respaldo</Button>
          <Button variant="secondary" icon={<RefreshCw size={16} />} onClick={cargar}>Actualizar</Button>
          <Button variant="danger" icon={<Trash2 size={16} />} onClick={() => setConfirmandoEliminar(true)}>Eliminar viaje</Button>
        </div>
      </Card>

      {error && <div className="viaje-detalle__error"><span>{error}</span> <button onClick={cargar}>Reintentar</button></div>}

      <Modal isOpen={confirmandoEliminar} onClose={() => setConfirmandoEliminar(false)} title="Eliminar viaje">
        <p>¿Seguro que quieres eliminar este viaje a <strong>{viaje.destino_nombre}</strong>? Se eliminarán también los {pasajeros.length} pasajeros registrados. Esta acción no se puede deshacer.</p>
        <div className="viaje-detalle__delete-actions"><Button variant="secondary" onClick={() => setConfirmandoEliminar(false)} disabled={eliminando}>Cancelar</Button><Button variant="danger" onClick={handleEliminar} loading={eliminando}>Eliminar</Button></div>
      </Modal>

      <Card>
        <div className="viaje-detalle__finance-heading">
          <div>
            <h2 className="viaje-detalle__section-title">Gastos y ganancias</h2>
            <p>Registra los gastos del viaje. Las ganancias se calculan automáticamente con los ingresos de los pasajeros.</p>
          </div>
          <Button icon={<Save size={16} />} onClick={handleGuardarGastos} loading={guardandoGastos}>Guardar gastos</Button>
        </div>

        <div className="viaje-detalle__expenses-grid">
          {CAMPOS_GASTOS.map(([campo, etiqueta]) => (
            <label key={campo} className="viaje-detalle__expense-field">
              <span>{etiqueta}</span>
              <input
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                value={gastos[campo]}
                onChange={(event) => handleGastoChange(campo, event.target.value)}
              />
            </label>
          ))}
        </div>

        {gastosGuardados && <p className="viaje-detalle__saved">Gastos guardados correctamente.</p>}

        <div className="viaje-detalle__finance-summary">
          <div><span>Ingresos cobrados</span><strong>{formatCurrency(totalReservado)}</strong></div>
          <div><span>Ingresos pendientes</span><strong>{formatCurrency(totalPendiente)}</strong></div>
          <div><span>Ingresos proyectados</span><strong>{formatCurrency(ingresosProyectados)}</strong></div>
          <div><span>Total de gastos</span><strong>{formatCurrency(totalGastos)}</strong></div>
          <div><span>Ganancia actual</span><strong>{formatCurrency(gananciaActual)}</strong></div>
          <div><span>Ganancia proyectada</span><strong>{formatCurrency(gananciaProyectada)}</strong></div>
        </div>
      </Card>

      <Card><h2 className="viaje-detalle__section-title">Registrar pasajero</h2><PasajeroForm onSubmit={handleRegistrar} submitting={submitting} /></Card>
      <Card><h2 className="viaje-detalle__section-title">Pasajeros por unidad</h2><PasajerosTable pasajeros={pasajeros} capacidadUnidad={viaje.capacidad_unidad} onDeletePasajero={handleEliminarPasajero} onUpdatePasajero={handleActualizarPasajero} onRegistrarPago={handleRegistrarPago} /></Card>
    </div>
  );
}

import { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, FileDown, RefreshCw, Trash2 } from 'lucide-react';
import { Card } from '../../../components/ui/Card.jsx';
import { Button } from '../../../components/ui/Button.jsx';
import { Spinner } from '../../../components/ui/Spinner.jsx';
import { Modal } from '../../../components/ui/Modal.jsx';
import { PasajeroForm } from '../../pasajeros/components/PasajeroForm.jsx';
import { PasajerosTable } from '../../pasajeros/components/PasajerosTable.jsx';
import { obtenerViaje, eliminarViaje } from '../../../services/viajeService.js';
import { listarPasajerosPorViaje, registrarPasajero, eliminarPasajero, actualizarPasajero, registrarPago } from '../../../services/pasajeroService.js';
import { generarPdfViaje } from '../../../services/pdfService.js';
import { formatCurrency, formatDate } from '../../../utils/formatters.js';
import './ViajeDetallePage.css';

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
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [confirmandoEliminar, setConfirmandoEliminar] = useState(false);
  const [eliminando, setEliminando] = useState(false);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [viajeData, pasajerosData] = await Promise.all([obtenerViaje(id), listarPasajerosPorViaje(id)]);
      setViaje(viajeData);
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

  return (
    <div className="viaje-detalle">
      <Link to="/" className="viaje-detalle__back"><ArrowLeft size={16} /> Viajes</Link>

      <Card className="viaje-detalle__header">
        <h1>{viaje.destino_nombre}</h1>
        <p>{formatDate(viaje.fecha)} · Capacidad por unidad: {viaje.capacidad_unidad} · Solo traslado: {formatCurrency(viaje.precio_pasajero)} · Con comida: {formatCurrency(viaje.precio_pasajero_comida)}</p>
        <p>{pasajeros.length} pasajeros · Reservado: {formatCurrency(totalReservado)} · Pendiente: {formatCurrency(totalPendiente)}</p>
        <div className="viaje-detalle__header-actions">
          <Button icon={<FileDown size={16} />} onClick={() => generarPdfViaje(viaje, pasajeros)} disabled={!pasajeros.length}>Generar PDF</Button>
          <Button variant="secondary" icon={<RefreshCw size={16} />} onClick={cargar}>Actualizar</Button>
          <Button variant="danger" icon={<Trash2 size={16} />} onClick={() => setConfirmandoEliminar(true)}>Eliminar viaje</Button>
        </div>
      </Card>

      {error && <div className="viaje-detalle__error"><span>{error}</span> <button onClick={cargar}>Reintentar</button></div>}

      <Modal isOpen={confirmandoEliminar} onClose={() => setConfirmandoEliminar(false)} title="Eliminar viaje">
        <p>¿Seguro que quieres eliminar este viaje a <strong>{viaje.destino_nombre}</strong>? Se eliminarán también los {pasajeros.length} pasajeros registrados. Esta acción no se puede deshacer.</p>
        <div className="viaje-detalle__delete-actions"><Button variant="secondary" onClick={() => setConfirmandoEliminar(false)} disabled={eliminando}>Cancelar</Button><Button variant="danger" onClick={handleEliminar} loading={eliminando}>Eliminar</Button></div>
      </Modal>

      <Card><h2 className="viaje-detalle__section-title">Registrar pasajero</h2><PasajeroForm onSubmit={handleRegistrar} submitting={submitting} /></Card>

      <Card><h2 className="viaje-detalle__section-title">Pasajeros por unidad</h2><PasajerosTable pasajeros={pasajeros} capacidadUnidad={viaje.capacidad_unidad} onDeletePasajero={handleEliminarPasajero} onUpdatePasajero={handleActualizarPasajero} onRegistrarPago={handleRegistrarPago} /></Card>
    </div>
  );
}

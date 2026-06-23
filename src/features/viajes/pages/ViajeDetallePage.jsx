import { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, FileDown, Trash2 } from 'lucide-react';
import { Card } from '../../../components/ui/Card.jsx';
import { Button } from '../../../components/ui/Button.jsx';
import { Spinner } from '../../../components/ui/Spinner.jsx';
import { Modal } from '../../../components/ui/Modal.jsx';
import { PasajeroForm } from '../../pasajeros/components/PasajeroForm.jsx';
import { PasajerosTable } from '../../pasajeros/components/PasajerosTable.jsx';
import { obtenerViaje, eliminarViaje } from '../../../services/viajeService.js';
import { listarPasajerosPorViaje, registrarPasajero, eliminarPasajero } from '../../../services/pasajeroService.js';
import { generarPdfViaje } from '../../../services/pdfService.js';
import { formatCurrency, formatDate } from '../../../utils/formatters.js';
import './ViajeDetallePage.css';

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
    try {
      const [viajeData, pasajerosData] = await Promise.all([
        obtenerViaje(id),
        listarPasajerosPorViaje(id),
      ]);
      setViaje(viajeData);
      setPasajeros(pasajerosData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const handleRegistrar = async (datos) => {
    setSubmitting(true);
    setError(null);
    try {
      await registrarPasajero(id, datos);
      await cargar();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleGenerarPdf = () => {
    generarPdfViaje(viaje, pasajeros);
  };

  const handleEliminarPasajero = async (pasajeroId) => {
    setError(null);
    try {
      await eliminarPasajero(pasajeroId);
      await cargar();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEliminar = async () => {
    setEliminando(true);
    setError(null);
    try {
      await eliminarViaje(id);
      navigate('/');
    } catch (err) {
      setError(err.message);
      setEliminando(false);
    }
  };

  if (loading) {
    return (
      <div className="viaje-detalle__loading">
        <Spinner />
      </div>
    );
  }

  if (!viaje) {
    return <p>No se encontró el viaje.</p>;
  }

  const totalReservado = pasajeros.reduce((sum, p) => sum + Number(p.monto_reservado), 0);
  const totalPendiente = pasajeros.reduce((sum, p) => sum + Number(p.monto_pendiente), 0);

  return (
    <div className="viaje-detalle">
      <Link to="/" className="viaje-detalle__back">
        <ArrowLeft size={16} /> Viajes
      </Link>

      <Card className="viaje-detalle__header">
        <h1>{viaje.destino_nombre}</h1>
        <p>
          {formatDate(viaje.fecha)} · Capacidad por unidad: {viaje.capacidad_unidad} ·{' '}
          Solo traslado: {formatCurrency(viaje.precio_pasajero)} ·{' '}
          Con comida: {formatCurrency(viaje.precio_pasajero_comida)}
        </p>
        <p>
          {pasajeros.length} pasajeros · Reservado: {formatCurrency(totalReservado)} · Pendiente: {formatCurrency(totalPendiente)}
        </p>
        <div className="viaje-detalle__header-actions">
          <Button icon={<FileDown size={16} />} onClick={handleGenerarPdf} disabled={!pasajeros.length}>
            Generar PDF
          </Button>
          <Button variant="danger" icon={<Trash2 size={16} />} onClick={() => setConfirmandoEliminar(true)}>
            Eliminar viaje
          </Button>
        </div>
      </Card>

      {error && <p className="viaje-detalle__error">{error}</p>}

      <Modal
        isOpen={confirmandoEliminar}
        onClose={() => setConfirmandoEliminar(false)}
        title="Eliminar viaje"
      >
        <p>
          ¿Seguro que quieres eliminar este viaje a <strong>{viaje.destino_nombre}</strong>?
          Se eliminarán también los {pasajeros.length} pasajeros registrados. Esta acción no se
          puede deshacer.
        </p>
        <div className="viaje-detalle__delete-actions">
          <Button variant="secondary" onClick={() => setConfirmandoEliminar(false)} disabled={eliminando}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={handleEliminar} loading={eliminando}>
            Eliminar
          </Button>
        </div>
      </Modal>

      <Card>
        <h2 className="viaje-detalle__section-title">Registrar pasajero</h2>
        <PasajeroForm onSubmit={handleRegistrar} submitting={submitting} />
      </Card>

      <Card>
        <h2 className="viaje-detalle__section-title">Pasajeros por unidad</h2>
        <PasajerosTable
          pasajeros={pasajeros}
          capacidadUnidad={viaje.capacidad_unidad}
          onDeletePasajero={handleEliminarPasajero}
        />
      </Card>
    </div>
  );
}

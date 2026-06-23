import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2 } from 'lucide-react';
import { Card } from '../../../components/ui/Card.jsx';
import { Button } from '../../../components/ui/Button.jsx';
import { Spinner } from '../../../components/ui/Spinner.jsx';
import { Modal } from '../../../components/ui/Modal.jsx';
import { NuevoViajeModal } from '../components/NuevoViajeModal.jsx';
import { crearViaje, eliminarViaje, listarViajes } from '../../../services/viajeService.js';
import { formatCurrency, formatDate } from '../../../utils/formatters.js';
import './ViajesListPage.css';

export function ViajesListPage() {
  const [viajes, setViajes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);
  const [viajeAEliminar, setViajeAEliminar] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const navigate = useNavigate();

  const cargar = async () => {
    setLoading(true);
    try {
      setViajes(await listarViajes());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const handleCreate = async (datos) => {
    setCreating(true);
    setError(null);
    try {
      const viaje = await crearViaje(datos);
      setModalOpen(false);
      navigate(`/viajes/${viaje.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    setError(null);
    try {
      await eliminarViaje(viajeAEliminar.id);
      setViajeAEliminar(null);
      await cargar();
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="viajes-list">
      <div className="viajes-list__header">
        <h1>Viajes</h1>
        <Button icon={<Plus size={16} />} onClick={() => setModalOpen(true)}>Nuevo viaje</Button>
      </div>

      {error && <p className="viajes-list__error">{error}</p>}

      {loading ? (
        <div className="viajes-list__loading"><Spinner /></div>
      ) : viajes.length === 0 ? (
        <p className="viajes-list__empty">No hay viajes creados todavía.</p>
      ) : (
        <div className="viajes-list__grid">
          {viajes.map((v) => (
            <Card key={v.id} hoverable className="viajes-list__card" onClick={() => navigate(`/viajes/${v.id}`)}>
              <button
                className="viajes-list__delete"
                aria-label="Eliminar viaje"
                onClick={(e) => {
                  e.stopPropagation();
                  setViajeAEliminar(v);
                }}
              >
                <Trash2 size={16} />
              </button>
              <h2>{v.destino_nombre}</h2>
              <p>{formatDate(v.fecha)}</p>
              <p>
                {v.total_pasajeros} pasajeros · Traslado: {formatCurrency(v.precio_pasajero)} ·
                Comida: {formatCurrency(v.precio_pasajero_comida)}
              </p>
            </Card>
          ))}
        </div>
      )}

      <NuevoViajeModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreate={handleCreate}
        creating={creating}
      />

      <Modal
        isOpen={!!viajeAEliminar}
        onClose={() => setViajeAEliminar(null)}
        title="Eliminar viaje"
      >
        <p>
          ¿Seguro que quieres eliminar el viaje a <strong>{viajeAEliminar?.destino_nombre}</strong>
          {' '}({viajeAEliminar && formatDate(viajeAEliminar.fecha)})? Se eliminarán también todos
          sus pasajeros registrados. Esta acción no se puede deshacer.
        </p>
        <div className="viajes-list__delete-actions">
          <Button variant="secondary" onClick={() => setViajeAEliminar(null)} disabled={deleting}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={handleDelete} loading={deleting}>
            Eliminar
          </Button>
        </div>
      </Modal>
    </div>
  );
}

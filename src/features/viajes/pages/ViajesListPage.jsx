import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Card } from '../../../components/ui/Card.jsx';
import { Button } from '../../../components/ui/Button.jsx';
import { Spinner } from '../../../components/ui/Spinner.jsx';
import { NuevoViajeModal } from '../components/NuevoViajeModal.jsx';
import { crearViaje, listarViajes } from '../../../services/viajeService.js';
import { formatCurrency, formatDate } from '../../../utils/formatters.js';
import './ViajesListPage.css';

export function ViajesListPage() {
  const [viajes, setViajes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);
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
            <Card key={v.id} hoverable onClick={() => navigate(`/viajes/${v.id}`)}>
              <h2>{v.destino_nombre}</h2>
              <p>{formatDate(v.fecha)}</p>
              <p>{v.total_pasajeros} pasajeros · {formatCurrency(v.precio_pasajero)} / pasajero</p>
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
    </div>
  );
}

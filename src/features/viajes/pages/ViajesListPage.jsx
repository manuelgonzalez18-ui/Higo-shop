import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, RefreshCw, Search, Trash2 } from 'lucide-react';
import { Card } from '../../../components/ui/Card.jsx';
import { Button } from '../../../components/ui/Button.jsx';
import { Input } from '../../../components/ui/Input.jsx';
import { Spinner } from '../../../components/ui/Spinner.jsx';
import { Modal } from '../../../components/ui/Modal.jsx';
import { NuevoViajeModal } from '../components/NuevoViajeModal.jsx';
import { crearViaje, eliminarViaje, listarViajes } from '../../../services/viajeService.js';
import { formatCurrency, formatDate } from '../../../utils/formatters.js';
import './ViajesListPage.css';

function mensajeError(err) {
  if (err instanceof TypeError || /failed to fetch|network/i.test(err?.message || '')) return 'No pudimos conectar con el servidor. Revisa tu conexión e intenta nuevamente.';
  if (/jwt|auth|permission|row-level|401|403/i.test(err?.message || '')) return 'Tu sesión no tiene permisos o expiró. Vuelve a iniciar sesión.';
  return err?.message || 'Ocurrió un error inesperado.';
}

export function ViajesListPage() {
  const [viajes, setViajes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [viajeAEliminar, setViajeAEliminar] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const navigate = useNavigate();

  const cargar = async () => {
    setLoading(true);
    setError(null);
    try { setViajes(await listarViajes()); }
    catch (err) { setError(mensajeError(err)); }
    finally { setLoading(false); }
  };

  useEffect(() => { cargar(); }, []);

  const viajesFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return viajes;
    return viajes.filter((v) => `${v.destino_nombre} ${v.fecha}`.toLowerCase().includes(q));
  }, [viajes, busqueda]);

  const handleCreate = async (datos) => {
    setCreating(true);
    setError(null);
    try {
      const viaje = await crearViaje(datos);
      setModalOpen(false);
      navigate(`/viajes/${viaje.id}`);
    } catch (err) { setError(mensajeError(err)); }
    finally { setCreating(false); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    setError(null);
    try { await eliminarViaje(viajeAEliminar.id); setViajeAEliminar(null); await cargar(); }
    catch (err) { setError(mensajeError(err)); }
    finally { setDeleting(false); }
  };

  return (
    <div className="viajes-list">
      <div className="viajes-list__header">
        <h1>Viajes</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="secondary" icon={<RefreshCw size={16} />} onClick={cargar}>Actualizar</Button>
          <Button icon={<Plus size={16} />} onClick={() => setModalOpen(true)}>Nuevo viaje</Button>
        </div>
      </div>

      <div style={{ maxWidth: 420, marginBottom: 16 }}><Input label="Buscar viaje" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} icon={<Search size={16} />} /></div>

      {error && <div className="viajes-list__error"><span>{error}</span> <button onClick={cargar}>Reintentar</button></div>}

      {loading ? (
        <div className="viajes-list__loading"><Spinner /></div>
      ) : viajesFiltrados.length === 0 ? (
        <p className="viajes-list__empty">{viajes.length ? 'No hay viajes que coincidan con la búsqueda.' : 'No hay viajes creados todavía.'}</p>
      ) : (
        <div className="viajes-list__grid">
          {viajesFiltrados.map((v) => (
            <Card key={v.id} hoverable className="viajes-list__card" onClick={() => navigate(`/viajes/${v.id}`)}>
              <button className="viajes-list__delete" aria-label="Eliminar viaje" onClick={(e) => { e.stopPropagation(); setViajeAEliminar(v); }}><Trash2 size={16} /></button>
              <h2>{v.destino_nombre}</h2>
              <p>{formatDate(v.fecha)}</p>
              <p>{v.total_pasajeros} pasajeros · Traslado: {formatCurrency(v.precio_pasajero)} · Comida: {formatCurrency(v.precio_pasajero_comida)}</p>
            </Card>
          ))}
        </div>
      )}

      <NuevoViajeModal isOpen={modalOpen} onClose={() => setModalOpen(false)} onCreate={handleCreate} creating={creating} />

      <Modal isOpen={!!viajeAEliminar} onClose={() => setViajeAEliminar(null)} title="Eliminar viaje">
        <p>¿Seguro que quieres eliminar el viaje a <strong>{viajeAEliminar?.destino_nombre}</strong> {viajeAEliminar && `(${formatDate(viajeAEliminar.fecha)})`}? Se eliminarán también todos sus pasajeros registrados. Esta acción no se puede deshacer.</p>
        <div className="viajes-list__delete-actions"><Button variant="secondary" onClick={() => setViajeAEliminar(null)} disabled={deleting}>Cancelar</Button><Button variant="danger" onClick={handleDelete} loading={deleting}>Eliminar</Button></div>
      </Modal>
    </div>
  );
}

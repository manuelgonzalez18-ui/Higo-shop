import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Pencil, Trash2, Search, Save, X, Package } from 'lucide-react';
import { Spinner } from '../../../components/ui/Spinner.jsx';
import { formatCurrency } from '../../../services/deliveryPricing.js';
import {
  listProductsForStore,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../../../services/productService.js';
import './MerchantProducts.css';

const EMPTY_FORM = { name: '', description: '', price: '', category: '', available: true };

export function MerchantProducts({ store }) {
  const storeId = store?.id;
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState(null); // null = none | 'new' | productId
  const [form, setForm] = useState(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!storeId) return;
    let mounted = true;
    setIsLoading(true);
    listProductsForStore(storeId)
      .then((rows) => { if (mounted) setProducts(rows); })
      .catch((err) => { if (mounted) setError(err.message || 'Error cargando productos'); })
      .finally(() => { if (mounted) setIsLoading(false); });
    return () => { mounted = false; };
  }, [storeId]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) =>
      p.name.toLowerCase().includes(q)
      || (p.category || '').toLowerCase().includes(q),
    );
  }, [products, query]);

  const startNew = () => { setEditing('new'); setForm(EMPTY_FORM); };
  const startEdit = (p) => {
    setEditing(p.id);
    setForm({
      name: p.name,
      description: p.description || '',
      price: String(p.price),
      category: p.category || '',
      available: p.available !== false,
    });
  };
  const cancel = () => { setEditing(null); setForm(EMPTY_FORM); };

  const save = async () => {
    if (!form.name.trim() || !form.category.trim() || !form.price) return;
    setIsSaving(true);
    try {
      if (editing === 'new') {
        const created = await createProduct({
          storeId,
          name: form.name.trim(),
          description: form.description.trim() || null,
          price: form.price,
          category: form.category.trim(),
          available: form.available,
        });
        setProducts((prev) => [created, ...prev]);
      } else {
        const updated = await updateProduct(editing, {
          name: form.name.trim(),
          description: form.description.trim() || null,
          price: form.price,
          category: form.category.trim(),
          available: form.available,
        });
        setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      }
      cancel();
    } catch (err) {
      setError(err.message || 'Error guardando');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleAvailable = async (p) => {
    try {
      const updated = await updateProduct(p.id, { available: !p.available });
      setProducts((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
    } catch (err) {
      setError(err.message || 'No se pudo actualizar disponibilidad');
    }
  };

  const remove = async (p) => {
    if (!confirm(`¿Eliminar "${p.name}"? Esta acción no se puede deshacer.`)) return;
    try {
      await deleteProduct(p.id);
      setProducts((prev) => prev.filter((x) => x.id !== p.id));
    } catch (err) {
      setError(err.message || 'No se pudo eliminar');
    }
  };

  if (!storeId) {
    return (
      <div className="merchant-empty">
        <Package size={36} strokeWidth={1.5} />
        <p>Cargá los datos de tu tienda primero.</p>
      </div>
    );
  }

  return (
    <div className="merchant-products">
      <div className="merchant-products__toolbar">
        <div className="merchant-products__search">
          <Search size={16} />
          <input
            placeholder="Buscar producto o categoría"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <button className="merchant-products__add" onClick={startNew}>
          <Plus size={16} /> Nuevo producto
        </button>
      </div>

      {error && <div className="merchant-products__error">{error}</div>}

      <AnimatePresence initial={false}>
        {editing && (
          <motion.div
            className="merchant-products__form"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div className="merchant-products__form-grid">
              <label>
                Nombre
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Arepa Reina Pepiada"
                />
              </label>
              <label>
                Categoría
                <input
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  placeholder="Arepas"
                />
              </label>
              <label>
                Precio (Bs.)
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  placeholder="4.50"
                />
              </label>
              <label className="merchant-products__check">
                <input
                  type="checkbox"
                  checked={form.available}
                  onChange={(e) => setForm({ ...form, available: e.target.checked })}
                />
                Disponible para pedir
              </label>
              <label className="merchant-products__full">
                Descripción
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Pollo desmechado con aguacate..."
                />
              </label>
            </div>
            <div className="merchant-products__form-actions">
              <button className="btn-ghost" onClick={cancel} disabled={isSaving}>
                <X size={14} /> Cancelar
              </button>
              <button className="btn-primary" onClick={save} disabled={isSaving}>
                <Save size={14} /> {isSaving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {isLoading ? (
        <div className="merchant-loading"><Spinner size="md" /></div>
      ) : filtered.length === 0 ? (
        <div className="merchant-empty">
          <Package size={36} strokeWidth={1.5} />
          <p>No hay productos {query ? 'que coincidan con tu búsqueda' : 'aún'}.</p>
        </div>
      ) : (
        <ul className="merchant-products__list">
          {filtered.map((p) => (
            <li key={p.id} className={`merchant-product ${p.available ? '' : 'merchant-product--off'}`}>
              <div className="merchant-product__main">
                <div className="merchant-product__name">{p.name}</div>
                <div className="merchant-product__meta">
                  <span className="merchant-product__cat">{p.category || 'Sin categoría'}</span>
                  <span className="merchant-product__price">{formatCurrency(p.price)}</span>
                </div>
                {p.description && <p className="merchant-product__desc">{p.description}</p>}
              </div>
              <div className="merchant-product__actions">
                <label className="merchant-product__toggle">
                  <input
                    type="checkbox"
                    checked={p.available !== false}
                    onChange={() => toggleAvailable(p)}
                  />
                  <span>{p.available !== false ? 'Disponible' : 'Oculto'}</span>
                </label>
                <button onClick={() => startEdit(p)} title="Editar"><Pencil size={14} /></button>
                <button onClick={() => remove(p)} title="Eliminar"><Trash2 size={14} /></button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

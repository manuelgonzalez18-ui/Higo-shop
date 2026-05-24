import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, ArrowLeft, X, Star } from 'lucide-react';
import { fetchStores } from '../../../services/storeService.js';
import { Spinner } from '../../../components/ui/Spinner.jsx';
import './SearchPage.css';

const HEALTHY_PRODUCTS = [
  { id: 'fresas', label: 'Fresas', emoji: '🍓' },
  { id: 'yogur', label: 'Yogur', emoji: '🥛' },
  { id: 'almendras', label: 'Almendras', emoji: '🌰' },
  { id: 'kombucha', label: 'Kombucha', emoji: '🍵' },
  { id: 'aceite-oliva', label: 'Aceite de oliva', emoji: '🫒' },
  { id: 'aguacate', label: 'Aguacate', emoji: '🥑' },
  { id: 'manzanas', label: 'Manzanas', emoji: '🍎' },
  { id: 'avena', label: 'Avena', emoji: '🥣' },
];

const MAIN_CATEGORIES = [
  { id: 'pizza', label: 'Pizza', emoji: '🍕' },
  { id: 'sushi', label: 'Sushi', emoji: '🍣' },
  { id: 'alitas', label: 'Alitas', emoji: '🍗' },
  { id: 'pasta', label: 'Pasta', emoji: '🍝' },
  { id: 'alcohol', label: 'Alcohol', emoji: '🍷' },
  { id: 'china', label: 'China', emoji: '🥡' },
  { id: 'sopas', label: 'Sopas', emoji: '🍲' },
  { id: 'hamburguesa', label: 'Hamburguesas', emoji: '🍔' },
  { id: 'desayunos', label: 'Desayunos', emoji: '🥞' },
  { id: 'postres', label: 'Postres', emoji: '🍰' },
  { id: 'cafe', label: 'Café', emoji: '☕' },
  { id: 'helados', label: 'Helados', emoji: '🍦' },
];

export function SearchPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStores().then((data) => {
      setStores(data);
      setLoading(false);
    });
  }, []);

  const matched = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return stores.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.description || '').toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q)
    );
  }, [query, stores]);

  return (
    <div className="search-page">
      {/* Search input */}
      <div className="search-page__bar">
        <div className="search-page__input">
          <Search size={18} />
          <input
            type="text"
            placeholder="Buscar en Higo Shop"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          {query && (
            <button className="search-page__clear" onClick={() => setQuery('')} aria-label="Borrar">
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {query ? (
        <SearchResults stores={matched} loading={loading} query={query} />
      ) : (
        <BrowseContent stores={stores} loading={loading} navigate={navigate} />
      )}
    </div>
  );
}

function BrowseContent({ stores, loading, navigate }) {
  return (
    <div className="search-page__browse">
      {/* Come sano */}
      <section className="search-section">
        <h3 className="search-section__title">Come sano</h3>
        <div className="healthy-scroll">
          {HEALTHY_PRODUCTS.map((p) => (
            <button
              key={p.id}
              className="healthy-card"
              onClick={() => navigate(`/search?q=${encodeURIComponent(p.label)}`)}
            >
              <div className="healthy-card__emoji">{p.emoji}</div>
              <span className="healthy-card__label">{p.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Categorías principales */}
      <section className="search-section">
        <h3 className="search-section__title">Categorías principales</h3>
        <div className="main-categories">
          {MAIN_CATEGORIES.map((c) => (
            <button key={c.id} className="main-category-row">
              <span className="main-category-row__emoji">{c.emoji}</span>
              <span className="main-category-row__label">{c.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Comercios destacados */}
      <section className="search-section">
        <h3 className="search-section__title">Comercios populares cerca de ti</h3>
        {loading ? (
          <div className="search-loading">
            <Spinner size="md" />
          </div>
        ) : (
          <div className="popular-stores">
            {stores.slice(0, 6).map((s) => (
              <Link key={s.id} to={`/store/${s.id}`} className="popular-store-card">
                <div className={`popular-store-card__avatar popular-store-card__avatar--${s.category}`}>
                  {s.category === 'restaurant' ? '🫓' :
                   s.category === 'pharmacy' ? '💊' :
                   s.category === 'bakery' ? '🥐' :
                   s.category === 'grocery' ? '🛒' : '☕'}
                </div>
                <div className="popular-store-card__info">
                  <div className="popular-store-card__name">{s.name}</div>
                  <div className="popular-store-card__meta">
                    <Star size={11} fill="currentColor" /> {s.rating.toFixed(1)} · {s.deliveryTime}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function SearchResults({ stores, loading, query }) {
  if (loading) {
    return (
      <div className="search-loading">
        <Spinner size="md" />
      </div>
    );
  }
  if (stores.length === 0) {
    return (
      <div className="search-empty">
        <h3>Sin resultados</h3>
        <p>No encontramos comercios que coincidan con "{query}".</p>
      </div>
    );
  }
  return (
    <motion.div
      className="search-results"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="search-results__count">
        {stores.length} resultado{stores.length === 1 ? '' : 's'}
      </div>
      {stores.map((s) => (
        <Link key={s.id} to={`/store/${s.id}`} className="search-result-row">
          <div className={`search-result-row__avatar search-result-row__avatar--${s.category}`}>
            {s.category === 'restaurant' ? '🫓' :
             s.category === 'pharmacy' ? '💊' :
             s.category === 'bakery' ? '🥐' :
             s.category === 'grocery' ? '🛒' : '☕'}
          </div>
          <div className="search-result-row__info">
            <div className="search-result-row__name">{s.name}</div>
            <div className="search-result-row__meta">
              <Star size={11} fill="currentColor" /> {s.rating.toFixed(1)} · {s.deliveryTime}
            </div>
            <div className="search-result-row__address truncate">{s.address}</div>
          </div>
        </Link>
      ))}
    </motion.div>
  );
}

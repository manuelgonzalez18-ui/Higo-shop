import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Search,
  MapPin,
  Star,
  Clock,
  Navigation,
  Store,
  SearchX,
  User
} from 'lucide-react';
import { fetchStores } from '../../../services/storeService.js';
import { useLocationStore } from '../../../stores/useLocationStore.js';
import { calculateDistance, formatDistance } from '../../../services/geolocation.js';
import { Spinner } from '../../../components/ui/Spinner.jsx';
import './MarketplaceHome.css';

const CATEGORIES = [
  { id: 'all', label: 'Todos', emoji: '🏪' },
  { id: 'restaurant', label: 'Restaurantes', emoji: '🍽️' },
  { id: 'pharmacy', label: 'Farmacias', emoji: '💊' },
  { id: 'bakery', label: 'Panaderías', emoji: '🥐' },
  { id: 'grocery', label: 'Bodegas', emoji: '🛒' },
  { id: 'cafe', label: 'Cafés', emoji: '☕' },
];

const staggerChildren = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 }
  }
};

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } }
};

export function MarketplaceHome() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [stores, setStores] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { userLocation } = useLocationStore();

  // Load stores from Supabase (falls back to mockStores automatically)
  useEffect(() => {
    let isMounted = true;
    fetchStores().then(data => {
      if (isMounted) {
        setStores(data);
        setIsLoading(false);
      }
    });
    return () => { isMounted = false; };
  }, []);

  const filteredStores = useMemo(() => {
    let list = [...stores];

    if (activeCategory !== 'all') {
      list = list.filter(s => s.category === activeCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q)
      );
    }

    // Sort: open first, then by distance
    stores.sort((a, b) => {
      if (a.isOpen !== b.isOpen) return a.isOpen ? -1 : 1;
      if (userLocation) {
        const distA = calculateDistance(userLocation.lat, userLocation.lng, a.latitude, a.longitude);
        const distB = calculateDistance(userLocation.lat, userLocation.lng, b.latitude, b.longitude);
        return distA - distB;
      }
      return 0;
    });

    return stores;
  }, [searchQuery, activeCategory, userLocation]);

  return (
    <div className="marketplace-home">
      {/* Hero Section */}
      <div className="marketplace-hero">
        <div className="hero-top">
          <div className="hero-location">
            <MapPin size={16} />
            <span className="hero-location-text truncate">
              {userLocation ? 'Caracas, Venezuela' : 'Obteniendo ubicación...'}
            </span>
          </div>
          <Link to="/profile" className="hero-profile-btn">
            <User size={20} />
          </Link>
        </div>

        <motion.div
          className="hero-greeting"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1>Higo Shop</h1>
          <p>Pide lo que quieras, te lo llevamos 🛵</p>
        </motion.div>

        <motion.div
          className="marketplace-search"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="search-input-wrapper">
            <Search size={20} />
            <input
              type="text"
              placeholder="Buscar comercios, productos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              id="marketplace-search"
            />
          </div>
        </motion.div>
      </div>

      {/* Categories */}
      <div className="marketplace-categories">
        <div className="categories-scroll">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              className={`category-chip ${activeCategory === cat.id ? 'category-chip--active' : ''}`}
              onClick={() => setActiveCategory(cat.id)}
              id={`category-${cat.id}`}
            >
              <span className="chip-emoji">{cat.emoji}</span>
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stores */}
      <div className="section-header">
        <h2>
          {activeCategory === 'all'
            ? 'Comercios cerca de ti'
            : CATEGORIES.find(c => c.id === activeCategory)?.label
          }
        </h2>
        <span style={{ fontSize: 'var(--font-sm)', color: 'var(--higo-gray-400)' }}>
          {filteredStores.length} disponibles
        </span>
      </div>

      {isLoading ? (
        <div className="empty-state" style={{ minHeight: '30vh' }}>
          <Spinner size="lg" />
          <p style={{ marginTop: 'var(--space-3)', color: 'var(--higo-gray-400)' }}>Buscando comercios...</p>
        </div>
      ) : filteredStores.length > 0 ? (
        <motion.div
          className="stores-grid"
          variants={staggerChildren}
          initial="hidden"
          animate="visible"
          key={activeCategory}
        >
          {filteredStores.map((store) => (
            <StoreCard
              key={store.id}
              store={store}
              userLocation={userLocation}
            />
          ))}
        </motion.div>
      ) : (
        <div className="empty-state">
          <SearchX size={48} />
          <h3>Sin resultados</h3>
          <p>No encontramos comercios con ese criterio</p>
        </div>
      )}
    </div>
  );
}

function StoreCard({ store, userLocation }) {
  const distance = userLocation
    ? calculateDistance(userLocation.lat, userLocation.lng, store.latitude, store.longitude)
    : null;

  const categoryEmojis = {
    restaurant: '🍽️',
    pharmacy: '💊',
    bakery: '🥐',
    grocery: '🛒',
    cafe: '☕',
  };

  return (
    <motion.div variants={fadeInUp}>
      <Link to={`/store/${store.id}`} className="store-card" id={`store-${store.id}`}>
        <div className="store-card__image">
          <div className={`store-card__image-placeholder store-card__image-placeholder--${store.category}`}>
            {categoryEmojis[store.category] || '🏪'}
          </div>
          {!store.isOpen && (
            <div className="store-card__closed-tag">Cerrado</div>
          )}
        </div>

        <div className="store-card__info">
          <div className="store-card__name truncate">{store.name}</div>
          <div className="store-card__category">{store.category === 'restaurant' ? 'Restaurante' : store.category === 'pharmacy' ? 'Farmacia' : store.category === 'bakery' ? 'Panadería' : store.category === 'grocery' ? 'Bodega' : 'Café'}</div>

          <div className="store-card__meta">
            <div className="store-card__rating">
              <Star size={14} fill="currentColor" />
              {store.rating.toFixed(1)}
              <span className="store-card__rating-count">({store.reviewCount})</span>
            </div>
            <div className="store-card__delivery">
              <Clock size={13} />
              {store.deliveryTime}
            </div>
            {distance !== null && (
              <div className="store-card__distance">
                <Navigation size={13} />
                {formatDistance(distance)}
              </div>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

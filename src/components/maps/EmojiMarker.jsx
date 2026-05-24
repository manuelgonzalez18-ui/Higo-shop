import { AdvancedMarker } from '@vis.gl/react-google-maps';

const PRESETS = {
  user: { emoji: '📍', bg: '#3B82F6', border: '#1D4ED8', size: 38 },
  store: { emoji: '🏪', bg: '#171E30', border: '#3B82F6', size: 38 },
  driver: { emoji: '🛵', bg: '#10B981', border: '#059669', size: 44 },
  restaurant: { emoji: '🫓', bg: '#171E30', border: '#3B82F6', size: 38 },
  pharmacy: { emoji: '💊', bg: '#171E30', border: '#3B82F6', size: 38 },
  bakery: { emoji: '🥐', bg: '#171E30', border: '#3B82F6', size: 38 },
  grocery: { emoji: '🛒', bg: '#171E30', border: '#3B82F6', size: 38 },
  cafe: { emoji: '☕', bg: '#171E30', border: '#3B82F6', size: 38 },
};

export function EmojiMarker({ position, preset = 'store', onClick, bounce = false, zIndex }) {
  const cfg = PRESETS[preset] || PRESETS.store;

  return (
    <AdvancedMarker position={position} onClick={onClick} zIndex={zIndex}>
      <div
        style={{
          width: cfg.size,
          height: cfg.size,
          borderRadius: '50%',
          background: cfg.bg,
          border: `2px solid ${cfg.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: Math.round(cfg.size * 0.55),
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.55)',
          cursor: onClick ? 'pointer' : 'default',
          animation: bounce ? 'higo-marker-bounce 1.4s ease-in-out infinite' : undefined,
          transition: 'transform 0.2s ease',
        }}
      >
        {cfg.emoji}
      </div>
    </AdvancedMarker>
  );
}

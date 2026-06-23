export const OPCIONES_DESAYUNO = [
  'Empanadas de Cazón',
  'Empanada de Molida',
  'Empanada de Queso',
  'Empanadas de Carne Mechada',
];

export const OPCIONES_ALMUERZO = [
  'Pescado Frito con tostón y ensalada',
  'Pollo Frito con tostón y ensalada',
];

// Cada pasajero recibe hasta 2 empanadas de desayuno y puede combinar rellenos
// (ej. 1 de cazón + 1 de queso). El desayuno se guarda como un mapa
// relleno → cantidad.
export const MAX_EMPANADAS = 2;

// Convierte el mapa { relleno: cantidad } en un texto legible para la tabla y
// el PDF, p. ej. "Empanadas de Cazón x1, Empanada de Queso x1".
export function formatDesayunoItems(items) {
  if (!items || typeof items !== 'object') return '—';
  const partes = Object.entries(items)
    .filter(([, cant]) => Number(cant) > 0)
    .map(([relleno, cant]) => `${relleno} x${cant}`);
  return partes.length ? partes.join(', ') : '—';
}

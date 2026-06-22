// Lista fija de destinos de la agencia. Colonia Tovar usa jeeps (cupo 10);
// el resto usa autobuses (cupo 31). Esta capacidad determina cuándo se
// cierra una unidad y se abre la siguiente al registrar pasajeros.
export const DESTINOS = [
  { id: 'colonia-tovar', nombre: 'Colonia Tovar', vehiculo: 'jeep', capacidadUnidad: 10 },
  { id: 'tour-coro', nombre: 'Tour Coro', vehiculo: 'bus', capacidadUnidad: 31 },
  { id: 'chuspa', nombre: 'Chuspa', vehiculo: 'bus', capacidadUnidad: 31 },
  { id: 'morrocoy', nombre: 'Morrocoy', vehiculo: 'bus', capacidadUnidad: 31 },
  { id: 'caracolito', nombre: 'Caracolito', vehiculo: 'bus', capacidadUnidad: 31 },
  { id: 'la-playita', nombre: 'La Playita', vehiculo: 'bus', capacidadUnidad: 31 },
  { id: 'galipan', nombre: 'Galipán', vehiculo: 'bus', capacidadUnidad: 31 },
  { id: 'merida', nombre: 'Mérida', vehiculo: 'bus', capacidadUnidad: 31 },
  { id: 'dunas', nombre: 'Dunas', vehiculo: 'bus', capacidadUnidad: 31 },
  { id: 'trinchera', nombre: 'Trinchera', vehiculo: 'bus', capacidadUnidad: 31 },
  { id: 'mochima', nombre: 'Mochima', vehiculo: 'bus', capacidadUnidad: 31 },
  { id: 'nocturneando-la-guaira', nombre: 'Nocturneando Por la Guaira', vehiculo: 'bus', capacidadUnidad: 31 },
];

export function getDestinoById(id) {
  return DESTINOS.find((d) => d.id === id);
}

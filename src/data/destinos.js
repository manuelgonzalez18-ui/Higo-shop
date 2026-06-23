// Lista fija de destinos de la agencia. Colonia Tovar y Galipán usan jeeps
// (cupo 10); el resto usa autobuses (cupo 31). Esta capacidad determina
// cuándo se cierra una unidad y se abre la siguiente al registrar pasajeros.
export const DESTINOS = [
  { id: 'colonia-tovar', nombre: 'Colonia Tovar', vehiculo: 'jeep', capacidadUnidad: 10 },
  { id: 'galipan', nombre: 'Galipán', vehiculo: 'jeep', capacidadUnidad: 10 },
  { id: 'tour-coro', nombre: 'Tour Coro', vehiculo: 'bus', capacidadUnidad: 31 },
  { id: 'chuspa', nombre: 'Chuspa', vehiculo: 'bus', capacidadUnidad: 31 },
  { id: 'chuspa-playa-caribe', nombre: 'Chuspa - Playa Caribe', vehiculo: 'bus', capacidadUnidad: 31 },
  { id: 'chuspa-playa-los-indios', nombre: 'Chuspa - Playa Los Indios', vehiculo: 'bus', capacidadUnidad: 31 },
  { id: 'morrocoy', nombre: 'Morrocoy', vehiculo: 'bus', capacidadUnidad: 31 },
  { id: 'fin-de-semana-morrocoy', nombre: 'Fin de Semana en Morrocoy', vehiculo: 'bus', capacidadUnidad: 31 },
  { id: 'cayo-sombrero', nombre: 'Cayo Sombrero', vehiculo: 'bus', capacidadUnidad: 31 },
  { id: 'cayo-muerto', nombre: 'Cayo Muerto', vehiculo: 'bus', capacidadUnidad: 31 },
  { id: 'cayo-sal', nombre: 'Cayo Sal', vehiculo: 'bus', capacidadUnidad: 31 },
  { id: 'cayo-azul', nombre: 'Cayo Azul', vehiculo: 'bus', capacidadUnidad: 31 },
  { id: 'caracolito', nombre: 'Caracolito', vehiculo: 'bus', capacidadUnidad: 31 },
  { id: 'playa-kanaloa', nombre: 'Playa Kanaloa', vehiculo: 'bus', capacidadUnidad: 31 },
  { id: 'playa-buche', nombre: 'Playa Buche', vehiculo: 'bus', capacidadUnidad: 31 },
  { id: 'la-playita', nombre: 'La Playita', vehiculo: 'bus', capacidadUnidad: 31 },
  { id: 'rio-guayabal', nombre: 'Río Guayabal', vehiculo: 'bus', capacidadUnidad: 31 },
  { id: 'merida', nombre: 'Mérida', vehiculo: 'bus', capacidadUnidad: 31 },
  { id: 'dunas', nombre: 'Dunas', vehiculo: 'bus', capacidadUnidad: 31 },
  { id: 'trinchera', nombre: 'Trinchera', vehiculo: 'bus', capacidadUnidad: 31 },
  { id: 'aguas-termales-trincheras', nombre: 'Aguas Termales de Trincheras', vehiculo: 'bus', capacidadUnidad: 31 },
  { id: 'mochima', nombre: 'Mochima', vehiculo: 'bus', capacidadUnidad: 31 },
  { id: 'mochima-isla-de-plata', nombre: 'Mochima - Isla de Plata', vehiculo: 'bus', capacidadUnidad: 31 },
  { id: 'mochima-manare', nombre: 'Mochima - Manare', vehiculo: 'bus', capacidadUnidad: 31 },
  { id: 'hacienda-la-calceta', nombre: 'Hacienda La Calceta', vehiculo: 'bus', capacidadUnidad: 31 },
  { id: 'nocturneando-la-guaira', nombre: 'Nocturneando Por la Guaira', vehiculo: 'bus', capacidadUnidad: 31 },
  { id: 'tambores-san-juan', nombre: 'Tambores de San Juan', vehiculo: 'bus', capacidadUnidad: 31 },
];

export function getDestinoById(id) {
  return DESTINOS.find((d) => d.id === id);
}

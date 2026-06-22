import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency, formatDate } from '../utils/formatters.js';

const COLUMNS = [
  'Unidad', 'Grupo', 'Nombre', 'Apellido', 'Cédula', 'Teléfono',
  'Reservado', 'Pendiente', 'Comida',
];

function buildRows(pasajeros) {
  return pasajeros.map((p) => [
    p.unidad_numero,
    p.grupo_numero,
    p.nombre,
    p.apellido,
    p.cedula,
    p.telefono,
    formatCurrency(p.monto_reservado),
    formatCurrency(p.monto_pendiente),
    p.servicio_comida ? 'Sí' : 'No',
  ]);
}

export function generarPdfViaje(viaje, pasajeros) {
  const doc = new jsPDF({ orientation: 'landscape' });
  const totalUnidades = pasajeros.length
    ? Math.max(...pasajeros.map((p) => p.unidad_numero))
    : 0;
  const totalReservado = pasajeros.reduce((sum, p) => sum + Number(p.monto_reservado), 0);
  const totalPendiente = pasajeros.reduce((sum, p) => sum + Number(p.monto_pendiente), 0);
  const totalComida = pasajeros.filter((p) => p.servicio_comida).length;

  doc.setFontSize(16);
  doc.text(`Viaje: ${viaje.destino_nombre}`, 14, 16);
  doc.setFontSize(10);
  doc.text(
    `Fecha: ${formatDate(viaje.fecha)}   |   Capacidad por unidad: ${viaje.capacidad_unidad}   |   ` +
    `Pasajeros: ${pasajeros.length}   |   Unidades: ${totalUnidades}`,
    14, 23,
  );

  autoTable(doc, {
    startY: 28,
    head: [COLUMNS],
    body: buildRows(pasajeros),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [37, 99, 235] },
  });

  const finalY = doc.lastAutoTable.finalY + 8;
  doc.setFontSize(10);
  doc.text(
    `Total reservado: ${formatCurrency(totalReservado)}   |   ` +
    `Total pendiente: ${formatCurrency(totalPendiente)}   |   ` +
    `Con servicio de comida: ${totalComida}`,
    14, finalY,
  );

  doc.save(`viaje-${viaje.destino_id}-${viaje.fecha}.pdf`);
}

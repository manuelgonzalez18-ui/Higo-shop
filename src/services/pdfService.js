import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency, formatDate } from '../utils/formatters.js';
import { formatDesayunoItems } from '../data/comidaOpciones.js';

const COLUMNS = [
  'Unidad', 'Grupo', 'Nombre', 'Apellido', 'Cédula', 'Teléfono', 'Punto de recogida',
  'Reservado', 'Pendiente', 'Comida',
];

const COLUMNS_COMIDA = ['Unidad', 'Grupo', 'Nombre', 'Apellido', 'Desayuno', 'Almuerzo'];
const COLUMNS_TOTALES = ['Plato', 'Cantidad total'];

const GASTOS = [
  ['Logística', 'gasto_logistica'],
  ['Transporte Marítimo', 'gasto_transporte_maritimo'],
  ['Transporte Terrestre', 'gasto_transporte_terrestre'],
  ['Empleados', 'gasto_empleados'],
  ['Comidas', 'gasto_comidas'],
  ['Hidratación', 'gasto_hidratacion'],
];

function buildRows(pasajeros) {
  return pasajeros.map((p) => [
    p.unidad_numero,
    p.grupo_numero,
    p.nombre,
    p.apellido,
    p.cedula,
    p.telefono,
    p.punto_recogida || '—',
    formatCurrency(p.monto_reservado),
    formatCurrency(p.monto_pendiente),
    p.servicio_comida ? 'Sí' : 'No',
  ]);
}

function buildRowsComida(pasajeros) {
  return pasajeros
    .filter((p) => p.servicio_comida)
    .map((p) => [
      p.unidad_numero,
      p.grupo_numero,
      p.nombre,
      p.apellido,
      formatDesayunoItems(p.desayuno_items),
      p.almuerzo_solicitado || '—',
    ]);
}

function buildRowsTotales(pasajeros) {
  const totales = new Map();
  for (const p of pasajeros) {
    if (!p.servicio_comida) continue;
    const items = p.desayuno_items && typeof p.desayuno_items === 'object' ? p.desayuno_items : {};
    for (const [relleno, cant] of Object.entries(items)) {
      const n = Number(cant) || 0;
      if (n > 0) totales.set(relleno, (totales.get(relleno) || 0) + n);
    }
    if (p.almuerzo_solicitado) {
      totales.set(p.almuerzo_solicitado, (totales.get(p.almuerzo_solicitado) || 0) + 1);
    }
  }
  return [...totales.entries()].sort((a, b) => a[0].localeCompare(b[0]));
}

function calcularFinanzas(viaje, pasajeros) {
  const ingresosCobrados = pasajeros.reduce((sum, p) => sum + Number(p.monto_reservado), 0);
  const ingresosPendientes = pasajeros.reduce((sum, p) => sum + Number(p.monto_pendiente), 0);
  const ingresosProyectados = pasajeros.reduce(
    (sum, p) => sum + Number(p.servicio_comida ? viaje.precio_pasajero_comida : viaje.precio_pasajero),
    0,
  );
  const gastos = GASTOS.map(([nombre, campo]) => ({ nombre, monto: Number(viaje[campo]) || 0 }));
  const totalGastos = gastos.reduce((sum, gasto) => sum + gasto.monto, 0);

  return {
    ingresosCobrados,
    ingresosPendientes,
    ingresosProyectados,
    gastos,
    totalGastos,
    gananciaActual: ingresosCobrados - totalGastos,
    gananciaProyectada: ingresosProyectados - totalGastos,
  };
}

export function generarPdfViaje(viaje, pasajeros) {
  const doc = new jsPDF({ orientation: 'landscape' });
  const totalUnidades = pasajeros.length
    ? Math.max(...pasajeros.map((p) => p.unidad_numero))
    : 0;
  const totalReservado = pasajeros.reduce((sum, p) => sum + Number(p.monto_reservado), 0);
  const totalPendiente = pasajeros.reduce((sum, p) => sum + Number(p.monto_pendiente), 0);
  const totalComida = pasajeros.filter((p) => p.servicio_comida).length;
  const finanzas = calcularFinanzas(viaje, pasajeros);

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
    `Total cobrado: ${formatCurrency(totalReservado)}   |   ` +
    `Total pendiente: ${formatCurrency(totalPendiente)}   |   ` +
    `Con servicio de comida: ${totalComida}`,
    14, finalY,
  );

  doc.addPage();
  doc.setFontSize(16);
  doc.text(`Informe financiero — ${viaje.destino_nombre}`, 14, 16);
  doc.setFontSize(10);
  doc.text(`Fecha: ${formatDate(viaje.fecha)}   |   Pasajeros: ${pasajeros.length}`, 14, 23);

  autoTable(doc, {
    startY: 30,
    head: [['Concepto', 'Monto']],
    body: finanzas.gastos.map((gasto) => [gasto.nombre, formatCurrency(gasto.monto)]),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [37, 99, 235] },
    tableWidth: 120,
  });

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 8,
    head: [['Resumen financiero', 'Monto']],
    body: [
      ['Ingresos cobrados', formatCurrency(finanzas.ingresosCobrados)],
      ['Ingresos pendientes', formatCurrency(finanzas.ingresosPendientes)],
      ['Ingresos proyectados', formatCurrency(finanzas.ingresosProyectados)],
      ['Total de gastos', formatCurrency(finanzas.totalGastos)],
      ['Ganancia actual', formatCurrency(finanzas.gananciaActual)],
      ['Ganancia proyectada', formatCurrency(finanzas.gananciaProyectada)],
    ],
    styles: { fontSize: 9 },
    headStyles: { fillColor: [37, 99, 235] },
    tableWidth: 150,
  });

  if (totalComida > 0) {
    doc.addPage();
    doc.setFontSize(16);
    doc.text(`Menú — ${viaje.destino_nombre}`, 14, 16);
    doc.setFontSize(10);
    doc.text(
      `Fecha: ${formatDate(viaje.fecha)}   |   Pasajeros con servicio de comida: ${totalComida}`,
      14, 23,
    );

    autoTable(doc, {
      startY: 28,
      head: [COLUMNS_COMIDA],
      body: buildRowsComida(pasajeros),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [37, 99, 235] },
    });

    const totalesY = doc.lastAutoTable.finalY + 8;
    doc.setFontSize(12);
    doc.text('Totales por plato', 14, totalesY);

    autoTable(doc, {
      startY: totalesY + 4,
      head: [COLUMNS_TOTALES],
      body: buildRowsTotales(pasajeros),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [37, 99, 235] },
      tableWidth: 100,
    });
  }

  doc.save(`viaje-${viaje.destino_id}-${viaje.fecha}.pdf`);
}

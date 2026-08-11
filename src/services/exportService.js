export function exportarRespaldoViaje(viaje, pasajeros) {
  const payload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    viaje,
    pasajeros,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const fecha = viaje.fecha || new Date().toISOString().slice(0, 10);
  const destino = (viaje.destino_nombre || 'viaje').replace(/[^a-z0-9áéíóúñ_-]+/gi, '-');
  link.href = url;
  link.download = `gaby-tours-${destino}-${fecha}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function exportarCsvPasajeros(viaje, pasajeros) {
  const headers = ['unidad','grupo','nombre','apellido','cedula','telefono','punto_recogida','reservado','pendiente','comida','almuerzo'];
  const rows = pasajeros.map((p) => [p.unidad_numero,p.grupo_numero,p.nombre,p.apellido,p.cedula,p.telefono,p.punto_recogida || '',p.monto_reservado,p.monto_pendiente,p.servicio_comida ? 'si' : 'no',p.almuerzo_solicitado || '']);
  const escape = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`;
  const csv = [headers, ...rows].map((row) => row.map(escape).join(',')).join('\n');
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `pasajeros-${viaje.fecha || 'viaje'}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

# Gaby Tours — mejoras implementadas

Esta rama agrupa las mejoras de seguridad, operación y experiencia de uso para la herramienta de reservas de Gaby Tours 2021.

## Incluido

- Autenticación administrativa con Supabase Auth.
- Eliminación del fallback hardcodeado de URL/anon key y validación estricta de variables de entorno.
- Manejo de errores de conexión con mensajes más comprensibles y reintento.
- Edición de pasajeros.
- Registro de pagos parciales con historial en base de datos.
- Eliminación segura de pasajeros y reordenamiento automático de orden/unidad.
- Reglas de integridad para capacidad, montos y duplicados por cédula dentro de un viaje.
- Exportación de datos operativos.
- Vista de pasajeros optimizada para móvil.
- Manifest web instalable (PWA básica) además del empaquetado Android existente.
- Tests unitarios de formateadores y CI de tests + build.

## Migración de base de datos

`supabase/migrations/20260810000000_operational_hardening.sql` agrega pagos, funciones RPC y RLS para usuarios autenticados.

Antes de activar RLS en producción debe existir al menos un usuario administrador de Supabase Auth para evitar bloquear el acceso de operación.

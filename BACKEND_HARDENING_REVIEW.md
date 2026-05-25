# Revisión backend/data layer (Supabase) y plan de hardening

Fecha: 2026-05-24

## Alcance revisado
- Servicios Supabase frontend: `src/services/*.js`, hooks realtime en `src/hooks/*.js`.
- Migraciones SQL y RLS: `supabase/migrations/20260524000000_init_schema.sql`.
- Consistencia de modelo de órdenes y drivers entre DB y capa cliente.

## Hallazgos (brechas)

### 1) RLS demasiado permisivo en tablas críticas
- `profiles`, `stores`, `products` y `drivers` exponen lectura pública total (`using (true)`), lo que permite enumeración de PII/metadatos de operación (teléfonos, ubicaciones, pagos móviles). Esto es riesgo de privacidad y scraping.
- En `orders`, varias políticas están definidas `for all` con sólo `using (...)`. Para `INSERT` y `UPDATE` faltan `with check (...)` explícitos por rol/campos, lo que dificulta garantizar integridad por transición de estado.
- La política de drivers sobre órdenes (`status='READY_TO_DISPATCH' or auth.uid()=driver_id`) aplicada `for all` puede permitir `UPDATE`/`DELETE` no deseados por conductores no asignados dependiendo del statement.

### 2) Integridad de negocio insuficiente en tabla `orders`
- No hay constraints para:
  - coherencia de `driver_id` según `status` (p.ej. `DRIVER_ASSIGNED` debería requerir driver).
  - transición válida de estados (state machine).
  - estructura mínima de `items` (array no vacío con `{id,name,quantity,price}`).
  - correlación `payment_status` vs `status` (ej. marcar entregado sin pago validado).
- `store_id` y `customer_id` están `on delete set null` y también `not null` (combinación inconsistente semánticamente; en delete puede bloquear/romper expectativas).

### 3) Inconsistencias de modelo order/driver entre DB y cliente
- `mapOrderRow` no mapea `customer_id`, `payment_status`, `payment_method`, `reference_number` y `store` geodata; el UI de driver espera `storeLocation` y suele no existir en órdenes remotas.
- `useOrderStore` mezcla órdenes locales (id `order-xxxx`) y remotas (UUID), con riesgo de colisiones lógicas, filtros, y UX inconsistente en dashboards.
- `driver_id` en `orders` referencia `profiles(id)` y no `drivers(id)`: permite asignar usuarios no-driver si no hay validación adicional.

### 4) Realtime: cobertura parcial y falta de controles operativos
- Suscripciones sin manejo de estado de conexión/reintentos/backoff/refresh de token.
- `useRealtimeOrders` sólo escucha por `customer_id`; en dashboard driver no existe suscripción equivalente por `READY_TO_DISPATCH`/`driver_id`.
- No hay deduplicación/orden robusto por `updated_at` frente a eventos fuera de orden.

### 5) Tracking y eventos: seguridad y operación
- `driver_locations` permite inserción por `driver_id = auth.uid()` pero no verifica que ese driver esté asignado al `order_id` en ese momento.
- No hay retención/particionamiento para `driver_locations` (tabla de alta escritura).
- `order_events.event_type` es texto libre (sin catálogo), dificultando analítica y controles.

### 6) Falta de índices y automatismos de mantenimiento
- Faltan índices compuestos típicos para consultas de operación:
  - `orders(customer_id, created_at desc)`
  - `orders(store_id, created_at desc)`
  - `orders(driver_id, status, updated_at desc)`
  - `orders(status, created_at desc)`
- No hay trigger global `updated_at` (se setea desde cliente en algunos paths, no confiable).

### 7) Seed y exposición de datos
- Seed en migración base inserta comercios con datos semireales en entorno compartido; falta separación clara para `dev/demo`.

## Plan técnico de hardening (priorizado)

### Fase 0 (rápida: 1-2 días)
1. **Cerrar exposición pública**:
   - Reemplazar `select using (true)` por políticas mínimas por rol en `profiles/drivers/stores/products`.
2. **Separar políticas por verbo**:
   - Crear políticas `select/insert/update/delete` explícitas para `orders` y evitar `for all`.
3. **Bloquear updates inválidos en órdenes**:
   - `with check` para que sólo merchant/driver asignado/sistema cambien estados permitidos.
4. **Tracking seguro**:
   - En `driver_locations insert`, exigir `exists(select 1 from orders where id=order_id and driver_id=auth.uid())`.

### Fase 1 (núcleo de integridad: 3-5 días)
1. **State machine en DB**:
   - Función `can_transition_order_status(old,new)` + trigger `before update`.
2. **Constraints de coherencia**:
   - `check ((status in ('DRIVER_ASSIGNED','PICKED_UP','DELIVERED')) = (driver_id is not null))` adaptado por reglas.
   - Validación JSON `items` (array no vacío, quantity>0, price>=0) con `check`/función.
3. **FK de driver robusta**:
   - Cambiar `orders.driver_id` para referenciar `drivers(id)` o trigger que valide rol `driver`.
4. **Trigger `updated_at` centralizado** para todas las tablas operativas.

### Fase 2 (performance y observabilidad: 2-4 días)
1. **Índices operativos** en `orders` y revisión `EXPLAIN ANALYZE`.
2. **Retención tracking**:
   - job programado para compactar/eliminar `driver_locations` antiguos.
3. **Realtime resiliente cliente**:
   - wrapper de suscripción con reconexión, métricas, y resync por snapshot al reconectar.
4. **Catálogo de eventos**:
   - enum/check para `order_events.event_type` + versionado de payload.

### Fase 3 (modelo cliente y contrato API: 2-3 días)
1. **Normalizar mappers** (`mapOrderRow`) con contrato único de dominio.
2. **Eliminar mezcla local/remoto** o namespacing de IDs para evitar conflictos.
3. **DTOs tipados** (TS o zod runtime) para validar payloads antes de persistir/renderizar.

## Métricas de éxito
- 0 lecturas públicas no necesarias de PII.
- 0 transiciones de estado inválidas registradas.
- p95 de consultas de órdenes < 100 ms con índices.
- Reconexión realtime < 5 s con resync automático.
- Reducción >80% de eventos de tracking huérfanos/no asignados.

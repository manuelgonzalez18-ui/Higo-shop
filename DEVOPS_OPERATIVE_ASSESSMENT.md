# Evaluación operativa / DevOps — Higo-shop

Fecha de evaluación: 2026-05-24.

## Resumen ejecutivo

Estado general: **MVP funcional con deuda operativa media-alta**.

- **Build/Deploy:** base correcta para SPA estática, pero sin pipeline CI/CD formal ni controles de calidad previos al deploy.
- **Env vars:** validación mínima presente, pero falta estrategia completa por entorno, rotación y documentación tipo `.env.example`.
- **Resiliencia:** hay algunos fallbacks útiles (ej. datos mock en `storeService`), pero poca gestión sistemática de errores/reintentos/circuit breakers.
- **Observabilidad:** prácticamente ausente (sin métricas, tracing, error reporting estructurado ni alertas).
- **Testing:** sin suites automáticas (unit/integration/e2e) ni gates de cobertura.
- **Go-live readiness:** no hay checklist de release institucionalizado ni runbooks de incidentes/rollback.

---

## Hallazgos por dominio

### 1) Build & Deploy

**Evidencia técnica**
- Scripts de npm limitados a `dev`, `build`, `preview` (sin lint/test/typecheck). 
- Configuración Vite básica, salida a `dist` y ajustes simples de build.
- Documento de despliegue manual para Hostinger con fallback SPA (`.htaccess`).

**Fortalezas**
- Flujo de build reproducible (`npm ci && npm run build`).
- Guía explícita para rutas SPA en hosting estático.

**Brechas**
- Sin CI/CD (GitHub Actions/GitLab CI/etc.).
- Sin promoción entre ambientes (dev/staging/prod).
- Sin versionado de artefactos ni estrategia de rollback automatizable.
- Sin quality gates previos al deploy (tests, lint, SAST, dependency scan).

**Riesgo operativo**: alto en frecuencia de errores de release manual.

### 2) Manejo de variables de entorno y secretos

**Evidencia técnica**
- Validación explícita de `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_GOOGLE_MAPS_API_KEY` en runtime.
- Documento de deploy lista variables requeridas.

**Fortalezas**
- Falla temprana al faltar variables críticas (evita estados silenciosos inconsistentes).

**Brechas**
- No se observa `.env.example` ni matriz por entorno.
- No se observa política de rotación/owner de secretos.
- Dependencia de configuración manual en hosting.
- Falta validación de formato (URL válida, longitud mínima de claves, etc.).

**Riesgo operativo**: medio-alto (misconfiguración y drift entre entornos).

### 3) Resiliencia de aplicación

**Evidencia técnica**
- Existe `RouteErrorBoundary`.
- `storeService` implementa fallback a mocks ante falla de Supabase.
- Hay múltiples `.catch(() => {})` que silencian errores en flujos críticos.

**Fortalezas**
- Degradación parcial funcional en lectura de catálogo (fallback local).

**Brechas**
- Errores silenciados sin telemetría ni compensación.
- No se observan reintentos con backoff, timeouts homogéneos ni idempotencia documentada.
- No hay feature flags ni kill-switches para desactivar capacidades inestables.
- Dependencia de terceros (Supabase/Google Maps) sin health-checks visibles.

**Riesgo operativo**: alto para incidencias intermitentes difíciles de diagnosticar.

### 4) Observabilidad

**Evidencia técnica**
- Uso de `console.log/warn/error` local.
- No se observan integraciones con Sentry/Datadog/OpenTelemetry/GA4 logs estructurados.

**Fortalezas**
- Logging ad hoc útil en desarrollo local.

**Brechas**
- Sin SLIs/SLOs definidos.
- Sin dashboards, alerting, trazabilidad de errores por release.
- Sin correlación de eventos de negocio con estado técnico.

**Riesgo operativo**: muy alto MTTR por baja visibilidad.

### 5) Testing y calidad

**Evidencia técnica**
- No hay scripts de test/lint en `package.json`.
- No se detectan frameworks de test en dependencias (`vitest`, `jest`, `playwright`, `cypress`).

**Fortalezas**
- Build actual compila correctamente.

**Brechas**
- Sin pruebas unitarias/integración/E2E.
- Sin cobertura ni umbrales mínimos.
- Sin smoke tests post-deploy automatizados.

**Riesgo operativo**: muy alto para regresiones en producción.

### 6) Checklist de salida a producción

**Estado actual**: parcial/manual.

Se cuenta con pasos de deploy estático, pero faltan controles formales de release:
- aprobación de cambios,
- verificación de migraciones,
- backup/rollback,
- smoke tests,
- monitoreo reforzado post-release,
- criterios de abortar release.

---

## Checklist recomendado de producción (v1)

1. **Pre-merge (obligatorio)**
   - Lint + typecheck + unit tests en CI.
   - Scan de dependencias y secrets.
2. **Pre-deploy**
   - Validación automática de env vars (presencia + formato).
   - Verificación de migraciones DB y compatibilidad backward.
3. **Deploy**
   - Despliegue a staging + smoke E2E.
   - Aprobación manual (2-eye principle) a producción.
4. **Post-deploy (0-30 min)**
   - Health checks + tasa de errores + tiempos p95.
   - Confirmación de flujos críticos: checkout, tracking, actualización de órdenes.
5. **Rollback plan**
   - Procedimiento documentado < 10 min.
   - Artefacto versionado anterior listo para restore.

---

## Roadmap por fases (hitos y métricas)

## Fase 0 (Semana 1–2): Fundamentos de control

**Objetivo**: reducir riesgo básico de cambios.

**Hitos**
- Añadir scripts `lint`, `test`, `typecheck` y pipeline CI en PR.
- Crear `.env.example` + `env.schema` (zod/envalid).
- Definir ambientes `dev/staging/prod`.

**Métricas de éxito**
- 100% PRs pasan CI antes de merge.
- 0 deploys a prod sin build verificado.
- 100% variables críticas definidas por entorno.

## Fase 1 (Semana 3–5): Calidad funcional y release seguro

**Objetivo**: prevenir regresiones en journeys críticos.

**Hitos**
- Unit tests para servicios de pricing, orders, store fallbacks.
- E2E smoke (login/checkout/order tracking).
- Release checklist institucionalizada en repo.

**Métricas de éxito**
- Cobertura mínima global: 50% (y 70% en módulos críticos).
- Tasa de fallos en deploy < 10%.
- MTTR inicial medible (baseline).

## Fase 2 (Semana 6–8): Observabilidad y resiliencia

**Objetivo**: detectar y resolver incidentes rápido.

**Hitos**
- Integrar error tracking (Sentry) + release tags.
- Instrumentar logs estructurados y eventos de negocio críticos.
- Implementar retries con backoff y manejo de timeouts uniforme.
- Eliminar `.catch(() => {})` silenciosos.

**Métricas de éxito**
- 90% errores frontend con stack/contexto.
- Reducción de MTTR en 40% vs baseline.
- < 2% errores no clasificados por semana.

## Fase 3 (Semana 9–12): Operación madura

**Objetivo**: escalar con confiabilidad.

**Hitos**
- SLOs definidos (ej. disponibilidad app, éxito checkout, latencia p95).
- Dashboards + alertas por umbral/SLO burn rate.
- Runbooks de incidentes y on-call rotativo.
- Estrategia de rollback automatizada y ensayada.

**Métricas de éxito**
- Cumplimiento SLO mensual >= 99.5% (frontend uptime percibido).
- Error budget consumido dentro de política.
- Tiempo de rollback p95 < 10 min.

---

## Priorización recomendada

1. **Primero**: CI + tests smoke + env management (impacto alto, esfuerzo medio).
2. **Segundo**: observabilidad (impacto altísimo en operación diaria).
3. **Tercero**: resiliencia avanzada y SLOs (madurez operativa).

## Conclusión

El repositorio está bien encaminado para un producto en fase temprana, pero **aún no está listo para operación de producción robusta** sin reforzar calidad automática, observabilidad y disciplina de release. La ruta propuesta en 4 fases permite pasar de MVP funcional a operación confiable con métricas objetivas.

# Higo App — Release Checklist

> Lista mínima viable para reducir el riesgo de cada release. Derivada de
> `DEVOPS_OPERATIVE_ASSESSMENT.md` (Fase 0/1). Crecerá con tests/lint/E2E
> cuando se sumen al proyecto.

## Antes de mergear a `main`

- [ ] **PR con descripción clara**: motivación, archivos clave, qué se rompe / qué NO.
- [ ] **CI verde** (workflow `CI — Build check`).
- [ ] **Sin regresiones de protecciones** verificadas:
  - [ ] `src/lib/googleMaps.js` mantiene el fallback (no `throw`).
  - [ ] `src/services/supabase.js` mantiene el fallback (no `throw`).
  - [ ] `.github/workflows/deploy.yml` mantiene el step `FTP preflight (fail-fast)`.
- [ ] **Migraciones DB**: si el PR agrega archivos en `supabase/migrations/`, el operador confirma haberlas aplicado en el proyecto Supabase antes de mergear el código que las requiere.
- [ ] **Variables nuevas**: si el PR introduce env vars, están reflejadas en `.env.example` y en `Build Project` del `deploy.yml`.

## Pre-deploy (post-merge, automático)

- [ ] `Deploy to Hostinger` corre al mergear a `main`.
- [ ] El **preflight FTP** pasa en <60s; si falla, el job aborta sin colgarse 29 min.
- [ ] El **smoke test post-deploy** (curl + `Higo Shop` en HTML) sale ✓.

## Post-deploy (primeros 5–10 min)

- [ ] Abrir `https://higoshop.store` y verificar:
  - [ ] La home (hub) renderiza sin pantalla negra.
  - [ ] El módulo Higo Shop abre el marketplace.
  - [ ] Se puede entrar a una tienda y abrir el carrito.
- [ ] Smoke del flujo de pedido en el rol Cliente:
  - [ ] Crear pedido → estado `PENDING_PRODUCT_PAYMENT`.
  - [ ] Botón "Ya pagué al comercio" funciona.
- [ ] Smoke en el rol Comercio:
  - [ ] La pestaña "Por Validar" lista el pedido.
  - [ ] "Confirmar Pago Recibido" transiciona a `PRODUCT_PAYMENT_VERIFIED`.
- [ ] Smoke en el rol Driver:
  - [ ] El pedido aparece como dispatchable.
  - [ ] El GPS se publica al aceptar la entrega.

## Rollback (si algo se rompe)

1. Identificar el commit malo en `Deploy to Hostinger` (Actions tab).
2. En GitHub: `git revert <sha>` o restore al commit previo en `main`.
3. El push del revert dispara el deploy del estado bueno.
4. **Tiempo objetivo**: <10 min hasta tener prod restaurado.
5. Postmortem: anotar en el PR del revert qué falló y qué control faltó.

## Cuando se sumen al proyecto

- `lint` (ESLint) + `typecheck` + `unit tests` (Vitest) → agregar pasos al
  workflow `ci.yml`.
- E2E smoke (Playwright) post-deploy → workflow nuevo, falla = revert
  automatico.
- Error tracking (Sentry) con release tags → integrar en `main.jsx`.

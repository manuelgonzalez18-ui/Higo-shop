# Release checklist — Gaby Tours

- [ ] Existe al menos un usuario administrador en Supabase Auth.
- [ ] Aplicar migración `20260810000000_operational_hardening.sql`.
- [ ] Verificar que RLS bloquea anon y permite authenticated.
- [ ] Ejecutar `npm test`.
- [ ] Ejecutar `npm run build` con VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY.
- [ ] Probar crear viaje.
- [ ] Probar registrar, editar y eliminar pasajero.
- [ ] Probar pago parcial y saldo pendiente.
- [ ] Probar reordenamiento después de eliminar pasajero.
- [ ] Probar exportación/PDF.
- [ ] Probar instalación web/PWA y APK Android.
- [ ] Confirmar deploy a Hostinger y carga desde móvil.

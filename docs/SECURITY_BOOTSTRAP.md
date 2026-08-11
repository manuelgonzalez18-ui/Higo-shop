# Bootstrap de autenticación

La migración de endurecimiento cambia `viajes`, `pasajeros` y `pagos` a acceso exclusivo del rol `authenticated`.

Antes de aplicarla en producción debe existir por lo menos un usuario administrador en Supabase Auth. La aplicación no incluye registro público: únicamente inicio de sesión con correo y contraseña.

Después de confirmar el primer administrador, aplicar la migración y validar que una sesión anónima no pueda leer ni modificar reservas.

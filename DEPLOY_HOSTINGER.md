# Deploy a Hostinger (higoshop.store)

## 1) Variables de entorno (build)
Define estas variables en el entorno de build de Hostinger (o en `.env.production` local antes de compilar):

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_GOOGLE_MAPS_API_KEY`
- `VITE_GOOGLE_MAPS_ID` (opcional)

## 2) Compilar
```bash
npm ci
npm run build
```

## 3) Publicar carpeta `dist/`
Sube **el contenido** de `dist/` al `public_html` del dominio `higoshop.store`.

## 4) SPA fallback (obligatorio)
Crea `public_html/.htaccess`:

```apache
RewriteEngine On
RewriteBase /
RewriteRule ^index\.html$ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]
```

## 5) Verificación rápida post deploy
- Home carga sin pantalla en blanco.
- Rutas directas como `/orders` y `/orders/<id>` funcionan al recargar.
- Mapa carga (API key válida y referer permitido para `higoshop.store`).
- Realtime: cambia estado desde merchant/driver y verificar actualización en detalle de orden.

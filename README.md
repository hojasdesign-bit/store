# Store · Mercado local de La Habana

Tienda y catálogo de vendedores / actividades y eventos / lugares.
React + Vite, español, móvil primero. Fondo crema #FAF8F3, títulos
serif Fraunces, botones negros. Sin copiar logos de marcas.

## Desarrollo

```bash
npm install
npm run dev
```

## Datos

- Si existen `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` (ver
  `.env.example`), lee `store_sellers`, `store_products`, `store_places`
  y `store_events` por REST desde Supabase (proyecto filmalert).
- Si no hay keys o la lectura falla, usa el seed local de `src/data.js`
  y muestra «Datos demo».
- **Nunca** incluir claves reales en el repo. Solo `.env.example`
  con placeholders.

## Build

```bash
npm run build
```

Destino: Cloudflare Pages, proyecto `store`, repo `hojasdesign-bit/store`.
(No hay commit ni deploy en este paso: solo código local + build.)

## PWA / Play Store

Ver `docs/play-store.md`. Manifest en `public/manifest.webmanifest`,
service worker en `public/sw.js` (solo producción), iconos en
`public/icons/`. Botón «Instalar app» con `beforeinstallprompt`.

## Carrito

Guardado en `localStorage`. «Pedir por WhatsApp» abre `wa.me` con el
texto del pedido. **Demo — sin pago real.**

# Store · Mercado local de La Habana

Tienda y catálogo de vendedores / actividades y eventos / lugares.
React + Vite, español, móvil primero.

## Visualidad

Visualidad **inspirada en Play Store** (layout y componentes tipo
ficha de app: icono cuadrado, desarrollador, estrellas, carruseles,
tabs Para ti / Más vendidos / Nuevos / Categorías, botón verde
«Obtener»), con **marca propia «Store»**.

- Fondo blanco #ffffff / gris #f8f9fa, texto #202124, acento verde
  #01875a. Tipografía sans Roboto / Inter.
- **No** es una app de Google, no usa logo, wordmark ni assets de
  Google, no usa el triángulo de Play ni afirma ser Play Store.
- El logo es propio: texto «Store» + bolsa genérica 🛍️.

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
- Datos del seed sin cambios: precios, ratings, ventas
  (operaciones completadas), asistentes ≤ capacidad.

## Build

```bash
npm run build
```

Destino: Cloudflare Pages, proyecto `store`, repo `hojasdesign-bit/store`.
(No hay commit ni deploy en este paso: solo código local + build.)

## PWA / publicación en Play Store

Ver `docs/play-store.md`. Manifest en `public/manifest.webmanifest`
(theme #01875a, background #ffffff), service worker en `public/sw.js`
(solo producción), iconos en `public/icons/`. Botón «Instalar» con
`beforeinstallprompt`. La publicación en Play Store (vía TWA /
PWABuilder) sigue pendiente; ver la guía.

## Biblioteca

La Biblioteca equivale al carrito: productos obtenidos, guardados en
`localStorage`. «Obtener y pedir por WhatsApp» abre `wa.me` con el
texto del pedido. **Demo — sin pago real.**

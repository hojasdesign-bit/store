# Store · Mercado local de La Habana

Tienda y catálogo de vendedores / actividades y eventos / lugares.
React + Vite, español, móvil primero. **Funcional: crear y gestionar
productos, eventos y lugares.**

## Visualidad

Visualidad **inspirada en Facebook** (layout y patrones: fondo gris,
tarjetas blancas, barra superior, sidebar, feed central, botones
azules), con **marca propia «Store»** (🛍️).

- Fondo #f0f2f5, tarjetas blancas radio 8px, acento azul #1877F2,
  texto #050505 / secundario #65676b. Tipografía sans Inter / Roboto.
- **No** es una app de Facebook: no usa logo «f», wordmark ni assets
  de Facebook, y no afirma ser Facebook. En textos se dice «estilo
  Facebook» como referencia.

## Secciones

- **Inicio (feed):** publicar rápido («¿Qué quieres vender / qué
  evento organizas?»), Marketplace destacado, próximos eventos,
  lugares destacados.
- **Marketplace:** buscador, chips de categorías (Café, Artesanía,
  Plantas, Electrónica, Ropa, Hogar), filtros de precio mín/máx,
  condición (Nuevo/Usado), vendedor y Guardados. Anuncio con foto,
  precio, condición, vendedor. Detalle con Mensaje al vendedor
  (WhatsApp), Guardar, Obtener, Editar y Eliminar.
- **Eventos (estilo Facebook Events):** filtros Próximos, Pasados,
  Mis eventos (RSVP), Que organizo, Todos + buscador. Tarjeta con
  portada, bloque de fecha (mes+día), organizador, fecha/hora, lugar,
  precio, «X van · Y interesados» (interesados = asistentes ×1.6),
  botones Me interesa / Voy (guardados en el dispositivo) y
  Compartir (copia enlace). Detalle con RSVP, Editar y Eliminar.
- **Lugares:** lista con tipo, dirección, horario y rating. Detalle
  con sus eventos y «Crear evento aquí». Crear, Editar y Eliminar.
  Al eliminar un lugar, sus eventos quedan con el lugar en texto
  (no se borran eventos).
- **Vendedores:** perfiles con stats (ventas completadas, canceladas,
  volumen, operaciones) y sus anuncios.
- **Mis publicaciones:** productos/eventos/lugares creados en este
  navegador. Demo: se puede editar/eliminar **cualquier**
  publicación (se indica en la UI).
- **Biblioteca:** carrito con Obtener y pedido por WhatsApp.
  **Demo — sin pago real.**

## CRUD y persistencia

- Formularios de crear/editar con validación (nombre/título, fecha y
  lugar obligatorios en eventos; precio ≥ 0; capacidad > 0; stock ≥ 0).
- Eliminación con confirmación.
- Al crear/editar/eliminar, la UI se actualiza de inmediato
  (optimista) y el cambio se guarda en `localStorage`
  (`store-overrides`: creados/editados/eliminados, `store-mine`:
  ids propios) para que persista sin Supabase.
- Si hay config de Supabase, se intenta la escritura remota
  (`createRow` / `updateRow` / `deleteRow` por REST) sin bloquear la
  UI; si falla (p. ej. RLS), queda guardado en este dispositivo y se
  avisa con un toast.
- Al cargar: Supabase o seed, y luego se aplican los overrides
  (filtrar eliminados, fusionar editados, añadir creados).
- Los RSVP (Me interesa / Voy) y Guardados son solo locales.
- Los nuevos items usan ids `local-<tipo>-<timestamp>`.
- La «condición» (Nuevo/Usado) es solo local: Supabase no tiene esa
  columna, así que no se envía en la escritura remota.

## Datos

- Si existen `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` (ver
  `.env.example`), lee `store_sellers`, `store_products`,
  `store_places` y `store_events` por REST desde Supabase (proyecto
  filmalert). Si no hay keys o la lectura falla, usa el seed local
  de `src/data.js` y muestra «Datos demo».
- **Nunca** incluir claves reales en el repo. Solo `.env.example`
  con placeholders.
- Datos del seed sin cambios: mismos ids (`pr-*`, `ev-*`, `p-*`,
  `s-*`) y mismos números que Supabase.

## Límites

- Sin amigos, notificaciones ni chat real (el «Mensaje al vendedor»
  abre WhatsApp con un texto prefijado).
- Políticas de Supabase actuales: lectura pública (MVP). **Endurecer
  antes de producción**: las escrituras con la anon key pueden ser
  rechazadas por RLS, y no debe exponerse escritura pública en prod.

## Desarrollo / Build

```bash
npm install
npm run dev
npm run build
```

Destino: Cloudflare Pages, proyecto `store`, repo `hojasdesign-bit/store`.
(No hay commit ni deploy en este paso: solo código local + build.)

## PWA

Manifest en `public/manifest.webmanifest` (theme #1877F2, fondo
#f0f2f5), service worker en `public/sw.js` (solo producción),
iconos en `public/icons/`. La app es instalable desde el menú del
navegador.

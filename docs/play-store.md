# Publicar Store en Google Play Store

> Estado: **NO publicada.** La visualidad actual de Store es inspirada en
> Facebook (ya no en Play Store); esta guía solo describe cómo empaquetar
> la PWA como TWA si algún día se quiere publicar en Play.

## Requisitos previos

- Sitio desplegado en HTTPS (Cloudflare Pages, proyecto `store`).
- `public/manifest.webmanifest` válido: name, short_name, display
  `standalone`, theme/background, icon 192 y icon 512 maskable.
- Iconos reales: `public/icons/icon-192.png` e `icon-512.png`
  (en GitHub están como `.base64` por la limitación de texto del conector;
  reconstruir con `base64 -d`).
- Service worker registrado solo en producción (`src/main.jsx`).
- Cuenta de desarrollador Google Play (pago único ~$25 USD).
- Política de privacidad pública (URL) y ficha de tienda.

## Opción A — PWABuilder (recomendada, sin Android Studio)

1. Ve a https://www.pwabuilder.com/ y pega la URL de producción.
2. Revisa el informe (manifest, SW, HTTPS, iconos).
3. «Package for Stores» → Android → descarga el `.aab`.
4. Sube el `.aab` en Google Play Console → Producción → Nueva versión.
5. Completa ficha, clasificación de contenido, privacidad y precios
   (gratis), y envía a revisión.

## Opción B — Bubblewrap (TWA, CLI)

```bash
npm i -g @bubblewrap/cli
bubblewrap init --manifest https://<tu-dominio>/manifest.webmanifest
bubblewrap build
# genera app-release-signed.aab
```

Bubblewrap pide keystore de firma: guárdalo fuera del repo y no lo
subas a GitHub. La primera build genera la clave de firma; consérvala:
sin ella no podrás actualizar la app en Play.

## Verificación TWA (asset links)

Para que la TWA abra sin barra de navegador, el dominio debe servir
`/.well-known/assetlinks.json` con el fingerprint SHA-256 de la clave
de firma. PWABuilder/Bubblewrap generan ese archivo; publícalo en el
sitio (en Cloudflare Pages, como archivo estático en `public/`).

## Notas

- Esta app es **demo sin pago real**: el carrito pide por WhatsApp.
- El CRUD guarda en Supabase cuando hay config y en el dispositivo
  como respaldo; los RSVP y Guardados son solo locales.

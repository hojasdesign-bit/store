# Iconos PWA

Los PNG reales se generan en local y van en el deploy (Cloudflare Pages sube `dist/` con los PNG correctos).

En GitHub, por limitación texto del conector, los iconos están como `.base64`. Para reconstruirlos:

```bash
base64 -d public/icons/icon-192.png.base64 > public/icons/icon-192.png
base64 -d public/icons/icon-512.png.base64 > public/icons/icon-512.png
```

# Salón Unicornio (Unicornia)

Juego web para niños: un unicornio de plastilina en 3D (three.js) que se puede vestir y maquillar.

## Estructura

```
public/                 ← fuente del sitio estático
  index.html            ← juego completo (HTML + CSS + JS en un solo archivo)
  og/                   ← imágenes para vistas previas al compartir (es y en)
  vendor/three.min.js   ← three.js r149, servido localmente (antes venía de jsDelivr)
scripts/build.mjs       ← genera dist/ (lo que se publica): /es, /en y la raíz /
original/
  artifact-snapshot.html ← copia exacta del artifact original de Claude, como referencia
```

`public/index.html` es el mismo código del artifact original. Solo cambian dos cosas: el `<head>` ahora es un documento HTML normal (`lang="es"`, título, fuentes y estilos dentro de `<head>`), y three.js se carga desde `vendor/` en lugar del CDN.

## URLs por idioma

- `/es` y `/en`: el juego fijado a ese idioma, con título, descripción y etiquetas Open Graph en ese idioma (las vistas previas de WhatsApp, etc. salen en el idioma del enlace).
- `/`: lleva las etiquetas en español (idioma por defecto) y redirige al instante a `/es` o `/en` según el idioma del navegador; cualquier otro idioma va a `/es`.
- `public/index.html` sigue siendo la única fuente: `scripts/build.mjs` cambia solo las etiquetas del `<head>` y añade `hreflang`. Si renombras una de esas etiquetas, el build falla en vez de publicar etiquetas viejas.

## Ejecutar en local

```
node scripts/build.mjs && npx serve dist   # como en producción (/, /es, /en)
npx serve public                           # solo el juego, idioma del navegador
```

## Despliegue en Cloudflare Pages

`.github/workflows/deploy.yml` ejecuta `node scripts/build.mjs` (sin dependencias) y publica `dist/` con Wrangler:

- Cada push a `main` se publica en producción: https://unicornia.pages.dev
- Cada pull request recibe su propia URL de vista previa.

Necesita los secretos del repositorio `CLOUDFLARE_API_TOKEN` y `CLOUDFLARE_ACCOUNT_ID`. El proyecto de Pages se crea solo en el primer despliegue.

Para desplegar a mano: `node scripts/build.mjs && npx wrangler pages deploy dist --project-name unicornia`

## Notas

- El estado (apariencia del unicornio, stickers, pestaña activa, silencio) se guarda en `localStorage` con la clave `salon-unicornio-v1`.
- Dependencias externas: solo Google Fonts (Baloo 2, Nunito). Si fallan, se usan fuentes del sistema.

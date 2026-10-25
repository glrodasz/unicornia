# Salón Unicornio (Unicornia)

Juego web para niños: un unicornio de plastilina en 3D (three.js) que se puede vestir y maquillar.

## Estructura

```
public/                 ← sitio estático (directorio de salida para Cloudflare Pages)
  index.html            ← juego completo (HTML + CSS + JS en un solo archivo)
  vendor/three.min.js   ← three.js r149, servido localmente (antes venía de jsDelivr)
original/
  artifact-snapshot.html ← copia exacta del artifact original de Claude, como referencia
```

`public/index.html` es el mismo código del artifact original. Solo cambian dos cosas: el `<head>` ahora es un documento HTML normal (`lang="es"`, título, fuentes y estilos dentro de `<head>`), y three.js se carga desde `vendor/` en lugar del CDN.

## Ejecutar en local

```
npx serve public
```

## Despliegue en Cloudflare Pages

`.github/workflows/deploy.yml` publica `public/` con Wrangler, sin paso de compilación:

- Cada push a `main` se publica en producción: https://unicornia.pages.dev
- Cada pull request recibe su propia URL de vista previa.

Necesita los secretos del repositorio `CLOUDFLARE_API_TOKEN` y `CLOUDFLARE_ACCOUNT_ID`. El proyecto de Pages se crea solo en el primer despliegue.

Para desplegar a mano: `npx wrangler pages deploy public --project-name unicornia`

## Notas

- El estado (apariencia del unicornio, stickers, pestaña activa, silencio) se guarda en `localStorage` con la clave `salon-unicornio-v1`.
- Dependencias externas: solo Google Fonts (Baloo 2, Nunito). Si fallan, se usan fuentes del sistema.

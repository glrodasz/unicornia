// Builds dist/ for Cloudflare Pages from public/ (no dependencies):
//   /    -> dist/index.html  the game pinned to English (the default), English SEO/OG tags;
//           browsers whose first supported language is Spanish are sent to /es before it renders.
//   /es  -> dist/es.html     the game pinned to Spanish, Spanish SEO/OG tags; never redirects.
// Link-preview crawlers don't run JS, so every page carries its tags in the HTML itself.
import { cpSync, readFileSync, rmSync, writeFileSync } from 'node:fs';

const SITE = 'https://unicornia.pages.dev';
const SRC = 'public';
const OUT = 'dist';

const DEFAULT_LANG = 'en';
const COPY = {
  es: {
    path: '/es',
    locale: 'es_ES',
    image: '/og/unicornia.jpg',
    title: 'Unicornia: viste y maquilla a tu unicornio',
    description: 'Unicornia es un juego para niños: viste, peina y maquilla a un unicornio de plastilina en 3D, ponle accesorios y tómale fotos. Gratis, sin anuncios.',
    ogDescription: 'Viste, peina y maquilla a un unicornio de plastilina en 3D. Un juego para niños, gratis y sin anuncios.',
    imageAlt: 'Un unicornio blanco de plastilina con melena arcoíris y cuerno dorado, junto al título Unicornia.',
  },
  en: {
    path: '/',
    locale: 'en_US',
    image: '/og/unicornia-en.jpg', // same picture, English subtitle
    title: 'Unicornia: dress up your unicorn',
    description: 'Unicornia is a game for kids: dress up, style and do the makeup of a 3D clay unicorn, add accessories and take photos. Free, no ads.',
    ogDescription: 'Dress up, style and do the makeup of a 3D clay unicorn. A game for kids, free and with no ads.',
    imageAlt: 'A white clay unicorn with a rainbow mane and a golden horn, next to the Unicornia title.',
  },
};
const LANGS = Object.keys(COPY);

const esc = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

// Replaces exactly one match, so a renamed tag in public/index.html fails the build instead of shipping stale tags.
function replaceOnce(html, re, to) {
  const hits = html.match(new RegExp(re.source, 'g')) || [];
  if (hits.length !== 1) throw new Error(`build: expected 1 match for ${re}, found ${hits.length}`);
  return html.replace(re, to);
}

function localize(html, lang) {
  const c = COPY[lang];
  const url = SITE + c.path;
  const meta = (attr, key, value) => [new RegExp(`<meta ${attr}="${key}" content="[^"]*">`), `<meta ${attr}="${key}" content="${esc(value)}">`];
  const swaps = [
    [/<html lang="[^"]*">/, `<html lang="${lang}" data-lang="${lang}">`],
    [/<title>[^<]*<\/title>/, `<title>${esc(c.title)}</title>`],
    meta('name', 'description', c.description),
    [/<link rel="canonical" href="[^"]*">/, [
      `<link rel="canonical" href="${url}">`,
      ...LANGS.map((l) => `<link rel="alternate" hreflang="${l}" href="${SITE}${COPY[l].path}">`),
      `<link rel="alternate" hreflang="x-default" href="${SITE}${COPY[DEFAULT_LANG].path}">`,
    ].join('\n')],
    [/<meta property="og:locale" content="[^"]*">/, [
      `<meta property="og:locale" content="${c.locale}">`,
      ...LANGS.filter((l) => l !== lang).map((l) => `<meta property="og:locale:alternate" content="${COPY[l].locale}">`),
    ].join('\n')],
    meta('property', 'og:url', url),
    meta('property', 'og:title', c.title),
    meta('property', 'og:description', c.ogDescription),
    meta('property', 'og:image', SITE + c.image),
    meta('property', 'og:image:alt', c.imageAlt),
    meta('name', 'twitter:title', c.title),
    meta('name', 'twitter:description', c.ogDescription),
    meta('name', 'twitter:image', SITE + c.image),
    meta('name', 'twitter:image:alt', c.imageAlt),
  ];
  return swaps.reduce((h, [re, to]) => replaceOnce(h, re, to), html);
}

// Runs right after <meta charset> on the default page, before anything renders.
const REDIRECT = `<script>
(function(){
  var paths=${JSON.stringify(Object.fromEntries(LANGS.map((l) => [l, COPY[l].path])))},list=navigator.languages&&navigator.languages.length?navigator.languages:[navigator.language];
  for(var i=0;i<list.length;i++){var b=String(list[i]||'').toLowerCase().split('-')[0];if(paths[b]){if(b!=='${DEFAULT_LANG}')location.replace(paths[b]+location.search+location.hash);return;}}
})();
</script>`;

const game = readFileSync(`${SRC}/index.html`, 'utf8');
rmSync(OUT, { recursive: true, force: true });
cpSync(SRC, OUT, { recursive: true });
writeFileSync(`${OUT}/index.html`, replaceOnce(localize(game, DEFAULT_LANG), /<meta charset="utf-8">/, `<meta charset="utf-8">\n${REDIRECT}`));
writeFileSync(`${OUT}/es.html`, localize(game, 'es'));
writeFileSync(`${OUT}/_redirects`, ['/es/ /es 301', '/en / 301', '/en/ / 301'].join('\n') + '\n');
console.log(`build: ${OUT}/ with / (${DEFAULT_LANG}) and /es`);

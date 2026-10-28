// Builds dist/ for Cloudflare Pages from public/ (no dependencies):
//   /es  -> dist/es.html  the game pinned to Spanish, Spanish SEO/OG tags
//   /en  -> dist/en.html  the game pinned to English, English SEO/OG tags
//   /    -> dist/index.html  Spanish OG tags (link previews of the bare URL) and an
//           instant redirect to /es or /en by browser language, Spanish by default.
// Link-preview crawlers don't run JS, so every page carries its tags in the HTML itself.
import { cpSync, readFileSync, rmSync, writeFileSync } from 'node:fs';

const SITE = 'https://unicornia.pages.dev';
const SRC = 'public';
const OUT = 'dist';

const COPY = {
  es: {
    locale: 'es_ES',
    image: '/og/unicornia.jpg',
    title: 'Unicornia: viste y maquilla a tu unicornio',
    description: 'Unicornia es un juego para niños: viste, peina y maquilla a un unicornio de plastilina en 3D, ponle accesorios y tómale fotos. Gratis, sin anuncios.',
    ogDescription: 'Viste, peina y maquilla a un unicornio de plastilina en 3D. Un juego para niños, gratis y sin anuncios.',
    imageAlt: 'Un unicornio blanco de plastilina con melena arcoíris y cuerno dorado, junto al título Unicornia.',
  },
  en: {
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

function localize(html, lang, path) {
  const c = COPY[lang];
  const url = SITE + path;
  const meta = (attr, key, value) => [new RegExp(`<meta ${attr}="${key}" content="[^"]*">`), `<meta ${attr}="${key}" content="${esc(value)}">`];
  const swaps = [
    [/<html lang="[^"]*">/, path === '/' ? `<html lang="${lang}">` : `<html lang="${lang}" data-lang="${lang}">`],
    [/<title>[^<]*<\/title>/, `<title>${esc(c.title)}</title>`],
    meta('name', 'description', c.description),
    [/<link rel="canonical" href="[^"]*">/, [
      `<link rel="canonical" href="${url}">`,
      ...LANGS.map((l) => `<link rel="alternate" hreflang="${l}" href="${SITE}/${l}">`),
      `<link rel="alternate" hreflang="x-default" href="${SITE}/">`,
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

// The root page keeps the game's <head> tags (icons, manifest, OG) and nothing else.
function rootPage(game) {
  const head = game.slice(0, game.indexOf('<link rel="preconnect"'));
  if (!head.includes('<meta property="og:title"')) throw new Error('build: OG tags not found before the font preconnect');
  return `${localize(head, 'es', '/')}<style>html,body{margin:0;height:100%;background:#9fdcd0}</style>
<script>
(function(){
  var langs=${JSON.stringify(LANGS)},list=navigator.languages&&navigator.languages.length?navigator.languages:[navigator.language],lang='es';
  for(var i=0;i<list.length;i++){var b=String(list[i]||'').toLowerCase().split('-')[0];if(langs.indexOf(b)>=0){lang=b;break;}}
  location.replace('/'+lang+location.search+location.hash);
})();
</script>
</head>
<body></body>
</html>
`;
}

const game = readFileSync(`${SRC}/index.html`, 'utf8');
rmSync(OUT, { recursive: true, force: true });
cpSync(SRC, OUT, { recursive: true });
for (const lang of LANGS) writeFileSync(`${OUT}/${lang}.html`, localize(game, lang, `/${lang}`));
writeFileSync(`${OUT}/index.html`, rootPage(game));
writeFileSync(`${OUT}/_redirects`, LANGS.map((l) => `/${l}/ /${l} 301`).join('\n') + '\n');
console.log(`build: ${OUT}/ with /, ${LANGS.map((l) => '/' + l).join(', ')}`);

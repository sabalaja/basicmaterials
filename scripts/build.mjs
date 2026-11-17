import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUTPUT = path.join(ROOT, 'dist');
const SITE_URL = (process.env.SITE_URL || 'https://basicmaterials.studio').replace(/\/+$/, '');
const TOKEN_RE = /\{\{\s*([a-zA-Z_][\w.-]*)\s*\}\}/g;
const LOCALES = { pl: 'TLUMACZENIE_POLSKIE', en: 'TLUMACZENIE_ANGIELSKIE' };

function readTsv() {
  const raw = fs.readFileSync(path.join(ROOT, 'translations.tsv'), 'utf8').replace(/^\uFEFF/, '');
  const lines = raw.split(/\r?\n/).filter((line) => line.trim() !== '');
  const names = lines.shift()?.split('\t').map(x => x.trim());
  const expected = ['TOKEN', 'TLUMACZENIE_POLSKIE', 'TLUMACZENIE_ANGIELSKIE'];
  if (JSON.stringify(names) !== JSON.stringify(expected)) {
    throw new Error(`Nagłówki TSV muszą mieć dokładnie: ${expected.join(' | ')}`);
  }
  const entries = { pl: Object.create(null), en: Object.create(null) };

  for (const [i, line] of lines.entries()) {
    const cols = line.split('\t');
    if (cols.length !== 3) {
      throw new Error(`Wiersz TSV ${i + 2}: oczekiwano 3 kolumn rozdzielonych tabulatorami`);
    }
    const [key, polish, english] = cols.map(x => x.trim());
    if (!key || !polish || !english) {
      throw new Error(`Wiersz TSV ${i + 2}: pusty token lub tłumaczenie`);
    }
    if (!/^[a-zA-Z_][\w.-]*$/.test(key)) {
      throw new Error(`Wiersz TSV ${i + 2}: nieprawidłowy token: ${key}`);
    }
    if (Object.hasOwn(entries.pl, key)) {
      throw new Error(`Duplikat tokenu: ${key}`);
    }
    entries.pl[key] = polish;
    entries.en[key] = english;
  }
  return entries;
}

function makeSeo(lang) {
  return [
    `    <link rel="canonical" href="${SITE_URL}/${lang}/" />`,
    `    <link rel="alternate" hreflang="pl" href="${SITE_URL}/pl/" />`,
    `    <link rel="alternate" hreflang="en" href="${SITE_URL}/en/" />`,
    `    <link rel="alternate" hreflang="x-default" href="${SITE_URL}/" />`
  ].join('\n');
}

function safeInlineJson(data) {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

function generateHtml(template, lang, dictionary) {
  const missing = new Set();
  const used = new Set();
  let html = template
    .replaceAll('{{__LANG__}}', lang)
    .replace('<!-- SEO_LINKS -->', makeSeo(lang))
    .replace('<!-- I18N_DICTIONARY -->', safeInlineJson(dictionary));

  html = html.replace(TOKEN_RE, (match, key) => {
    used.add(key);
    if (!Object.hasOwn(dictionary, key)) {
      missing.add(key);
      return match;
    }
    // Escape translation values appropriate to HTML text/attribute contexts.
    return dictionary[key]
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  });

  if (missing.size) {
    throw new Error(`Brak tłumaczeń w ${lang}: ${[...missing].join(', ')}`);
  }
  if (/\{\{[^{}]*\}\}/.test(html)) {
    throw new Error(`Niezastąpione tokeny w ${lang}/index.html`);
  }
  return { html, used };
}

function build() {
  if (!/^https:\/\/[\w.-]+(?::\d+)?(?:\/.*)?$/.test(SITE_URL)) {
    throw new Error('SITE_URL musi być publicznym adresem https://...');
  }

  const translations = readTsv();
  const template = fs.readFileSync(path.join(ROOT, 'index.template.html'), 'utf8');
  if (!template.includes('<!-- SEO_LINKS -->') || !template.includes('<!-- I18N_DICTIONARY -->')) {
    throw new Error('Brakuje znaczników budowania w index.template.html');
  }

  fs.rmSync(OUTPUT, { recursive: true, force: true });
  fs.mkdirSync(OUTPUT, { recursive: true });

  // Pliki istniejącej strony kopiujemy z projektu (nie dostarczono ich w załączniku).
  for (const dir of ['css', 'js', 'assets', 'fonts', 'images', 'videos']) {
    const source = path.join(ROOT, dir);
    if (fs.existsSync(source)) {
      fs.cpSync(source, path.join(OUTPUT, dir), { recursive: true });
    }
  }
  for (const name of ['favicon.ico', 'manifest.webmanifest']) {
    const source = path.join(ROOT, name);
    if (fs.existsSync(source)) {
      fs.copyFileSync(source, path.join(OUTPUT, name));
    }
  }

  // Zapewnij wygenerowane JSON-y również w dist — mogą być przydatne w JS.
  for (const lang of Object.keys(LOCALES)) {
    const prettyJson = JSON.stringify(translations[lang], null, 2) + '\n';
    fs.mkdirSync(path.join(ROOT, 'locales'), { recursive: true });
    fs.mkdirSync(path.join(OUTPUT, 'locales'), { recursive: true });
    fs.writeFileSync(path.join(ROOT, 'locales', `${lang}.json`), prettyJson);
    fs.writeFileSync(path.join(OUTPUT, 'locales', `${lang}.json`), prettyJson);

    const { html } = generateHtml(template, lang, translations[lang]);
    fs.mkdirSync(path.join(OUTPUT, lang), { recursive: true });
    fs.writeFileSync(path.join(OUTPUT, lang, 'index.html'), html);
    console.log(`✓ ${lang}/index.html — ${Object.keys(translations[lang]).length} tłumaczeń`);
  }

  const home = `<!doctype html>
<html lang="en"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Basic Materials — choose language</title>
<link rel="alternate" hreflang="pl" href="${SITE_URL}/pl/" />
<link rel="alternate" hreflang="en" href="${SITE_URL}/en/" />
<link rel="alternate" hreflang="x-default" href="${SITE_URL}/" />
<style>body{font:16px system-ui,sans-serif;margin:10vh auto;padding:20px;max-width:600px}a{color:inherit;margin-right:20px}</style>
<script>
(() => {
  try {
    const saved = localStorage.getItem('basic-materials-language');
    const browser = navigator.language.toLowerCase().startsWith('pl') ? 'pl' : 'en';
    const lang = ['pl', 'en'].includes(saved) ? saved : browser;
    location.replace('/' + lang + '/' + location.hash);
  } catch (_) { location.replace('/en/' + location.hash); }
})();
</script></head><body><main><h1>Basic Materials</h1><p>Choose language / Wybierz język:</p>
<a href="/pl/" lang="pl">Polski</a><a href="/en/" lang="en">English</a></main></body></html>\n`;
  fs.writeFileSync(path.join(OUTPUT, 'index.html'), home);
  fs.writeFileSync(path.join(OUTPUT, 'sitemap.xml'), `<?xml version="1.0" encoding="utf-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${['pl', 'en'].map(lang => `  <url><loc>${SITE_URL}/${lang}/</loc><xhtml:link rel="alternate" hreflang="pl" href="${SITE_URL}/pl/"/><xhtml:link rel="alternate" hreflang="en" href="${SITE_URL}/en/"/></url>`).join('\n')}\n</urlset>\n`);
  fs.writeFileSync(path.join(OUTPUT, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${SITE_URL}/sitemap.xml\n`);

  for (const item of ['css/style.css', 'js/main.js', 'js/products.js', 'js/contact.js', 'js/glitch.js', 'js/legal.js', 'assets/logo.png', 'assets/logo_lime.svg', 'assets/product-3d/product-3d.js']) {
    if (!fs.existsSync(path.join(OUTPUT, item))) {
      console.warn(`! Brak ${item} w zestawie — przenieś swój oryginalny plik do projektu.`);
    }
  }
  console.log('\nGotowe: katalog dist/ zawiera stronę do publikacji.');
}

build();

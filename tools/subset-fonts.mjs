// Сабсет шрифтов до символов, которые реально встречаются на странице (index.html + js/*.js),
// и склейка cyrillic+latin в один woff2 на семейство/начертание. Пишет assets/fonts/*-sub.woff2
// и заменяет @font-face в css/styles.css на блок между /*fonts*/ и /*/fonts*/.
//   node tools/subset-fonts.mjs
import fs from 'node:fs';
import subsetFont from 'subset-font';
const text = [fs.readFileSync('index.html', 'utf8'), ...fs.readdirSync('js').filter((f) => f.endsWith('.js')).map((f) => fs.readFileSync('js/' + f, 'utf8'))].join('');
const chars = new Set([...text.replace(/<[^>]+>/g, ' ')].filter((c) => c.charCodeAt(0) >= 32));
// базовый набор на будущее редактирование текста
for (const c of 'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯабвгдеёжзийклмнопрстуфхцчшщъыьэюяABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,:;!?«»—–-()+№%/·…’“”"\'↺↘→←×✓ ') chars.add(c);
const all = [...chars].join('');
const FACES = [
  ['Prata', 'normal', '400', 'prata-normal-400'],
  ['Manrope', 'normal', '400 700', 'manrope-normal-400'],
  ['Cormorant Infant', 'italic', '500 600', 'cormorant-infant-italic-500', { wght: 500 }],
  ['Caveat', 'normal', '500 600', 'caveat-normal-500', { wght: 540 }],
];
let css = '/*fonts*/\n';
for (const [fam, style, weight, base, axes] of FACES) {
  const parts = ['cyrillic', 'latin'].map((s) => `raw/fonts/${base}-${s}.woff2`);
  // subset-font работает с одним файлом: берём кириллический и латинский сабсеты по отдельности и отдаём оба в одном @font-face через unicode-range не нужно —
  // проще: два сабсета, каждый урезан до используемых символов своего диапазона.
  const out = [];
  for (const p of parts) {
    const buf = await subsetFont(fs.readFileSync(p), all, { targetFormat: 'woff2', preserveNameIds: [1, 2], ...(axes ? { variationAxes: axes } : {}) });
    const name = p.replace('raw/fonts/', 'assets/fonts/').replace('.woff2', '-sub.woff2');
    fs.writeFileSync(name, buf);
    out.push([name, buf.length, p.includes('cyrillic') ? 'U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116' : 'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+20AC, U+2122, U+2190-2193, U+2212, U+2215, U+21BA, U+2198, U+00D7, U+2713, U+FEFF, U+FFFD']);
  }
  for (const [name, , range] of out) css += `@font-face { font-family: '${fam}'; font-style: ${style}; font-weight: ${weight}; font-display: swap; src: url('../${name}') format('woff2'); unicode-range: ${range}; }\n`;
  console.log(fam, out.map(([n, s]) => `${n.split('/').pop()} ${(s / 1024).toFixed(1)}K`).join('  '));
}
css += '/*/fonts*/';
let st = fs.readFileSync('css/styles.css', 'utf8');
if (st.includes('/*fonts*/')) st = st.replace(/\/\*fonts\*\/[\s\S]*?\/\*\/fonts\*\//, css);
else {
  const a = st.indexOf('/* Шрифты Google'), b = st.indexOf('/* Lenis */');
  st = st.slice(0, a) + css + '\n\n' + st.slice(b);
}
fs.writeFileSync('css/styles.css', st, 'utf8');

// Сборка фото сайта: кроп → ресайз → .webp + .jpg в assets/img/<папка>/.
//   node tools/build-assets.mjs [фильтр-по-имени]
// crop — доли исходника [left, top, width, height]; w — ширины на выходе.
// up: true — разрешить увеличение (только hero: исходник 960 px) с лёгкой резкостью.
// Если webp тяжелее jpg — понижаем качество webp, пока он не станет легче (шумные кадры).
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

const YA = (n) => `raw/photos/${n}.jpg`;
const YT = (n) => `raw/yt/${n}.jpg`;
const FULL = [0, 0, 1, 1];

const PLAN = [
  // интерьер
  ['interior/hero',        YA('ya023'), [0, 0.2, 1, 0.47],        [1000, 1600], { up: true }],
  ['interior/hero-m',      YA('ya023'), [0, 0.04, 1, 0.92],       [820]],
  ['interior/window',      YA('ya050'), [0, 0.08, 1, 0.7],        [900, 1300]],
  ['interior/neon',        YA('ya053'), [0, 0, 1, 0.7],           [900, 1300]],
  ['interior/table',       YA('ya006'), [0, 0.04, 1, 0.94],       [900]],
  ['interior/party',       YA('ya036'), FULL,                     [600, 1280]],
  ['interior/hall',        YA('yr02'),  FULL,                     [768]],
  ['interior/flowers',     YA('ya009'), [0, 0.1, 1, 0.75],        [600, 1300]],
  // работы — стол мастерской и сушилка
  ['works/oil-sunset',     YA('ya005'), [0, 0.02, 1, 0.96],       [600, 1200]],
  ['works/acrylic-palms',  YA('ya018'), [0, 0.2, 1, 0.62],        [600, 1400]],
  ['works/relief-mountains', YA('ya022'), [0, 0.22, 1, 0.66],     [600, 960]],
  ['works/watercolor',     YA('ya021'), [0, 0.05, 1, 0.9],        [600, 1400]],
  ['works/plate',          YA('ya051'), [0.08, 0, 0.84, 1],       [600, 1400]],
  ['works/gingerbread',    YA('ya029'), [0, 0.1, 1, 0.8],         [600, 1400]],
  ['works/shopper-dog',    YA('ya034'), [0, 0.06, 1, 0.86],       [600, 1080]],
  ['works/resin',          YA('ya035'), [0.08, 0.06, 0.84, 0.88], [600, 900]],
  ['works/bento',          YA('ya012'), [0, 0.12, 1, 0.66],       [600, 1400]],
  ['works/clay-turtle',    YA('ya007'), FULL,                     [576]],
  ['works/mermaid',        YA('ya040'), [0.17, 0.2, 0.65, 0.66],  [600, 1400]],
  ['works/sailboat',       YA('ya052'), [0, 0.39, 0.6, 0.42],     [600, 1300]],
  ['works/lion',           YA('ya046'), [0, 0.15, 1, 0.72],       [600, 1300]],
  ['works/seascapes',      YA('ya033'), [0, 0.18, 1, 0.82],       [600, 960]],
  ['works/ballerina',      YA('ya043'), [0.08, 0.14, 0.82, 0.6],  [600, 1300]],
  ['works/sails',          YA('ya010'), [0.07, 0.085, 0.84, 0.35], [600, 1400]],
  ['works/toucan',         YA('ya011'), [0.05, 0.1, 0.9, 0.82],   [600, 1400]],
  ['works/portrait',       YA('ya026'), [0, 0.08, 1, 0.84],       [600, 1300]],
  ['works/house',          YA('ya030'), [0.04, 0.36, 0.92, 0.62],       [600, 960]],
  ['works/shopper-dream',  YA('ya042'), [0, 0.04, 1, 0.9],        [600, 1080]],
  ['works/shopper-galaxy', YA('ya020'), [0, 0.04, 1, 0.9],        [600, 1080]],
  ['works/figurines',      YA('ya017'), [0, 0.1, 1, 0.85],        [600, 960]],
  // работы педагога из уроков на YouTube (вырезан только рисунок, без надписей превью)
  ['works/yt-forest',      YT('6n1_UdDwJeE'), [0.023, 0.104, 0.516, 0.69], [600]],
  ['works/yt-sakura',      YT('LG-o4eNmNNs'), [0.025, 0.075, 0.475, 0.83],  [600]],
  ['works/yt-daisies',     YT('_Lg0GYfSiUA'), [0.04, 0.01, 0.47, 0.9],      [600]],
  ['works/yt-sunrise',     YT('xuHM3TgZ0nA'), [0, 0.18, 0.42, 0.82],        [540]],
  ['works/yt-penguin',     YT('rF38a75GXuE'), [0.6, 0, 0.4, 1],             [512]],
  // процесс
  ['process/painting-wall', YA('ya015'), [0, 0.12, 1, 0.82],      [600, 960]],
  ['process/adults-easel',  YA('yr01'),  FULL,                    [576]],
  ['process/kids-table',    YA('ya016'), FULL,                    [600, 1242]],
  ['process/easels',        YA('ya024'), [0, 0.06, 1, 0.9],       [600, 960]],
  ['process/girl-canvas',   YA('ya032'), [0, 0.05, 1, 0.9],       [600, 960]],
  ['process/palette-knife', YA('ya047'), [0, 0.1, 1, 0.75],       [600, 1400]],
  ['process/table-detail',  YA('ya039'), [0.1, 0, 0.8, 1],        [600, 1400]],
  ['process/shopper',       YA('ya003'), [0, 0.06, 1, 0.9],       [600, 960]],
  // праздники и выпускные
  ['events/birthday-cake',  YA('ya025'), [0, 0.12, 1, 0.75],      [600, 1400]],
  ['events/wreaths',        YA('ya037'), FULL,                    [600, 1280]],
  ['events/shoppers-kids',  YA('ya027'), FULL,                    [600, 1280]],
  ['events/adults-works',   YA('ya045'), [0, 0.08, 1, 0.85],      [600, 960]],
  ['events/canvases',       YA('ya048'), FULL,                    [600, 1400]],
];

const only = process.argv[2];
const sizes = fs.existsSync('raw/sizes.json') ? JSON.parse(fs.readFileSync('raw/sizes.json', 'utf8')) : {};
for (const [name, src, crop, widths, opt = {}] of PLAN) {
  if (only && !name.includes(only)) continue;
  fs.mkdirSync(path.dirname(`assets/img/${name}`), { recursive: true });
  const meta = await sharp(src).rotate().toBuffer({ resolveWithObject: true }).then((r) => r.info);
  const [l, t, w, h] = crop;
  const box = { left: Math.round(meta.width * l), top: Math.round(meta.height * t), width: Math.round(meta.width * w), height: Math.round(meta.height * h) };
  box.width = Math.min(box.width, meta.width - box.left); box.height = Math.min(box.height, meta.height - box.top);
  const base = sharp(src).rotate().extract(box);
  for (const W of widths) {
    const tw = opt.up ? W : Math.min(W, box.width);
    const pipe = () => {
      let p = base.clone().resize({ width: tw, withoutEnlargement: !opt.up, kernel: 'lanczos3' });
      if (opt.up) p = p.sharpen({ sigma: 0.8, m1: 0.6, m2: 1.4 });
      // лёгкое тёплое тонирование, чтобы кадры из разных источников жили в одной гамме
      return p.recomb([[1.02, 0.015, 0], [0, 1, 0], [0, 0.01, 0.97]]);
    };
    const suffix = widths.length > 1 ? `-${W}` : '';
    const jpg = await pipe().jpeg({ quality: 78, mozjpeg: true, progressive: true }).toBuffer({ resolveWithObject: true });
    let q = 78, webp;
    do { webp = await pipe().webp({ quality: q, effort: 5 }).toBuffer(); q -= 6; } while (webp.length > jpg.data.length && q > 40);
    fs.writeFileSync(`assets/img/${name}${suffix}.jpg`, jpg.data);
    fs.writeFileSync(`assets/img/${name}${suffix}.webp`, webp);
    sizes[`${name}${suffix}`] = [jpg.info.width, jpg.info.height];
    console.log(`${name}${suffix}`.padEnd(30), `${jpg.info.width}×${jpg.info.height}`, `jpg ${(jpg.data.length / 1024) | 0}К webp ${(webp.length / 1024) | 0}К`);
  }
}
fs.writeFileSync('raw/sizes.json', JSON.stringify(sizes, null, 1));

if (!only || only === 'logo') {
  // Логотип → маска (альфа = «темнота» пикселя): цвет задаётся в CSS через mask-image.
  fs.mkdirSync('assets/img/logo', { recursive: true });
  const src = sharp('raw/logo/ya-avatar.jpg').extract({ left: 40, top: 8, width: 980, height: 980 });
  const alpha = await src.clone().greyscale().negate().linear(1.6, -40).resize(360, 360).raw().toBuffer();
  const rgba = Buffer.alloc(360 * 360 * 4);
  for (let i = 0; i < 360 * 360; i++) { rgba[i * 4] = 7; rgba[i * 4 + 1] = 82; rgba[i * 4 + 2] = 69; rgba[i * 4 + 3] = alpha[i]; }
  await sharp(rgba, { raw: { width: 360, height: 360, channels: 4 } }).png({ compressionLevel: 9, palette: true }).toFile('assets/img/logo/logo.png');
  // Фавиконки: логотип на светлом круге
  for (const s of [32, 180, 512]) {
    const logo = await sharp('assets/img/logo/logo.png').resize(Math.round(s * 0.94)).toBuffer();
    const circle = Buffer.from(`<svg width="${s}" height="${s}"><circle cx="${s / 2}" cy="${s / 2}" r="${s / 2}" fill="#FBF8F2"/></svg>`);
    await sharp(circle).composite([{ input: logo, gravity: 'center' }]).png().toFile(`assets/img/logo/favicon-${s}.png`);
  }
  // Для крошечного фавикона хватит одной монограммы
  const mono = await sharp('raw/logo/ya-avatar.jpg').extract({ left: 300, top: 160, width: 460, height: 460 }).resize(64, 64).png().toBuffer();
  await sharp(Buffer.from('<svg width="64" height="64"><circle cx="32" cy="32" r="32" fill="#FBF8F2"/></svg>')).composite([{ input: mono, blend: 'multiply' }]).png().toFile('assets/img/logo/favicon-64.png');
  console.log('logo + favicons');
  // OG-картинка 1200×630 из кадра hero
  await sharp(YA('ya023')).extract({ left: 0, top: 240, width: 960, height: 504 }).resize(1200, 630).sharpen({ sigma: 0.7 })
    .jpeg({ quality: 82, mozjpeg: true }).toFile('assets/img/og.jpg');
  console.log('og.jpg');
}

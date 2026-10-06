// Самопроверка крайних режимов: reduced-motion и без JS. Ошибки консоли, видимость контента, ширина документа.
//   node tools/check-modes.mjs [port]
import { chromium } from 'playwright-core';
import os from 'node:os'; import path from 'node:path';
const URL = `http://localhost:${process.argv[2] || 8290}/`;
const ctxOpts = (o) => ({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, ...o });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
for (const [name, opts] of [['reduced-motion', { reducedMotion: 'reduce' }], ['no-js', { javaScriptEnabled: false }], ['desktop', { viewport: { width: 1440, height: 900 } }]]) {
  const ctx = await browser.newContext(ctxOpts(opts));
  const page = await ctx.newPage();
  const errs = [];
  page.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
  page.on('pageerror', (e) => errs.push(e.message));
  await page.goto(URL, { waitUntil: 'load' });
  await page.waitForTimeout(3500);
  const r = await page.evaluate(() => {
    const hidden = [...document.querySelectorAll('main h1, main h2, main p, main li, main blockquote, main .item, main .hang')].filter((e) => {
      const s = getComputedStyle(e); return e.offsetParent !== null && (parseFloat(s.opacity) < 0.5 || s.visibility === 'hidden');
    }).map((e) => e.tagName + '.' + e.className).slice(0, 8);
    return { iw: innerWidth, sw: document.documentElement.scrollWidth, hidden, heroOn: document.body.classList.contains('hero-on') };
  });
  await page.screenshot({ path: path.join('raw', `mode-${name}.png`), fullPage: false });
  console.log(name, JSON.stringify(r), errs.length ? 'ERR: ' + errs.join(' | ') : 'без ошибок');
  await ctx.close();
}
await browser.close();

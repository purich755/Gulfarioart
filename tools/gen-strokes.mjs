// Генерирует SVG-спрайт рукотворной графики и вставляет его в index.html между
// <!--sprite--> и <!--/sprite-->:
//   • мазки кистью — залитый контур с переменной толщиной, рваным краем и «сухими» щетинками на хвосте;
//   • акварельные кляксы — пятно с тёмной высохшей каймой и брызгами;
//   • прищепка.
//   node tools/gen-strokes.mjs
import fs from 'node:fs';

const r2 = (n) => Math.round(n * 10) / 10;
function rng(seed) { return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function noise1(rand, n = 64) { const v = Array.from({ length: n + 1 }, () => rand() * 2 - 1); return (x) => { x = ((x % n) + n) % n; const i = Math.floor(x), f = x - i, s = f * f * (3 - 2 * f); return v[i] * (1 - s) + v[i + 1] * s; }; }
const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

function brush({ L, H, T, seed, wave = 0, waves = 1, tilt = 0, start = 0.05, end = 0.22, rough = 1, bristles = 9, holes = 5 }) {
  const rand = rng(seed); const nA = noise1(rand), nB = noise1(rand), nC = noise1(rand), nD = noise1(rand);
  const N = Math.max(60, Math.round(L / 6));
  const cy = (u) => H / 2 + wave * Math.sin(u * Math.PI * waves + 0.4) + tilt * (u - 0.5);
  const th = (u) => T * sstep(0, start, u) * (1 - 0.82 * sstep(1 - end, 1, u)) * (1 + 0.14 * nA(u * 7));
  const top = [], bot = [];
  for (let i = 0; i <= N; i++) {
    const u = i / N, x = u * L, t = th(u) + 0.6;
    top.push([x, cy(u) - t / 2 + rough * T * 0.05 * nB(u * 31) + rough * T * 0.025 * nC(u * 90)]);
    bot.push([x, cy(u) + t / 2 + rough * T * 0.07 * nD(u * 27) - rough * T * 0.02 * nC(u * 70 + 9)]);
  }
  // мягкое «набранное краской» начало — полукруг
  const capR = T * 0.5, c0 = cy(0.012);
  const cap = []; for (let a = 90; a <= 270; a += 18) { const r = capR * (0.9 + 0.12 * rand()); cap.push([capR * 0.9 + Math.cos((a * Math.PI) / 180) * r, c0 - Math.sin((a * Math.PI) / 180) * r]); }
  // рваный хвост: несколько зубцов между верхом и низом
  const tail = []; const ty0 = top[N][1], ty1 = bot[N][1];
  for (let k = 1; k < 5; k++) { const yy = ty0 + ((ty1 - ty0) * k) / 5; tail.push([L - rand() * T * 0.9, yy], [L - rand() * T * 0.2, yy + (ty1 - ty0) / 10]); }
  const body = [...cap.reverse(), ...top.slice(1), ...tail, ...bot.reverse()];
  let d = 'M' + body.map(([x, y]) => `${r2(x)} ${r2(y)}`).join('L') + 'Z';
  // щетинки, вылетающие за хвост
  for (let b = 0; b < bristles; b++) {
    const o = (rand() - 0.5) * 0.8, u0 = 0.62 + rand() * 0.28, u1 = Math.min(1.04, u0 + 0.08 + rand() * 0.24), w = T * (0.03 + rand() * 0.06);
    const pts = [], back = [];
    for (let s = 0; s <= 10; s++) { const u = u0 + ((u1 - u0) * s) / 10, ww = w * Math.sin((s / 10) * Math.PI) + 0.2; const y = cy(u) + o * th(u0) * 1.1; pts.push([u * L, y - ww / 2]); back.push([u * L, y + ww / 2]); }
    d += 'M' + [...pts, ...back.reverse()].map(([x, y]) => `${r2(x)} ${r2(y)}`).join('L') + 'Z';
  }
  // «сухие» просветы внутри тела (evenodd вырежет их)
  for (let h = 0; h < holes; h++) {
    const o = (rand() - 0.5) * 0.55, u0 = 0.35 + rand() * 0.5, u1 = Math.min(0.97, u0 + 0.05 + rand() * 0.16), w = T * (0.025 + rand() * 0.04);
    const pts = [], back = [];
    for (let s = 0; s <= 8; s++) { const u = u0 + ((u1 - u0) * s) / 8, ww = w * Math.sin((s / 8) * Math.PI) + 0.1; const y = cy(u) + o * th(u); pts.push([u * L, y - ww / 2]); back.push([u * L, y + ww / 2]); }
    d += 'M' + [...pts, ...back.reverse()].map(([x, y]) => `${r2(x)} ${r2(y)}`).join('L') + 'Z';
  }
  return d;
}

function blot({ R, seed, drops = 4, lobes = 1 }) {
  const rand = rng(seed); const n = noise1(rand, 32), m = noise1(rand, 32);
  const S = R * 2.6, c = S / 2;
  const shape = (scale, phase) => {
    const P = 72; const pts = [];
    for (let i = 0; i < P; i++) {
      const a = (i / P) * Math.PI * 2;
      const rr = R * scale * (1 + 0.22 * n((i / P) * 9 + phase) + 0.08 * m((i / P) * 31) + 0.18 * lobes * Math.sin(a * 2 + seed));
      pts.push([c + Math.cos(a) * rr, c + Math.sin(a) * rr * 0.86]);
    }
    // сглаживание: квадратичные кривые через середины
    let d = '';
    for (let i = 0; i < P; i++) { const p = pts[i], q = pts[(i + 1) % P]; const mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2; d += (i ? 'Q' : `M${r2((pts[P - 1][0] + p[0]) / 2)} ${r2((pts[P - 1][1] + p[1]) / 2)}Q`) + `${r2(p[0])} ${r2(p[1])} ${r2(mx)} ${r2(my)}`; }
    return d + 'Z';
  };
  let dropsD = '';
  for (let k = 0; k < drops; k++) {
    const a = rand() * Math.PI * 2, dist = R * (1.15 + rand() * 0.2), r = R * (0.03 + rand() * 0.07);
    const x = c + Math.cos(a) * dist, y = c + Math.sin(a) * dist * 0.86;
    dropsD += `M${r2(x - r)} ${r2(y)}a${r2(r)} ${r2(r * 0.9)} 0 1 0 ${r2(r * 2)} 0a${r2(r)} ${r2(r * 0.9)} 0 1 0 ${r2(-r * 2)} 0Z`;
  }
  return { S, outer: shape(1, 0), inner: shape(0.62, 3.3), drops: dropsD };
}

const sym = [];
const strokes = {
  'st-under': { L: 600, H: 48, T: 21, seed: 11, wave: 3, tilt: -6 },
  'st-under2': { L: 600, H: 48, T: 18, seed: 23, wave: 4, waves: 2, tilt: 4 },
  'st-dab': { L: 340, H: 96, T: 64, seed: 5, wave: 4, tilt: -8, bristles: 12 },
  'st-long': { L: 1600, H: 70, T: 24, seed: 41, wave: 9, waves: 3, bristles: 14, holes: 9, end: 0.12 },
  'st-swatch': { L: 420, H: 130, T: 100, seed: 77, wave: 3, tilt: 6, bristles: 14, holes: 8, end: 0.16 },
  'st-band': { L: 520, H: 140, T: 112, seed: 91, wave: 3, tilt: 5, bristles: 12, holes: 0, end: 0.1, start: 0.04 },
  'st-thin': { L: 800, H: 26, T: 8, seed: 3, wave: 2, waves: 2, bristles: 4, holes: 0, rough: 0.6 },
};
for (const [id, o] of Object.entries(strokes)) {
  sym.push(`<symbol id="${id}" viewBox="0 0 ${o.L} ${o.H}" preserveAspectRatio="none"><path fill="currentColor" fill-rule="${o.holes === 0 ? 'nonzero' : 'evenodd'}" d="${brush(o)}"/></symbol>`);
}
[[1, 60, 5, 1], [2, 60, 3, 0.6], [3, 60, 6, 1.2]].forEach(([i, R, drops, lobes]) => {
  const b = blot({ R, seed: i * 97, drops, lobes });
  sym.push(`<symbol id="blot-${i}" viewBox="0 0 ${r2(b.S)} ${r2(b.S)}"><path d="${b.outer}" fill="currentColor" fill-opacity=".34" stroke="currentColor" stroke-opacity=".55" stroke-width="2.2"/><path d="${b.inner}" fill="currentColor" fill-opacity=".16"/><path d="${b.drops}" fill="currentColor" fill-opacity=".45"/></symbol>`);
});
// прищепка: две деревянные половинки и пружинка
sym.push(`<symbol id="clothespin" viewBox="0 0 18 52"><rect x="2" y="0" width="7" height="50" rx="2.5" fill="#D9B98A"/><rect x="9" y="0" width="7" height="50" rx="2.5" fill="#CDA875"/><rect x="2" y="0" width="14" height="50" rx="3" fill="none" stroke="#9C7A4C" stroke-opacity=".45"/><path d="M3 15h12M3 19h12" stroke="#8D8F92" stroke-width="2.2" stroke-linecap="round"/><circle cx="9" cy="17" r="3.2" fill="none" stroke="#7E8084" stroke-width="1.6"/><path d="M5 30l2 1M11 36l2 1" stroke="#9C7A4C" stroke-opacity=".5"/></symbol>`);

const sprite = `<svg class="sprite" aria-hidden="true" focusable="false" width="0" height="0" style="position:absolute">${sym.join('')}</svg>`;
const file = 'index.html';
const html = fs.readFileSync(file, 'utf8');
const out = html.replace(/<!--sprite-->[\s\S]*?<!--\/sprite-->/, () => `<!--sprite-->${sprite}<!--/sprite-->`);
fs.writeFileSync(file, out, 'utf8');
console.log('sprite', (sprite.length / 1024).toFixed(1), 'KB', out === html ? '(без изменений)' : '');

/* Hero «Белый лист»: курсор/палец акварельными пятнами проявляет сквозь бумагу фото мастерской.
   Три холста: mask (накопление «воды» — где проявилось фото), tint (краска с тёмной высохшей каймой),
   видимый paint = фото × tint (multiply) ∩ mask. Перерисовка — только когда что-то изменилось. */
(window.GF_MODS = window.GF_MODS || []).push(['hero-paint', (GF) => {
  const hero = document.querySelector('.hero');
  const canvas = hero && hero.querySelector('.hero-canvas');
  const img = hero && hero.querySelector('.hero-photo img');
  if (!canvas || !img || !canvas.getContext) return;
  const clearBtn = hero.querySelector('.hero-clear');
  const ctx = canvas.getContext('2d');
  const mk = () => { const c = document.createElement('canvas'); return [c, c.getContext('2d')]; };
  const [mask, mctx] = mk(), [tint, tctx] = mk(), [photo, pctx] = mk();
  const root = document.documentElement;

  const PAINTS = [[44, 71, 166], [215, 163, 63], [47, 122, 104], [226, 88, 47], [201, 86, 108]]; // ультрамарин → охра → изумруд → кадмий → краплак
  let paintIdx = 0, paintTime = 0;
  const setBrush = () => root.style.setProperty('--brush', `rgb(${PAINTS[paintIdx].join(',')})`);
  setBrush();

  let W = 0, H = 0, dpr = 1, heroTop = 0, dirty = false, visible = true, ready = false, hasPaint = false;
  let veil = null;

  // ── размеры ──
  function cover() {
    const iw = img.naturalWidth, ih = img.naturalHeight, cw = canvas.width, ch = canvas.height;
    const s = Math.max(cw / iw, ch / ih), w = iw * s, h = ih * s;
    return [(cw - w) * 0.62, (ch - h) * 0.5, w, h]; // как object-position: 62% 50%
  }
  function buildVeil() {
    // под текстом фото проявляется мягче: зона заголовка и подзаголовка «выбеливается»
    const box = hero.querySelector('.hero-in').getBoundingClientRect();
    const hr = hero.getBoundingClientRect();
    const cx = (box.left - hr.left + Math.min(box.width, W * 0.62) * 0.42) * dpr;
    const cy = (box.top - hr.top + box.height * 0.5) * dpr;
    const rx = Math.min(box.width, W * 0.7) * 0.72 * dpr, ry = box.height * 0.7 * dpr;
    veil = { cx, cy, rx, ry, a: W < 700 ? 0.72 : 0.62 };
  }
  function resize() {
    const nw = hero.clientWidth, nh = hero.clientHeight;
    if (!nw || !nh) return;
    const keepM = W && mask.width ? copyOf(mask) : null, keepT = W && tint.width ? copyOf(tint) : null;
    W = nw; H = nh; dpr = Math.min(2, window.devicePixelRatio || 1);
    heroTop = hero.getBoundingClientRect().top + window.scrollY;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    mask.width = tint.width = W; mask.height = tint.height = H;
    if (keepM) { mctx.drawImage(keepM, 0, 0, W, H); tctx.drawImage(keepT, 0, 0, W, H); }
    if (ready) { photo.width = canvas.width; photo.height = canvas.height; const [x, y, w, h] = cover(); pctx.drawImage(img, x, y, w, h); }
    buildVeil();
    dirty = true;
  }
  const copyOf = (c) => { const [n, nc] = mk(); n.width = c.width; n.height = c.height; nc.drawImage(c, 0, 0); return n; };

  // ── акварельная капля ──
  function blobPath(c, r, rnd) {
    const N = 22, p1 = rnd() * 6.28, p2 = rnd() * 6.28, k1 = 0.1 + rnd() * 0.12, k2 = 0.05 + rnd() * 0.08;
    c.beginPath();
    for (let i = 0; i <= N; i++) {
      const a = (i / N) * Math.PI * 2;
      const rr = r * (1 + k1 * Math.sin(a * 3 + p1) + k2 * Math.sin(a * 5 + p2) + (rnd() - 0.5) * 0.09);
      const x = Math.cos(a) * rr, y = Math.sin(a) * rr;
      i ? c.lineTo(x, y) : c.moveTo(x, y);
    }
    c.closePath();
  }
  function dab(x, y, r, alpha, angle, stretch) {
    const [cr, cg, cb] = PAINTS[paintIdx];
    const rnd = Math.random;
    for (const [c, isMask] of [[mctx, true], [tctx, false]]) {
      c.save();
      c.translate(x, y); c.rotate(angle); c.scale(stretch, 1 / Math.sqrt(stretch));
      blobPath(c, r, rnd);
      const g = c.createRadialGradient(0, 0, 0, 0, 0, r * 1.12);
      if (isMask) {
        g.addColorStop(0, `rgba(0,0,0,${alpha})`); g.addColorStop(0.72, `rgba(0,0,0,${alpha * 0.85})`); g.addColorStop(1, 'rgba(0,0,0,0)');
      } else {
        // краска стекает к краю пятна — кайма темнее, как у высохшей акварели
        g.addColorStop(0, `rgba(${cr},${cg},${cb},${alpha * 0.32})`); g.addColorStop(0.7, `rgba(${cr},${cg},${cb},${alpha * 0.6})`);
        g.addColorStop(0.9, `rgba(${cr},${cg},${cb},${alpha * 1.15})`); g.addColorStop(1, `rgba(${cr},${cg},${cb},0)`);
      }
      c.fillStyle = g; c.fill();
      c.restore();
    }
    // изредка — брызги
    if (Math.random() < 0.05) {
      const a = Math.random() * 6.28, d = r * (1.1 + Math.random() * 0.5), rr = 2 + Math.random() * 4;
      mctx.beginPath(); mctx.arc(x + Math.cos(a) * d, y + Math.sin(a) * d, rr, 0, 6.28); mctx.fillStyle = 'rgba(0,0,0,.5)'; mctx.fill();
      tctx.beginPath(); tctx.arc(x + Math.cos(a) * d, y + Math.sin(a) * d, rr, 0, 6.28); tctx.fillStyle = `rgba(${PAINTS[paintIdx].join(',')},.25)`; tctx.fill();
    }
    dirty = true;
    if (!hasPaint) { hasPaint = true; if (clearBtn) clearBtn.hidden = false; }
  }

  // мазок между двумя точками: быстрее — тоньше и длиннее
  const sizeK = () => (W < 700 ? 0.68 : 1);
  function strokeSeg(x0, y0, x1, y1, dt) {
    const dx = x1 - x0, dy = y1 - y0, d = Math.hypot(dx, dy);
    if (d < 0.5) return;
    const v = (d / Math.max(dt, 8)) * 16; // px за кадр
    const wob = 0.78 + 0.3 * Math.sin(paintTime / 170) + 0.12 * Math.sin(paintTime / 53); // толщина «дышит» вдоль мазка
    const r = Math.max(40, Math.min(110, 110 - v * 1.5)) * sizeK() * wob;
    const stretch = 1 + Math.min(v / 28, 1.3), angle = Math.atan2(dy, dx);
    const n = Math.max(3, Math.min(14, Math.ceil(d / (r * 0.45))));
    for (let i = 1; i <= n; i++) {
      const t = i / n, j = r * 0.16;
      dab(x0 + dx * t + (Math.random() - 0.5) * j, y0 + dy * t + (Math.random() - 0.5) * j, r * (0.65 + Math.random() * 0.6), 0.07 + Math.random() * 0.12, angle, stretch * (0.85 + Math.random() * 0.3));
    }
    paintTime += Math.min(dt, 50);
    const idx = Math.floor(paintTime / 1200) % PAINTS.length;
    if (idx !== paintIdx) { paintIdx = idx; setBrush(); }
  }

  // ── композиция кадра ──
  function render() {
    dirty = false;
    const cw = canvas.width, ch = canvas.height;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
    ctx.clearRect(0, 0, cw, ch);
    if (!hasPaint) return;
    ctx.drawImage(photo, 0, 0);
    ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = 0.62;
    ctx.drawImage(tint, 0, 0, cw, ch);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'destination-in';
    ctx.drawImage(mask, 0, 0, cw, ch);
    if (veil) {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.save(); ctx.translate(veil.cx, veil.cy); ctx.scale(veil.rx / veil.ry, 1);
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, veil.ry);
      g.addColorStop(0, `rgba(0,0,0,${veil.a})`); g.addColorStop(0.65, `rgba(0,0,0,${veil.a * 0.75})`); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.fillRect(-veil.ry * 2, -veil.ry * 2, veil.ry * 4, veil.ry * 4);
      ctx.restore();
    }
    ctx.globalCompositeOperation = 'source-over';
  }

  // ── ввод ──
  const queue = [];
  let last = null, lastInput = performance.now(), auto = null, autoRuns = 0, down = false;
  const pt = (e) => ({ x: e.clientX, y: e.clientY + window.scrollY - heroTop, t: performance.now() });
  hero.addEventListener('pointermove', (e) => {
    if (!ready || e.target.closest('.hdr, .hero-clear')) return;
    if (e.pointerType !== 'mouse' && !down) return;
    lastInput = performance.now();
    if (auto) auto = null;
    queue.push(pt(e));
  }, { passive: true });
  hero.addEventListener('pointerdown', (e) => {
    if (!ready || e.target.closest('a, button')) return;
    down = true; lastInput = performance.now(); auto = null;
    const p = pt(e); last = p;
    // тап — небольшая клякса
    const r = 70 * sizeK();
    for (let i = 0; i < 4; i++) dab(p.x + (Math.random() - 0.5) * r * 0.5, p.y + (Math.random() - 0.5) * r * 0.5, r * (0.7 + Math.random() * 0.4), 0.12 + Math.random() * 0.1, Math.random() * 6, 1);
  });
  const lift = () => { down = false; last = null; };
  hero.addEventListener('pointerup', lift);
  hero.addEventListener('pointercancel', lift);
  hero.addEventListener('pointerleave', lift);

  // ── автоподсказка: три S-образных мазка справа ──
  function sCurves() {
    const out = [], x0 = W * (W < 700 ? 0.2 : 0.58), w = W * (W < 700 ? 0.7 : 0.36);
    for (let k = 0; k < 3; k++) {
      const y0 = H * (0.2 + k * 0.19) + (Math.random() - 0.5) * 24;
      out.push([[x0 + (Math.random() - 0.5) * 40, y0], [x0 + w * 0.5, y0 - H * 0.1], [x0 + w * 0.45, y0 + H * 0.12], [x0 + w, y0 + 8]]);
    }
    return out;
  }
  const bez = (p, t) => { const u = 1 - t; return [0, 1].map((i) => u * u * u * p[0][i] + 3 * u * u * t * p[1][i] + 3 * u * t * t * p[2][i] + t * t * t * p[3][i]); };
  function startAuto() { auto = { curves: sCurves(), k: 0, t: 0, prev: null, start: performance.now() }; autoRuns++; }
  function stepAuto(now, dt) {
    const a = auto, c = a.curves[a.k];
    a.t = Math.min(1, a.t + dt / 780);
    const [x, y] = bez(c, a.t);
    if (a.prev) strokeSeg(a.prev[0], a.prev[1], x, y, 22);
    a.prev = [x, y];
    if (a.t >= 1) { a.k++; a.t = 0; a.prev = null; if (a.k >= a.curves.length) auto = null; }
  }

  // ── цикл ──
  let prevT = performance.now(), raf = 0;
  function loop(now) {
    raf = 0;
    const dt = Math.min(64, now - prevT); prevT = now;
    while (queue.length) {
      const p = queue.shift();
      if (last) strokeSeg(last.x, last.y, p.x, p.y, p.t - last.t);
      last = p;
    }
    if (auto) stepAuto(now, dt);
    else if (!GF.reduced && autoRuns < 2 && now - lastInput > 4500) { startAuto(); lastInput = now; }
    if (dirty) render();
    schedule();
  }
  const schedule = () => { if (!raf && visible && !document.hidden && ready) raf = requestAnimationFrame(loop); };
  new IntersectionObserver((ents) => { visible = ents[0].isIntersecting; if (visible) { prevT = performance.now(); schedule(); } }).observe(hero);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) { prevT = performance.now(); lastInput = performance.now(); schedule(); } });

  // ── чистый лист ──
  if (clearBtn) clearBtn.addEventListener('click', () => {
    const wipe = () => {
      mctx.clearRect(0, 0, W, H); tctx.clearRect(0, 0, W, H);
      hasPaint = false; clearBtn.hidden = true; autoRuns = Math.min(autoRuns, 1); lastInput = performance.now();
      render(); canvas.style.opacity = '';
    };
    if (window.gsap && !GF.reduced) gsap.to(canvas, { opacity: 0, duration: 0.6, ease: 'power1.out', onComplete: wipe });
    else wipe();
  });

  let rt = 0;
  window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { resize(); schedule(); }, 120); });

  // ── старт, когда фото декодировано ──
  const start = () => {
    ready = true;
    resize();
    document.body.classList.add('hero-on');
    if (GF.reduced) {
      // без анимации: фото сразу проявлено по трём заранее заданным мазкам
      for (const c of sCurves()) { let prev = null; for (let t = 0; t <= 1.0001; t += 0.04) { const p = bez(c, t); if (prev) strokeSeg(prev[0], prev[1], p[0], p[1], 22); prev = p; } }
      render();
    }
    lastInput = performance.now() - 2400; // первая подсказка — примерно через 2 с после вступления
    schedule();
  };
  const go = () => (img.decode ? img.decode().catch(() => {}) : Promise.resolve()).then(() => { if (img.naturalWidth) start(); });
  if (img.complete && img.naturalWidth) go(); else img.addEventListener('load', go, { once: true });
  window.addEventListener('load', () => buildVeil(), { once: true });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { buildVeil(); dirty = true; });
}]);

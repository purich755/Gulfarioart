/* «От наброска к картине»: из реальной работы один раз генерируется карандашный набросок
   (grayscale → Собель → инверсия → штриховка в тенях → бумага), слева набросок, справа цвет.
   Ручка-кисть тянется мышью/пальцем/стрелками; при первом появлении сама съезжает 50 → 30 → 50. */
(window.GF_MODS = window.GF_MODS || []).push(['sketch-slider', (GF) => {
  const fig = document.querySelector('[data-compare]');
  if (!fig) return;
  const stage = fig.querySelector('.compare-stage');
  const img = fig.querySelector('.compare-color img');
  const cv = fig.querySelector('.compare-sketch');
  const handle = fig.querySelector('.compare-handle');
  const state = { pos: 50 };

  const apply = () => {
    const p = Math.max(0, Math.min(100, state.pos));
    stage.style.setProperty('--pos', p + '%');
    handle.setAttribute('aria-valuenow', String(Math.round(p)));
    handle.setAttribute('aria-valuetext', `${Math.round(p)}% — набросок слева, цвет справа`);
  };
  apply();

  // ── генерация наброска ──
  function sketch() {
    const W = 720, H = Math.round((W * img.naturalHeight) / img.naturalWidth);
    cv.width = W; cv.height = H;
    const c = cv.getContext('2d', { willReadFrequently: true });
    c.drawImage(img, 0, 0, W, H);
    let data;
    try { data = c.getImageData(0, 0, W, H); }
    catch (e) {
      // file:// или чужой домен: холст «испорчен» — рисуем упрощённый карандашный вариант фильтрами
      c.clearRect(0, 0, W, H);
      c.fillStyle = '#F6F1E8'; c.fillRect(0, 0, W, H);
      c.filter = 'grayscale(1) contrast(1.9) brightness(1.35)';
      c.globalCompositeOperation = 'multiply';
      c.drawImage(img, 0, 0, W, H);
      c.filter = 'none'; c.globalCompositeOperation = 'source-over';
      return;
    }
    const d = data.data, n = W * H;
    const g = new Float32Array(n), b = new Float32Array(n);
    for (let i = 0; i < n; i++) g[i] = d[i * 4] * 0.299 + d[i * 4 + 1] * 0.587 + d[i * 4 + 2] * 0.114;
    // размытие 3×3
    for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
      const i = y * W + x;
      b[i] = (g[i - W - 1] + g[i - W] + g[i - W + 1] + g[i - 1] + g[i] * 2 + g[i + 1] + g[i + W - 1] + g[i + W] + g[i + W + 1]) / 10;
    }
    let seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = y * W + x;
      let v = 255;
      if (x > 0 && y > 0 && x < W - 1 && y < H - 1) {
        const gx = -b[i - W - 1] - 2 * b[i - 1] - b[i + W - 1] + b[i - W + 1] + 2 * b[i + 1] + b[i + W + 1];
        const gy = -b[i - W - 1] - 2 * b[i - W] - b[i - W + 1] + b[i + W - 1] + 2 * b[i + W] + b[i + W + 1];
        const mag = Math.sqrt(gx * gx + gy * gy);
        v = 255 - Math.min(255, Math.pow(mag / 255, 0.9) * 420);
      }
      const lum = b[i] || g[i];
      // штриховка в тенях: диагонали, в глубоких тенях — перекрёстная
      if (lum < 125 && (x + y) % 6 === 0) v -= 46 * (1 - lum / 125);
      if (lum < 70 && (x - y + 4000) % 8 === 0) v -= 40 * (1 - lum / 70);
      v = v * 0.86 + lum * 0.14 + (rnd() - 0.5) * 12; // подтон исходника 14% + зерно бумаги
      const t = Math.max(0, Math.min(255, v)) / 255;
      d[i * 4] = 50 + t * 196; d[i * 4 + 1] = 46 + t * 195; d[i * 4 + 2] = 42 + t * 190; d[i * 4 + 3] = 255;
    }
    c.putImageData(data, 0, 0);
  }

  let made = false;
  const make = () => {
    if (made) return; made = true;
    const run = () => { try { sketch(); } catch (e) { console.error('[gulfario] набросок:', e); fig.classList.add('no-sketch'); } };
    if (img.complete && img.naturalWidth) run(); else img.addEventListener('load', run, { once: true });
  };
  // картинка в этой секции ленивая — подталкиваем загрузку заранее
  new IntersectionObserver((ents, io) => {
    if (!ents[0].isIntersecting) return;
    io.disconnect(); img.loading = 'eager'; make();
  }, { rootMargin: '700px 0px' }).observe(stage);

  // ── перетаскивание ──
  let dragging = false;
  const fromEvent = (e) => { const r = stage.getBoundingClientRect(); state.pos = ((e.clientX - r.left) / r.width) * 100; apply(); };
  stage.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    dragging = true; gsap.killTweensOf(state); fromEvent(e);
    if (e.pointerType === 'mouse') e.preventDefault();
  });
  window.addEventListener('pointermove', (e) => { if (dragging) fromEvent(e); }, { passive: true });
  window.addEventListener('pointerup', () => (dragging = false));
  window.addEventListener('pointercancel', () => (dragging = false));
  handle.addEventListener('keydown', (e) => {
    const k = { ArrowLeft: -5, ArrowDown: -5, ArrowRight: 5, ArrowUp: 5, PageDown: -20, PageUp: 20 }[e.key];
    if (k) { state.pos = Math.max(0, Math.min(100, state.pos + k)); }
    else if (e.key === 'Home') state.pos = 0;
    else if (e.key === 'End') state.pos = 100;
    else return;
    e.preventDefault(); gsap.killTweensOf(state); apply();
  });

  // ── подсказка при первом появлении ──
  if (!GF.reduced) {
    ScrollTrigger.create({
      trigger: stage, start: 'top 60%', once: true,
      onEnter: () => gsap.to(state, { pos: 30, duration: 1.1, ease: 'sine.inOut', yoyo: true, repeat: 1, delay: 0.5, onUpdate: apply }),
    });
  }
}]);

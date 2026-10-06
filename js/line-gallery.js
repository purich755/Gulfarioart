/* Сушилка: две верёвки с работами на прищепках. Ряд тянется мышью/пальцем (Draggable + инерция),
   при скролле ряды едут с разной скоростью, фото покачиваются вокруг прищепки (пружина от скорости).
   Клик — лайтбокс «Выставка»: FLIP из миниатюры, паспарту, этикетка, стрелки/свайп/клавиши. */
(window.GF_MODS = window.GF_MODS || []).push(['line-gallery', (GF) => {
  const sec = document.querySelector('[data-lines]');
  if (!sec) return;
  const lines = [...sec.querySelectorAll('.line')];
  const allBtns = [...sec.querySelectorAll('.hang-btn')].sort((a, b) => a.dataset.i - b.dataset.i);

  // ── верёвка: провисает между невидимыми гвоздями каждые ~640 px ──
  const SPAN = 640, SAG = 26, TOP = 14;
  const ropeY = (x) => TOP + SAG * Math.abs(Math.sin((Math.PI * x) / SPAN));
  function layout(line) {
    const track = line.querySelector('.line-track');
    const hangs = [...track.querySelectorAll('.hang')];
    const w = track.scrollWidth;
    const path = track.querySelector('.rope path'), svg = track.querySelector('.rope');
    svg.setAttribute('viewBox', `0 0 ${w} 120`); svg.style.width = w + 'px';
    let d = '';
    for (let x = 0; x <= w; x += 16) d += (x ? 'L' : 'M') + x + ' ' + ropeY(x).toFixed(1);
    path.setAttribute('d', d);
    hangs.forEach((h) => {
      const cx = h.offsetLeft + h.offsetWidth / 2;
      h.style.setProperty('--sag', (ropeY(cx) - TOP).toFixed(1) + 'px');
    });
    return w;
  }

  const rows = lines.map((line, r) => {
    const track = line.querySelector('.line-track');
    const par = line.querySelector('.line-par');
    const hangs = [...track.querySelectorAll('.hang')];
    const row = { line, track, par, hangs, w: layout(line), drag: null, prevX: 0, prevV: 0, ang: hangs.map(() => 0), vel: hangs.map(() => 0), set: hangs.map((h) => gsap.quickSetter(h, 'rotation', 'deg')), sign: hangs.map((_, i) => (i % 2 ? 1 : -0.8)) };
    if (window.Draggable) {
      row.drag = Draggable.create(track, {
        type: 'x', inertia: !!window.InertiaPlugin, edgeResistance: 0.75, dragClickables: true, minimumMovement: 6, allowNativeTouchScrolling: true,
        bounds: { minX: Math.min(0, line.clientWidth - row.w), maxX: 0 },
        onPress() { row.dragged = false; },
        onDragStart() { row.dragged = true; },
      })[0];
      // стартовое смещение второго ряда — чтобы ряды не начинались одинаково
      if (r === 1) gsap.set(track, { x: Math.max(line.clientWidth - row.w, -160) });
    }
    // параллакс по X при общем скролле (не на reduced)
    if (!GF.reduced) {
      const amp = r ? -70 : 90;
      gsap.fromTo(par, { x: amp }, { x: -amp, ease: 'none', scrollTrigger: { trigger: line, start: 'top bottom', end: 'bottom top', scrub: true } });
    }
    row.prevX = gsap.getProperty(track, 'x') + gsap.getProperty(par, 'x');
    return row;
  });

  let rt = 0;
  window.addEventListener('resize', () => {
    clearTimeout(rt);
    rt = setTimeout(() => rows.forEach((row) => {
      row.w = layout(row.line);
      if (row.drag) { row.drag.applyBounds({ minX: Math.min(0, row.line.clientWidth - row.w), maxX: 0 }); }
    }), 150);
  });

  // ── покачивание: простая пружина ──
  if (!GF.reduced) {
    let visible = false, prevScroll = window.scrollY, prevSV = 0, running = false;
    const tick = () => {
      const sy = window.scrollY, sv = sy - prevScroll; prevScroll = sy;
      const sa = sv - prevSV; prevSV = sv;
      let energy = 0;
      rows.forEach((row) => {
        const x = gsap.getProperty(row.track, 'x') + gsap.getProperty(row.par, 'x');
        const v = x - row.prevX; row.prevX = x;
        const a = v - row.prevV; row.prevV = v;
        for (let i = 0; i < row.hangs.length; i++) {
          let vel = row.vel[i], ang = row.ang[i];
          vel += -0.06 * ang - a * 0.11 - sa * 0.05 * row.sign[i] - v * 0.004;
          vel *= 0.915;
          ang = Math.max(-6, Math.min(6, ang + vel));
          row.vel[i] = vel; row.ang[i] = ang;
          energy += Math.abs(ang) + Math.abs(vel);
          row.set[i](ang);
        }
      });
      if (!visible && energy < 0.05) { gsap.ticker.remove(tick); running = false; }
    };
    new IntersectionObserver((ents) => {
      visible = ents[0].isIntersecting;
      if (visible && !running) { running = true; prevScroll = window.scrollY; gsap.ticker.add(tick); }
    }, { rootMargin: '100px 0px' }).observe(sec);
  }

  // ── лайтбокс «Выставка» ──
  const lb = document.querySelector('.lb');
  if (!lb) return;
  const frame = lb.querySelector('.lb-fig'), im = lb.querySelector('.lb-img'), cap = lb.querySelector('.lb-cap'), count = lb.querySelector('.lb-count');
  const pad = (n) => String(n).padStart(2, '0');
  let idx = 0, release = null, from = null, loadTok = 0;

  function show(i) {
    idx = (i + allBtns.length) % allBtns.length;
    const b = allBtns[idx], thumb = b.querySelector('img');
    im.src = thumb.currentSrc || thumb.src;
    im.alt = thumb.alt;
    cap.textContent = b.dataset.label + ' · Gulfario Art';
    count.textContent = `${pad(idx + 1)} / ${pad(allBtns.length)}`;
    const tok = ++loadTok, big = new Image();
    big.onload = () => { if (tok === loadTok) im.src = big.src; };
    big.src = b.dataset.full + '.webp';
  }
  function open(i, btn) {
    from = btn;
    lb.hidden = false;
    show(i);
    GF.stopScroll();
    release = GF.trap(lb);
    lb.querySelector('.lb-close').focus({ preventScroll: true });
    if (GF.reduced) return;
    gsap.fromTo(lb.querySelector('.lb-bg'), { opacity: 0 }, { opacity: 1, duration: 0.4 });
    gsap.fromTo(lb.querySelectorAll('.lb-btn'), { opacity: 0 }, { opacity: 1, duration: 0.4, delay: 0.3 });
    // FLIP: из прямоугольника миниатюры в центр
    const a = btn.getBoundingClientRect();
    requestAnimationFrame(() => {
      const r = frame.getBoundingClientRect();
      const s = Math.min(a.width / r.width, a.height / r.height);
      gsap.fromTo(frame, { x: a.left + a.width / 2 - (r.left + r.width / 2), y: a.top + a.height / 2 - (r.top + r.height / 2), scale: s, rotation: gsap.getProperty(btn.parentElement, 'rotation') || 0 },
        { x: 0, y: 0, scale: 1, rotation: 0, duration: 0.75, ease: 'expo.out' });
    });
  }
  function close() {
    if (lb.hidden) return;
    if (release) { release(); release = null; }
    const done = () => { lb.hidden = true; gsap.set(frame, { clearProps: 'all' }); GF.startScroll(); if (from) from.focus({ preventScroll: true }); };
    if (GF.reduced) return done();
    gsap.to(lb.querySelector('.lb-bg'), { opacity: 0, duration: 0.3 });
    gsap.to(frame, { scale: 0.92, opacity: 0, duration: 0.3, ease: 'power2.in', onComplete: done });
  }
  function step(d) {
    if (GF.reduced) return show(idx + d);
    gsap.to(im, { opacity: 0, x: -d * 30, duration: 0.18, ease: 'power1.in', onComplete: () => { show(idx + d); gsap.fromTo(im, { opacity: 0, x: d * 30 }, { opacity: 1, x: 0, duration: 0.35, ease: 'power2.out' }); } });
  }

  allBtns.forEach((b, i) => b.addEventListener('click', (e) => {
    const row = rows.find((r) => r.track.contains(b));
    if (row && row.dragged) { row.dragged = false; e.preventDefault(); return; }
    open(i, b);
  }));
  lb.querySelectorAll('[data-lb-close]').forEach((el) => el.addEventListener('click', close));
  lb.querySelector('.lb-prev').addEventListener('click', () => step(-1));
  lb.querySelector('.lb-next').addEventListener('click', () => step(1));
  document.addEventListener('keydown', (e) => {
    if (lb.hidden) return;
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowRight') step(1);
    else if (e.key === 'ArrowLeft') step(-1);
  });
  let sx = null;
  frame.addEventListener('pointerdown', (e) => { sx = e.clientX; });
  frame.addEventListener('pointerup', (e) => { if (sx !== null && Math.abs(e.clientX - sx) > 50) step(e.clientX < sx ? 1 : -1); sx = null; });
  frame.addEventListener('dragstart', (e) => e.preventDefault());
}]);

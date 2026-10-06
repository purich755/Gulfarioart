/* Gulfario Art — ядро: Lenis + ScrollTrigger, шапка, меню, появления, пины, палитра-прогресс,
   курсор-кисть, магнитные кнопки, сертификат, рама. Модули (hero-paint, table, line-gallery,
   sketch-slider, quiz) регистрируются в window.GF_MODS и запускаются отсюда. */
(function () {
  'use strict';
  const root = document.documentElement;
  const GF = (window.GF = window.GF || {});
  if (!window.gsap || !window.ScrollTrigger) { root.classList.remove('js-ready'); return; }
  window.__gfBooted = true;

  const plugins = [ScrollTrigger, window.Draggable, window.InertiaPlugin, window.SplitText, window.DrawSVGPlugin].filter(Boolean);
  gsap.registerPlugin(...plugins);
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  GF.$ = $; GF.$$ = $$;
  GF.reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  GF.fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  GF.ease = 'expo.out';
  GF.mm = gsap.matchMedia();

  /* ── Плавный скролл ─────────────────────────────────── */
  let lenis = null;
  if (!GF.reduced && window.Lenis) {
    lenis = new Lenis({ lerp: 0.1, smoothWheel: true, wheelMultiplier: 1 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    window.__lenis = lenis;
  }
  GF.lenis = lenis;
  GF.stopScroll = () => { lenis ? lenis.stop() : (document.body.style.overflow = 'hidden'); };
  GF.startScroll = () => { lenis ? lenis.start() : (document.body.style.overflow = ''); };
  GF.scrollTo = (target, opts = {}) => {
    const el = typeof target === 'string' ? $(target) : target;
    if (!el) return;
    if (lenis) lenis.scrollTo(el, { duration: 1.4, easing: (t) => 1 - Math.pow(1 - t, 4), ...opts });
    else el.scrollIntoView({ behavior: GF.reduced ? 'auto' : 'smooth' });
  };

  // Пины создаются раньше всех остальных триггеров: тогда секции ниже учитывают их длину.
  /* ── Пины только на десктопе ─────────────────────────── */
  GF.mm.add('(min-width: 1024px) and (prefers-reduced-motion: no-preference)', () => {
    // «Кому»: листы по очереди ложатся на стол
    const pin = $('.komu-pin');
    const sheets = $$('[data-sheet]', pin);
    const rot = [-2, 1, -1];
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: pin, pin: true, scrub: 0.8, end: '+=110%', anticipatePin: 1,
        start: () => (pin.offsetHeight > innerHeight ? 'bottom bottom' : 'top top'), invalidateOnRefresh: true,
      },
    });
    sheets.forEach((s, i) => tl.fromTo(s, { y: '62vh', rotation: 6, opacity: 0 }, { y: 0, rotation: rot[i], opacity: 1, duration: 1, ease: 'power2.out' }, i * 0.75));
    tl.to({}, { duration: 0.3 });

    // «Мансарда»: луч из окна, наезд кадра, смена кадров и подписей
    const mp = $('.mans-pin');
    const shots = $$('.mans-shot', mp), texts = $$('.mans-t', mp), imgs = $$('.mans-shot img', mp);
    gsap.set(shots, { opacity: (i) => (i ? 0 : 1) });
    gsap.set(texts, { autoAlpha: (i) => (i ? 0 : 1), y: 0 });
    const m = gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: mp, pin: true, scrub: 0.8, start: 'top top', end: '+=160%', anticipatePin: 1 } });
    m.fromTo('.mans-beam', { xPercent: -62 }, { xPercent: 60, duration: 3 }, 0)
      .fromTo(imgs, { scale: 1 }, { scale: 1.12, duration: 3 }, 0);
    [1, 2].forEach((k) => {
      const at = k * 1 - 0.15;
      m.to(shots[k], { opacity: 1, duration: 0.3, ease: 'power1.inOut' }, at)
        .to(shots[k - 1], { opacity: 0, duration: 0.3, ease: 'power1.inOut' }, at + 0.05)
        .to(texts[k - 1], { autoAlpha: 0, y: -24, duration: 0.2, ease: 'power2.in' }, at)
        .fromTo(texts[k], { autoAlpha: 0, y: 30, clipPath: 'inset(0 0 100% 0)' }, { autoAlpha: 1, y: 0, clipPath: 'inset(0 0 0% 0)', duration: 0.3, ease: 'power2.out' }, at + 0.15);
    });
    return () => { gsap.set([shots, texts, imgs, '.mans-beam'], { clearProps: 'all' }); };
  });

  /* ── Фокус-ловушка для бирки, меню и лайтбокса ──────── */
  GF.trap = (...boxes) => {
    const sel = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const onKey = (e) => {
      if (e.key !== 'Tab') return;
      const f = boxes.flatMap((b) => $$(sel, b)).filter((el) => el.offsetWidth || el.offsetHeight);
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (!boxes.some((b) => b.contains(document.activeElement))) { e.preventDefault(); first.focus(); }
      else if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  };

  /* ── Шапка: фон после 80 px, прячется вниз / появляется вверх ── */
  const hdr = $('[data-hdr]');
  let lastY = window.scrollY, menuOpen = false;
  const onScroll = () => {
    const y = window.scrollY;
    hdr.classList.toggle('is-solid', y > 80);
    if (!menuOpen) {
      if (y > 240 && y > lastY + 4) hdr.classList.add('is-hidden');
      else if (y < lastY - 4 || y < 240) hdr.classList.remove('is-hidden');
    }
    lastY = y;
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  hdr.addEventListener('focusin', () => hdr.classList.remove('is-hidden'));

  /* ── Мобильное меню: лист бумаги, пункты «пишутся» ──── */
  const burger = $('.burger'), menu = $('#menu');
  let releaseMenu = null;
  const setMenu = (open) => {
    menuOpen = open;
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    if (open) {
      menu.hidden = false;
      hdr.classList.remove('is-hidden');
      GF.stopScroll();
      releaseMenu = GF.trap(hdr, menu);
      const spans = $$('.menu-in a span, .menu-foot > *', menu);
      if (!GF.reduced) gsap.fromTo(spans, { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', duration: 0.7, ease: 'power3.out', stagger: 0.08 });
      gsap.fromTo(menu, { opacity: 0 }, { opacity: 1, duration: 0.3 });
      $('.menu-in a', menu).focus({ preventScroll: true });
    } else {
      if (releaseMenu) releaseMenu();
      menu.hidden = true;
      GF.startScroll();
    }
  };
  burger.addEventListener('click', () => setMenu(!menuOpen));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && menuOpen) { setMenu(false); burger.focus(); } });

  /* ── Якоря через Lenis ──────────────────────────────── */
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href');
    const target = id === '#top' ? $('#top') : id.length > 1 && $(id);
    if (!target) return;
    e.preventDefault();
    if (menuOpen) setMenu(false);
    GF.scrollTo(target);
    history.replaceState(null, '', id === '#top' ? location.pathname : id);
  });

  /* ── Подсветка пункта меню ──────────────────────────── */
  $$('.nav a').forEach((a) => {
    const sec = $(a.getAttribute('href'));
    if (!sec) return;
    ScrollTrigger.create({ trigger: sec, start: 'top 45%', end: 'bottom 45%', onToggle: (s) => a.classList.toggle('is-active', s.isActive) });
  });

  /* ── Палитра-прогресс ───────────────────────────────── */
  const palLinks = $$('[data-layer-link]');
  const setLayer = (n) => palLinks.forEach((a, i) => { a.classList.toggle('is-filled', i <= n); a.classList.toggle('is-current', i === n); });
  $$('[data-layer]').forEach((sec) => {
    const n = Number(sec.dataset.layer);
    ScrollTrigger.create({ trigger: sec, start: 'top 55%', end: 'bottom 55%', onToggle: (s) => { if (s.isActive) setLayer(n); } });
  });
  setLayer(0);

  /* ── Модули ─────────────────────────────────────────── */
  (window.GF_MODS || []).forEach(([name, fn]) => {
    try { fn(GF); } catch (err) { console.error('[gulfario] модуль ' + name + ':', err); }
  });

  /* ── Появления ──────────────────────────────────────── */
  const showAll = () => {
    gsap.set('[data-rv], [data-split], [data-hang], .pin-note', { opacity: 1, clearProps: 'transform' });
    gsap.set('.key .u, .divider, .ftr-stroke', { clipPath: 'inset(0 0% 0 0)' });
    gsap.set('.arrow, .steps-line', { visibility: 'visible' });
    $$('.pin-note').forEach((n) => n.classList.add('is-pinned'));
  };

  // заголовки: строки выезжают из-под маски, потом прокрашивается подчёркивание
  const revealUnder = (el, delay = 0) => {
    const u = $$('.key .u', el);
    if (u.length) gsap.to(u, { clipPath: 'inset(0 0% 0 0)', duration: 0.9, ease: 'power2.inOut', delay });
  };
  const splitHeading = (el) => {
    if (!window.SplitText) { gsap.set(el, { opacity: 1 }); revealUnder(el); return; }
    const split = SplitText.create(el, { type: 'lines', mask: 'lines', linesClass: 'sl', aria: 'none' });
    gsap.set(split.lines, { yPercent: 112 });
    gsap.set(el, { opacity: 1 });
    ScrollTrigger.create({
      trigger: el, start: 'top 85%', once: true,
      onEnter: () => gsap.to(split.lines, {
        yPercent: 0, duration: 1.1, ease: GF.ease, stagger: 0.11,
        onComplete: () => { split.revert(); revealUnder(el); },
      }),
    });
  };

  const drawArrows = (scope, delay = 0.25) => {
    if (!window.DrawSVGPlugin) { gsap.set($$('.arrow', scope), { visibility: 'visible' }); return; }
    $$('.arrow', scope).forEach((svg) => {
      const paths = $$('path', svg);
      gsap.set(paths, { drawSVG: '0%' });
      gsap.set(svg, { visibility: 'visible' });
      ScrollTrigger.create({ trigger: svg, start: 'top 90%', once: true, onEnter: () => gsap.to(paths, { drawSVG: '100%', duration: 0.8, ease: 'power2.inOut', stagger: 0.28, delay }) });
    });
  };

  if (GF.reduced) {
    showAll();
  } else {
    $$('[data-split]').forEach(splitHeading);

    gsap.set('[data-rv]', { y: 24, rotation: -0.6 });
    ScrollTrigger.batch('[data-rv]', {
      start: 'top 84%', once: true,
      onEnter: (b) => gsap.to(b, { opacity: 1, y: 0, rotation: 0, duration: 0.9, ease: GF.ease, stagger: 0.08, overwrite: true }),
    });

    drawArrows(document.querySelector('main'));
    $$('.divider, .ftr-stroke').forEach((d) => ScrollTrigger.create({
      trigger: d, start: 'top 92%', once: true,
      onEnter: () => gsap.to(d, { clipPath: 'inset(0 0% 0 0)', duration: 1.2, ease: 'power2.inOut' }),
    }));

    // манифест: слова проявляются по мере чтения
    const mt = $('[data-words]');
    if (mt && window.SplitText) {
      const sw = SplitText.create(mt, { type: 'words', wordsClass: 'w', tag: 'span', aria: 'none' });
      gsap.to(sw.words, { color: '#24211E', ease: 'none', stagger: 0.1, scrollTrigger: { trigger: mt, start: 'top 78%', end: 'bottom 42%', scrub: 0.6 } });
    }

    // шаги: карандашная линия рисуется скроллом
    const sl = $('.steps-line path');
    if (sl && window.DrawSVGPlugin) {
      gsap.set(sl, { drawSVG: '0%' }); gsap.set('.steps-line', { visibility: 'visible' });
      gsap.to(sl, { drawSVG: '100%', ease: 'none', scrollTrigger: { trigger: '.steps', start: 'top 85%', end: 'top 35%', scrub: 0.6 } });
    } else gsap.set('.steps-line', { visibility: 'visible' });

    // педагоги: рамы «вешаются» с затухающим покачиванием
    const hangs = $$('[data-hang]');
    gsap.set(hangs, { opacity: 0, y: -70, rotation: 3 });
    ScrollTrigger.create({
      trigger: '.etudes', start: 'top 78%', once: true,
      onEnter: () => hangs.forEach((h, i) => {
        gsap.to(h, { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out', delay: i * 0.18 });
        gsap.fromTo(h, { rotation: 3 + i }, { rotation: 0, duration: 2.2, ease: 'elastic.out(1.1, 0.22)', delay: 0.15 + i * 0.18 });
      }),
    });

    // отзывы: записки прикалываются по очереди
    const notes = $$('.pin-note');
    gsap.set(notes, { opacity: 0, scale: 1.08 });
    ScrollTrigger.create({
      trigger: '.board-in', start: 'top 75%', once: true,
      onEnter: () => notes.forEach((n, i) => gsap.to(n, {
        opacity: 1, scale: 1, duration: 0.55, ease: 'back.out(2.2)', delay: i * 0.12,
        onStart: () => n.classList.add('is-pinned'),
      })),
    });

    // рама финала: четыре планки въезжают и защёлкиваются
    const fr = $('[data-frame] .frame');
    if (fr) {
      const off = { '.plank--t': { y: -140 }, '.plank--b': { y: 140 }, '.plank--l': { x: -140 }, '.plank--r': { x: 140 } };
      Object.entries(off).forEach(([s, v]) => gsap.set($(s, fr), { ...v, opacity: 0 }));
      gsap.set($('.frame-pic', fr), { clipPath: 'inset(8% 8% 8% 8%)', scale: 1.06 });
      ScrollTrigger.create({
        trigger: fr, start: 'top 75%', once: true,
        onEnter: () => {
          const tl = gsap.timeline();
          tl.to($('.frame-pic', fr), { clipPath: 'inset(0% 0% 0% 0%)', scale: 1, duration: 1.1, ease: GF.ease })
            .to($$('.plank', fr), { x: 0, y: 0, opacity: 1, duration: 0.75, ease: 'back.out(1.5)', stagger: 0.1 }, 0.3)
            .fromTo(fr, { scale: 1 }, { scale: 1.012, duration: 0.09, yoyo: true, repeat: 1, ease: 'power1.inOut' }, '>-0.05');
        },
      });
    }

    // фото: шторка из-под паспарту
    $$('.compare-stage, .map-frame').forEach((el) => {
      gsap.set(el, { clipPath: 'inset(8% 8% 8% 8%)' });
      ScrollTrigger.create({ trigger: el, start: 'top 85%', once: true, onEnter: () => gsap.to(el, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.1, ease: GF.ease }) });
    });

    // лёгкий параллакс фото (±40 px)
    $$('.frame-pic img').forEach((img) => gsap.fromTo(img, { y: -20 }, { y: 20, ease: 'none', scrollTrigger: { trigger: img, start: 'top bottom', end: 'bottom top', scrub: true } }));
  }

  /* ── Курсор-кисть (десктоп) ─────────────────────────── */
  if (GF.fine) {
    document.body.classList.add('has-cursor');
    const cur = $('.cursor'), label = $('.cursor-label', cur);
    let x = innerWidth / 2, y = innerHeight / 2, cx = x, cy = y, seen = false;
    window.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      x = e.clientX; y = e.clientY;
      if (!seen) { seen = true; cx = x; cy = y; }
    }, { passive: true });
    document.addEventListener('pointerleave', () => cur.classList.add('is-hidden'));
    document.addEventListener('pointerenter', () => cur.classList.remove('is-hidden'));
    gsap.ticker.add(() => {
      cx += (x - cx) * 0.18; cy += (y - cy) * 0.18;
      cur.style.transform = `translate3d(${cx.toFixed(1)}px, ${cy.toFixed(1)}px, 0)`;
    });
    document.addEventListener('pointerover', (e) => {
      const t = e.target.closest('a, button, [data-cursor], [role="slider"]');
      cur.classList.toggle('is-hover', !!t);
      label.textContent = t ? t.dataset.cursor || '' : '';
    });
  }

  /* ── Магнитные кнопки ───────────────────────────────── */
  if (GF.fine && !GF.reduced) {
    $$('[data-magnetic]').forEach((el) => {
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2), dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
        gsap.to(el, { x: dx * 6, y: dy * 6, duration: 0.4, ease: 'power3.out' });
      });
      el.addEventListener('pointerleave', () => gsap.to(el, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1, .4)' }));
    });
  }

  /* ── Сертификат: 3D-наклон и блик ───────────────────── */
  const tilt = $('[data-tilt]');
  if (tilt && !GF.reduced) {
    const card = $('.cert-card', tilt);
    gsap.set(card, { rotationY: -8, rotationX: 4 });
    const rx = gsap.quickTo(card, 'rotationX', { duration: 0.6, ease: 'power3.out' });
    const ry = gsap.quickTo(card, 'rotationY', { duration: 0.6, ease: 'power3.out' });
    if (GF.fine) {
      tilt.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        ry((px - 0.5) * 20); rx((0.5 - py) * 20);
        card.style.setProperty('--mx', (px * 100).toFixed(1) + '%');
      });
      tilt.addEventListener('pointerleave', () => { rx(4); ry(-8); });
    } else {
      gsap.to(card, { rotationY: 8, rotationX: -3, ease: 'none', scrollTrigger: { trigger: tilt, start: 'top bottom', end: 'bottom top', scrub: true, onUpdate: (s) => card.style.setProperty('--mx', (20 + s.progress * 70).toFixed(1) + '%') } });
    }
  }

  /* ── Hero: вступление ───────────────────────────────── */
  const heroIntro = () => {
    // текст hero появляется CSS-анимацией; здесь — только стрелка подсказки
    const hint = $('.hero-hint .arrow');
    if (!hint) return;
    if (!window.DrawSVGPlugin) { gsap.set(hint, { visibility: 'visible' }); return; }
    const p = $$('path', hint);
    gsap.set(p, { drawSVG: '0%' }); gsap.set(hint, { visibility: 'visible' });
    gsap.timeline({ delay: 1.6 }).fromTo('.hero-hint', { opacity: 0 }, { opacity: 1, duration: 0.6 }).to(p, { drawSVG: '100%', duration: 0.8, ease: 'power2.inOut', stagger: 0.3 }, 0.2);
  };
  if (!GF.reduced) heroIntro();

  // шрифты меняют высоты — пересчитать триггеры
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => ScrollTrigger.refresh());
  window.addEventListener('load', () => ScrollTrigger.refresh());
})();

/* Стол мастерской: работы можно таскать (Draggable + инерция в границах стола),
   клик без перетаскивания — бирка на верёвочке с описанием техники.
   На мобильном стол — горизонтальная свайп-стопка, бирка — нижний лист. */
(window.GF_MODS = window.GF_MODS || []).push(['table', (GF) => {
  const desk = document.querySelector('[data-desk]');
  const tag = document.getElementById('tag');
  if (!desk || !tag) return;
  const items = [...desk.querySelectorAll('.item')];
  const card = tag.querySelector('.tag-card');
  const f = (k) => tag.querySelector(`[data-f="${k}"]`);
  let current = null, release = null, opening = false;

  function openTag(item) {
    const info = item.querySelector('.item-info').dataset;
    tag.querySelector('.tag-title').textContent = info.title;
    f('what').textContent = info.what;
    f('who').textContent = info.who;
    f('note').textContent = info.note;
    tag.querySelector('.tag-wa').href = info.ask;
    const wasOpen = !tag.hidden;
    current = item;
    tag.hidden = false;
    opening = true; requestAnimationFrame(() => (opening = false));
    if (!release) release = GF.trap(tag);
    const mobile = innerWidth < 768;
    if (!GF.reduced) {
      if (mobile) gsap.fromTo(tag, { yPercent: 100 }, { yPercent: 0, duration: 0.55, ease: 'expo.out' });
      else if (wasOpen) gsap.fromTo(tag, { rotation: -5 }, { rotation: 0, duration: 1.6, ease: 'elastic.out(1, .25)' });
      else gsap.fromTo(tag, { x: 140, rotation: 12, opacity: 0 }, { x: 0, rotation: 0, opacity: 1, duration: 1.8, ease: 'elastic.out(1, .3)' });
    }
    tag.querySelector('.tag-close').focus({ preventScroll: true });
  }
  function closeTag() {
    if (tag.hidden) return;
    if (release) { release(); release = null; }
    const back = current; current = null;
    const done = () => { tag.hidden = true; gsap.set(tag, { clearProps: 'transform,opacity' }); };
    if (GF.reduced) done();
    else if (innerWidth < 768) gsap.to(tag, { yPercent: 100, duration: 0.35, ease: 'power2.in', onComplete: done });
    else gsap.to(tag, { x: 160, rotation: 10, opacity: 0, duration: 0.4, ease: 'power2.in', onComplete: done });
    if (back) back.focus({ preventScroll: true });
  }
  tag.querySelector('.tag-close').addEventListener('click', closeTag);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeTag(); });
  document.addEventListener('pointerdown', (e) => {
    if (tag.hidden || opening || tag.contains(e.target) || e.target.closest('.item')) return;
    closeTag();
  });

  // клик/тап и клавиатура (Enter/Space на кнопке) — через нативный click; после перетаскивания он гасится
  let dragged = false;
  items.forEach((it) => it.addEventListener('click', (e) => {
    if (dragged) { dragged = false; e.preventDefault(); return; }
    openTag(it);
  }));

  // Draggable — только на столе (≥768 px)
  if (!window.Draggable) return;
  GF.mm.add('(min-width: 768px)', () => {
    let z = 10;
    items.forEach((it) => gsap.set(it, { rotation: parseFloat(getComputedStyle(it).getPropertyValue('--r')) || 0 }));
    const ds = items.map((it) => Draggable.create(it, {
      type: 'x,y', bounds: desk, inertia: !!window.InertiaPlugin, edgeResistance: 0.82, dragClickables: true, minimumMovement: 6,
      onPress() { dragged = false; it.style.zIndex = ++z; it.classList.add('is-grab'); gsap.to(it, { scale: 1.05, duration: 0.25, ease: 'power2.out' }); },
      onDragStart() { dragged = true; if (current === it) closeTag(); },
      onRelease() { it.classList.remove('is-grab'); gsap.to(it, { scale: 1, duration: 0.45, ease: 'back.out(2)' }); },
      onThrowComplete() { dragged = false; },
    })[0]);
    // «рука» слегка двигает работы, когда стол появляется — подсказка, что они живые
    if (!GF.reduced) {
      ScrollTrigger.create({
        trigger: desk, start: 'top 92%', once: true,
        onEnter: () => gsap.from(items, { y: () => -30 - Math.random() * 40, rotation: (i, el) => (gsap.getProperty(el, 'rotation') + (Math.random() - 0.5) * 16), opacity: 0, duration: 0.9, ease: 'back.out(1.4)', stagger: { each: 0.05, from: 'random' } }),
      });
    }
    return () => { ds.forEach((d) => d.kill()); gsap.set(items, { clearProps: 'all' }); };
  });
}]);

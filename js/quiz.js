/* «С чего начать?» — подбор в два шага. Только факты о студии: никаких цен, дат и расписаний.
   Результат — карточка с «каплей краски», которая растекается в фон, и WhatsApp с готовым текстом. */
(window.GF_MODS = window.GF_MODS || []).push(['quiz', (GF) => {
  const q = document.querySelector('[data-quiz]');
  if (!q) return;
  const WA = 'https://wa.me/79872829232?text=';
  const COLOR = { child: 'var(--ultramarine)', self: 'var(--ochre)', group: 'var(--madder)', gift: 'var(--viridian)' };

  // [заголовок, текст, сообщение в WhatsApp]
  const R = {
    child: {
      regular: ['Регулярные занятия рисованием и лепкой', 'Каждый раз новые материалы, участие в конкурсах и подготовка к художественной школе. Летом студия тоже работает — с занятиями и пленэрами.', 'Здравствуйте! Хочу узнать про регулярные занятия рисованием и лепкой для ребёнка.'],
      once: ['Детский мастер-класс', 'Роспись пряников, шоппера или тыквы к Хеллоуину — за одно занятие, и работа остаётся у ребёнка.', 'Здравствуйте! Хочу записать ребёнка на мастер-класс.'],
      handmade: ['Вещь своими руками', 'Лепка, таба-лапки и пончики из полимерной глины или бенто-тортик — то, что приятно забрать домой.', 'Здравствуйте! Хочу мастер-класс для ребёнка, чтобы сделать вещь своими руками.'],
      occasion: ['День рождения в студии', 'Мастер-класс под возраст и повод, чаепитие с угощением от студии — и каждый гость уносит свою работу.', 'Здравствуйте! Хочу провести день рождения ребёнка в студии.'],
    },
    self: {
      regular: ['Начните с индивидуального занятия', 'Масло или акрил: педагог подберёт краски и кисти и проведёт по шагам. Как продолжить и как часто приходить — договоримся в WhatsApp.', 'Здравствуйте! Хочу заниматься рисованием регулярно — с чего начать?'],
      once: ['Индивидуальный мастер-класс маслом или акрилом', 'Педагог рядом весь урок, работа — ваша. Уметь рисовать не нужно.', 'Здравствуйте! Хочу на индивидуальный мастер-класс маслом или акрилом.'],
      handmade: ['Эпоксидная смола, светящаяся луна или роспись шоппера', 'Вещь, которую сделаете сами и заберёте с собой.', 'Здравствуйте! Хочу на мастер-класс: эпоксидная смола, светящаяся луна или роспись шоппера.'],
      occasion: ['Мастер-класс по поводу', 'Интерьерная картина мастихином и объёмной пастой, роспись тарелочки или пряников — хороший способ отметить день с близкими.', 'Здравствуйте! Хочу отметить повод мастер-классом в студии.'],
    },
    group: {
      regular: ['Подберём формат для компании', 'Напишите, сколько вас и как часто хотите собираться, — подскажем технику и время.', 'Здравствуйте! Нас компания, хотим заниматься вместе. Какие есть варианты?'],
      once: ['Мастер-класс на компанию', 'Акрил на холсте, интерьерная картина, роспись пряников или тарелочек — каждый уходит со своей работой.', 'Здравствуйте! Хотим мастер-класс на компанию.'],
      handmade: ['Своими руками — всей компанией', 'Роспись шопперов, полимерная глина или бенто-тортики: каждый уносит вещь, сделанную сам.', 'Здравствуйте! Хотим на компанию сделать вещи своими руками.'],
      occasion: ['Мастер-класс на день рождения или выпускной', 'С чаепитием и угощением от студии — каждый гость уносит свою работу.', 'Здравствуйте! Хотим провести праздник в студии — день рождения или выпускной.'],
    },
    gift: {
      regular: ['Подарочный сертификат', 'Хороший способ начать: первое занятие в мансарде, а дальше человек решит сам.', 'Здравствуйте! Хочу подарочный сертификат на занятие.'],
      once: ['Сертификат на мастер-класс', 'Масло, светящаяся луна, эпоксидная смола — по сертификату сюда приходили и те, кто впервые брал в руки кисть с маслом.', 'Здравствуйте! Хочу подарочный сертификат на мастер-класс.'],
      handmade: ['Сертификат на вещь своими руками', 'Светящаяся луна, эпоксидная смола или роспись шоппера — подарок, который останется на полке.', 'Здравствуйте! Хочу сертификат на мастер-класс, где делают вещь своими руками.'],
      occasion: ['Сертификат к празднику', 'Подарочный сертификат на занятие или мастер-класс в студии.', 'Здравствуйте! Хочу подарочный сертификат к празднику.'],
    },
  };

  const steps = { who: q.querySelector('[data-q="who"]'), what: q.querySelector('[data-q="what"]') };
  const res = q.querySelector('.q-result'), drop = res.querySelector('.q-drop');
  const dots = [...q.querySelectorAll('.q-dot')];
  const pick = { who: null, what: null };
  const setDot = (n) => dots.forEach((d, i) => d.classList.toggle('is-on', i <= n));

  function swap(hide, show, focusEl) {
    const go = () => { hide.hidden = true; show.hidden = false; if (!GF.reduced) gsap.fromTo(show, { opacity: 0, y: 26 }, { opacity: 1, y: 0, duration: 0.6, ease: 'expo.out' }); if (focusEl) focusEl.focus({ preventScroll: true }); };
    if (GF.reduced) go(); else gsap.to(hide, { opacity: 0, y: -16, duration: 0.25, ease: 'power1.in', onComplete: () => { gsap.set(hide, { clearProps: 'opacity,transform' }); go(); } });
  }

  q.addEventListener('click', (e) => {
    const b = e.target.closest('.q-opt');
    if (b) {
      const step = b.closest('.q-step').dataset.q;
      b.parentElement.querySelectorAll('.q-opt').forEach((o) => { o.classList.toggle('is-picked', o === b); o.setAttribute('aria-pressed', String(o === b)); });
      pick[step] = b.dataset.v;
      if (step === 'who') { setDot(1); setTimeout(() => swap(steps.who, steps.what, steps.what.querySelector('.q-opt')), GF.reduced ? 0 : 320); }
      else setTimeout(() => showResult(b), GF.reduced ? 0 : 320);
      return;
    }
    if (e.target.closest('.q-back')) { setDot(0); swap(steps.what, steps.who, steps.who.querySelector('.is-picked') || steps.who.querySelector('.q-opt')); }
    if (e.target.closest('.q-reset')) {
      q.querySelectorAll('.q-opt').forEach((o) => { o.classList.remove('is-picked'); o.removeAttribute('aria-pressed'); });
      pick.who = pick.what = null; setDot(0);
      swap(res, steps.who, steps.who.querySelector('.q-opt'));
    }
  });

  function showResult(btn) {
    const [title, text, msg] = R[pick.who][pick.what];
    res.querySelector('.q-title').textContent = title;
    res.querySelector('.q-text').textContent = text;
    res.querySelector('.btn').href = WA + encodeURIComponent(msg);
    res.style.setProperty('--rc', COLOR[pick.who]);
    setDot(2);
    const title$ = res.querySelector('.q-title');
    title$.tabIndex = -1;
    swap(steps.what, res, title$);
    if (!GF.reduced) {
      // капля краски падает в точку выбора и растекается по карточке
      requestAnimationFrame(() => {
        const r = res.getBoundingClientRect();
        res.style.setProperty('--dx', '18%'); res.style.setProperty('--dy', '30%');
        const s = Math.hypot(r.width, r.height) / 4.4;
        gsap.fromTo(drop, { scale: 0, opacity: 0.5 }, { scale: s, opacity: 0.22, duration: 1.4, ease: 'expo.out', delay: 0.15 });
      });
    } else gsap.set(drop, { scale: 200 });
  }
}]);

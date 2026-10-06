# Gulfario Art — демо главной «Белый лист»

Одностраничный демо-сайт творческой студии-школы Gulfario Art (Казань, ул. Фатыха Карима, 9).
Чистые HTML + CSS + vanilla JS без сборщика: открывается двойным кликом и деплоится как статика.

## Запуск

```bash
node tools/serve.mjs 8290
```

Откройте http://localhost:8290/. Сервер отдаёт текст в gzip, как GitHub Pages. Страница работает и через `file://`,
но тогда набросок в слайдере рисуется упрощённо: браузер не даёт читать пиксели картинки с `file://`.

## Структура

```
index.html            разметка всех секций (стол и сушилка вставлены генератором)
css/styles.css        дизайн-система, шрифты (@font-face), Lenis, все секции
js/main.js            Lenis + ScrollTrigger, шапка, меню, появления, пины, палитра-прогресс, курсор, сертификат
js/hero-paint.js      акварельный hero: маска на canvas проявляет фото мастерской
js/table.js           стол мастерской: Draggable + инерция, бирка на верёвочке
js/line-gallery.js    сушилка: верёвки, пружинное покачивание, лайтбокс «Выставка»
js/sketch-slider.js   набросок/цвет: Собель + штриховка на canvas, слайдер с клавиатурой
js/quiz.js            «С чего начать?» — 16 комбинаций, WhatsApp с готовым текстом
js/vendor/            GSAP 3.15 (ScrollTrigger, Draggable, Inertia, SplitText, DrawSVG) и Lenis — локально
assets/img/           interior/ works/ process/ events/ logo/ map/ — webp + jpg
assets/fonts/         Prata, Manrope, Cormorant Infant, Caveat — сабсет до символов страницы
```

GSAP и Lenis лежат в проекте, а не на CDN: так страница не зависит от внешних серверов и открывается офлайн.
Если скрипты не загрузятся, класс `.js-ready` снимется через 3 с и весь контент будет виден.

## Инструменты (`tools/`)

| Скрипт | Что делает |
|---|---|
| `dump-yandex.mjs`, `fetch-ya-photos.mjs` | карточка, галерея и отзывы Яндекс.Карт → `raw/` |
| `dump-tg.mjs`, `dump-vk.mjs` | Telegram и VK (у студии оба закрыты: группа и логин-стена) |
| `contact-sheet.mjs` | контактный лист для отбора кадров |
| `build-assets.mjs` | кроп → webp + jpg по плану, логотип-маска, фавиконки, og.jpg |
| `build-map.mjs` | статичная карта района из тайлов OpenStreetMap |
| `gen-strokes.mjs` | SVG-спрайт: мазки кистью, акварельные кляксы, прищепка → в `index.html` |
| `gen-html.mjs` | предметы стола и работы сушилки из данных → в `index.html`; ссылки `data-wa` |
| `fetch-fonts.mjs`, `subset-fonts.mjs` | шрифты Google → сабсет → `@font-face` в CSS |
| `check-modes.mjs` | самопроверка: reduced-motion, без JS, десктоп |

После правки текстов на странице перезапустите `node tools/subset-fonts.mjs` — в шрифтах только используемые символы.

## Проверка

Lighthouse (мобильный, локально с gzip): Performance 91 · Accessibility 100 · Best Practices 100 · SEO 100;
LCP 3,2 с, CLS 0. Ширина документа 375/390/1440 — без горизонтального скролла.

Что подтвердить у клиента — в [OPEN_QUESTIONS.md](OPEN_QUESTIONS.md).

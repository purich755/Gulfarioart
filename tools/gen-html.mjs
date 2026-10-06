// Генерирует повторяющиеся блоки index.html из данных ниже и вставляет их между маркерами:
//   <!--table-->…<!--/table-->  — предметы на столе мастерской (+ тексты бирок)
//   <!--line1-->, <!--line2-->  — работы на верёвках сушилки
// Заодно проставляет href у ссылок с data-wa="текст" (wa.me с готовым сообщением).
//   node tools/gen-html.mjs
import fs from 'node:fs';

const sizes = JSON.parse(fs.readFileSync('raw/sizes.json', 'utf8'));
const esc = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const WA = 'https://wa.me/79872829232';
const wa = (t) => `${WA}?text=${encodeURIComponent(t)}`;

// Варианты размеров у каждого кадра — как в tools/build-assets.mjs
function variants(name) {
  const ws = Object.keys(sizes).filter((k) => k === name || k.startsWith(name + '-') && /^\d+$/.test(k.slice(name.length + 1)))
    .map((k) => ({ k, w: sizes[k][0], h: sizes[k][1] })).sort((a, b) => a.w - b.w);
  if (!ws.length) throw new Error('нет размеров для ' + name);
  return ws;
}
function picture(name, { alt, sizes: sz, cls = '', small = false }) {
  const v = variants(name);
  const pick = small ? v[0] : v[v.length - 1];
  const srcset = (ext) => v.map((x) => `assets/img/${x.k}.${ext} ${x.w}w`).join(', ');
  return `<picture${cls ? ` class="${cls}"` : ''}><source type="image/webp" srcset="${srcset('webp')}" sizes="${sz}"><img src="assets/img/${v[0].k}.jpg" srcset="${srcset('jpg')}" sizes="${sz}" width="${pick.w}" height="${pick.h}" alt="${esc(alt)}" loading="lazy" decoding="async" draggable="false"></picture>`;
}

// ── Стол мастерской ───────────────────────────────────────────────
// x/y — левый верхний угол в % стола (десктоп), w — ширина карточки в px при 1440, r — поворот.
const TABLE = [
  { id: 'oil', img: 'works/oil-sunset', cap: 'масло', x: 2, y: 4, w: 200, r: -7,
    title: 'Масло на холсте', what: 'масляные краски, холст, кисти — всё даёт студия', who: 'взрослые и дети; можно индивидуально',
    note: 'впервые маслом — тоже можно', alt: 'Закат над морем маслом — первая в жизни работа маслом ученицы студии', ask: 'Здравствуйте! Хочу на мастер-класс маслом.' },
  { id: 'acrylic', img: 'works/acrylic-palms', cap: 'акрил', x: 18, y: 2, w: 270, r: 4,
    title: 'Акрил на холсте', what: 'акриловые краски, холст на мольберте', who: 'взрослые, дети, компании',
    note: 'яркие картины за одно занятие', alt: 'Две картины акрилом: пальмы и бирюзовые волны', ask: 'Здравствуйте! Хочу на мастер-класс по акрилу.' },
  { id: 'relief', img: 'works/relief-mountains', cap: 'мастихин и паста', x: 43, y: 5, w: 250, r: -3,
    title: 'Интерьерная картина', what: 'мастихин и объёмная паста', who: 'взрослые и дети',
    note: 'фактура, которую хочется трогать', alt: 'Интерьерная картина объёмной пастой: белые горы на холсте', ask: 'Здравствуйте! Интересует мастер-класс «интерьерная картина».' },
  { id: 'watercolor', img: 'works/watercolor', cap: 'акварель', x: 64, y: 2, w: 180, r: 7,
    title: 'Акварельная открытка', what: 'акварель и бумага', who: 'дети и взрослые',
    note: 'пока сохнут таба-лапки — успеваем нарисовать', alt: 'Акварельный рисунок с цветами и листьями', ask: 'Здравствуйте! Хочу узнать про занятие акварелью.' },
  { id: 'bento', img: 'works/bento', cap: 'бенто-тортик', x: 80, y: 6, w: 200, r: -5,
    title: 'Бенто-тортик', what: 'маленький торт, который украшаете сами', who: 'и дети, и взрослые',
    note: 'дети и подростки — в полном восторге', alt: 'Бенто-тортик, украшенный красными цветами', ask: 'Здравствуйте! Интересует мастер-класс по бенто-тортикам.' },
  { id: 'moon', tag: true, color: 'var(--ochre)', blot: 1, cap: 'светящаяся луна', x: 8, y: 40, w: 160, r: -9,
    title: 'Светящаяся луна', sub: 'часто дарят сертификатом', what: 'все материалы — студии', who: 'взрослые — и в подарок',
    note: '«умиротворяющее и вдохновляющее занятие»', ask: 'Здравствуйте! Хочу на мастер-класс «светящаяся луна».' },
  { id: 'plate', img: 'works/plate', cap: 'тарелочка', x: 24, y: 40, w: 220, r: 5,
    title: 'Роспись тарелочки', what: 'тарелочка, краски и кисти', who: 'взрослые и дети',
    note: 'педагог объясняет каждый этап', alt: 'Расписанная тарелочка с красными бантиками', ask: 'Здравствуйте! Хочу на мастер-класс по росписи тарелочек.' },
  { id: 'pumpkin', tag: true, color: 'var(--cadmium)', blot: 3, cap: 'тыква к Хеллоуину', x: 46, y: 36, w: 170, r: 8,
    title: 'Тыква к Хеллоуину', sub: 'сезонный мастер-класс', what: 'настоящая тыква и краски', who: 'дети — сезонный мастер-класс',
    note: 'заодно научимся смешивать цвета', ask: 'Здравствуйте! Будет ли мастер-класс по росписи тыквы?' },
  { id: 'clay', img: 'works/clay-turtle', cap: 'лепка', x: 63, y: 38, w: 190, r: -4,
    title: 'Лепка', what: 'пластилин и разные материалы', who: 'дети — на регулярных занятиях',
    note: 'рисуем и лепим — каждый раз по-новому', alt: 'Черепаха из пластилина с крабиками — детская работа', ask: 'Здравствуйте! Хочу узнать про занятия лепкой для ребёнка.' },
  { id: 'gingerbread', img: 'works/gingerbread', cap: 'пряники', x: 3, y: 66, w: 240, r: -6,
    title: 'Роспись пряников', what: 'пряники и цветная глазурь', who: 'дети и взрослые',
    note: 'всё предельно понятно объясняют', alt: 'Расписанные пряники: тыква, привидения и шляпа ведьмы', ask: 'Здравствуйте! Хочу на мастер-класс по росписи пряников.' },
  { id: 'resin', img: 'works/resin', cap: 'эпоксидная смола', x: 32, y: 64, w: 170, r: 9,
    title: 'Эпоксидная смола', what: 'эпоксидная смола — материалы студии', who: 'взрослые',
    note: '«особенно понравилось — очень увлекательно»', alt: 'Поднос из эпоксидной смолы с золотой поталью', ask: 'Здравствуйте! Интересует мастер-класс по эпоксидной смоле.' },
  { id: 'taba', tag: true, color: 'var(--madder)', blot: 2, cap: 'таба-лапка и пончик', x: 52, y: 68, w: 170, r: -7,
    title: 'Таба-лапка и пончик', sub: 'полимерная глина', what: 'полимерная глина', who: 'дети — особенно на дне рождения',
    note: 'модные таба-лапки — дети в восторге', ask: 'Здравствуйте! Хочу мастер-класс «таба-лапки» на день рождения.' },
  { id: 'shopper', img: 'works/shopper-dog', cap: 'шоппер', x: 74, y: 60, w: 220, r: 4,
    title: 'Роспись шоппера', what: 'шоппер и краски', who: 'дети и взрослые, в том числе на праздник',
    note: 'каждый уходит со своей сумкой', alt: 'Шоппер с нарисованной собакой', ask: 'Здравствуйте! Хочу на мастер-класс по росписи шоппера.' },
];

const tableHtml = TABLE.map((t, i) => {
  const style = `--x:${t.x}%;--y:${t.y}%;--w:${t.w};--r:${t.r}deg${t.color ? `;--c:${t.color}` : ''}`;
  const info = `<span class="item-info" data-title="${esc(t.title)}" data-what="${esc(t.what)}" data-who="${esc(t.who)}" data-note="${esc(t.note)}" data-ask="${esc(wa(t.ask))}"></span>`;
  const label = `${t.cap} — ${t.title}, подробнее`;
  if (t.tag) {
    return `        <button class="item item--tag" type="button" style="${style}" aria-label="${esc(label)}" data-cursor="бирка">
          <span class="item-paper"><svg class="item-blot" aria-hidden="true"><use href="#blot-${t.blot}"/></svg><span class="item-tagname">${t.cap}</span><span class="item-tagsub">${t.sub}</span></span>${info}
        </button>`;
  }
  return `        <button class="item" type="button" style="${style}" aria-label="${esc(label)}" data-cursor="бирка">
          <span class="item-paper">${picture(t.img, { alt: t.alt, sizes: '(min-width: 768px) 280px, 64vw', small: true })}<span class="item-cap">${t.cap}</span></span>${info}
        </button>`;
}).join('\n');

// ── Сушилка ───────────────────────────────────────────────────────
// [кадр, alt, музейная этикетка]
const LINE1 = [
  ['works/mermaid', 'Картина с мастер-класса: девушка у воды на закате', 'Работа с мастер-класса · холст'],
  ['works/house', 'Детский рисунок: домик под ярким солнцем', 'Детская работа'],
  ['works/gingerbread', 'Расписанные пряники к Хеллоуину', 'Роспись пряников'],
  ['works/yt-forest', 'Акварельный пейзаж с елями', 'Работа педагога · акварель, из видеоурока'],
  ['works/seascapes', 'Три морских пейзажа на мольбертах', 'Работы с мастер-класса · холст'],
  ['works/shopper-dream', 'Расписанный шоппер с облаками и звёздами', 'Роспись шоппера'],
  ['process/painting-wall', 'Ученица пишет большую картину у стены мансарды', 'Мансарда · процесс'],
  ['works/lion', 'Картина со львом, написанная за одно занятие', 'Работа с мастер-класса'],
  ['works/yt-daisies', 'Барельеф с ромашками', 'Работа педагога · барельеф, из видеоурока'],
  ['works/plate', 'Расписанная тарелочка с бантиками', 'Роспись тарелочки'],
  ['events/wreaths', 'Дети с готовыми работами в студии', 'Детская группа · готовые работы'],
  ['works/toucan', 'Детский рисунок тукана', 'Детская работа'],
  ['interior/party', 'Стол в мансарде, накрытый к празднику', 'Мансарда · стол к празднику'],
  ['works/ballerina', 'Работа в процессе: балерина в белой пачке', 'Работа в процессе · холст'],
  ['works/yt-sakura', 'Акварельная аллея с сакурой', 'Работа педагога · акварель, из видеоурока'],
  ['works/figurines', 'Расписанные фигурки', 'Роспись фигурок'],
];
const LINE2 = [
  ['process/adults-easel', 'Взрослые пишут картины на мастер-классе', 'Мастер-класс · процесс'],
  ['works/sails', 'Картина с парусами на мольберте', 'Работа с занятия · холст'],
  ['works/clay-turtle', 'Черепаха из пластилина', 'Лепка'],
  ['events/birthday-cake', 'День рождения в студии: торт и чаепитие', 'День рождения в студии'],
  ['works/yt-sunrise', 'Яркий рассвет над горами', 'Работа педагога · из видеоурока'],
  ['process/palette-knife', 'Работа мастихином и объёмной пастой', 'Мастихин и объёмная паста · процесс'],
  ['works/relief-mountains', 'Белые горы объёмной пастой', 'Интерьерная картина'],
  ['process/kids-table', 'Детское занятие: рисуют за общим столом', 'Детское занятие'],
  ['works/shopper-galaxy', 'Шоппер с нарисованной галактикой', 'Роспись шоппера'],
  ['works/sailboat', 'Картина с розовым парусником', 'Работа с мастер-класса · холст'],
  ['works/yt-penguin', 'Акварельный пингвин', 'Работа педагога · акварель, из видеоурока'],
  ['process/table-detail', 'Детали стола мастерской: краски, палитры, ваза', 'Мансарда · детали'],
  ['events/canvases', 'Ученики с готовыми яркими холстами', 'Готовые работы'],
  ['works/portrait', 'Детский портрет гуашью', 'Детская работа · портрет'],
  ['works/bento', 'Бенто-тортик с красными цветами', 'Бенто-тортик'],
  ['events/adults-works', 'Взрослые с готовыми картинами после мастер-класса', 'Мастер-класс для взрослых'],
];

let gi = 0;
const lineHtml = (list, h) => list.map(([img, alt, label]) => {
  const v = variants(img); const big = v[v.length - 1];
  const w = Math.round((h * big.w) / big.h);
  const i = gi++;
  return `            <figure class="hang" style="--w:${w}px">
              <svg class="hang-pin" aria-hidden="true"><use href="#clothespin"/></svg>
              <button class="hang-btn" type="button" data-i="${i}" data-full="assets/img/${big.k}" data-label="${esc(label)}" aria-label="${esc(alt)} — смотреть крупно" data-cursor="смотреть">${picture(img, { alt, sizes: `${Math.round(w * 1.1)}px`, small: true })}</button>
            </figure>`;
}).join('\n');

let html = fs.readFileSync('index.html', 'utf8');
const put = (mark, body) => { html = html.replace(new RegExp(`<!--${mark}-->[\\s\\S]*?<!--/${mark}-->`), () => `<!--${mark}-->\n${body}\n<!--/${mark}-->`); };
put('table', tableHtml);
put('line1', lineHtml(LINE1, 260));
put('line2', lineHtml(LINE2, 220));
// ссылки WhatsApp с готовым текстом
html = html.replace(/href="https:\/\/wa\.me\/79872829232[^"]*"([^>]*?)data-wa="([^"]*)"/g, (m, mid, text) => `href="${wa(text.replace(/&quot;/g, '"'))}"${mid}data-wa="${text}"`);
fs.writeFileSync('index.html', html, 'utf8');
console.log('table', TABLE.length, 'line', gi);

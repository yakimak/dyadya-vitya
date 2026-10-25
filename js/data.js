'use strict';

/* ============================================================
   ДАННЫЕ ПОЛНОЙ ВЕРСИИ: предметы, рецепты, улучшения, дороги
   ============================================================ */

const DEBT_TOTAL = 47000;

const ITEM_INFO = {
  hop: { name: 'Хмель', short: 'хмель', color: 0xc0cf82, icon: 'hop' },
  honey: { name: 'Мёд', short: 'мёд', color: 0xffb35c, icon: 'honey' },
  water: { name: 'Вода', short: 'вода', color: 0x9cdcea, icon: 'water' },
  berries: { name: 'Ягоды', short: 'ягоды', color: 0xc96a79, icon: 'berries' },
  mushroom: { name: 'Грибы', short: 'грибы', color: 0xd9c59d, icon: 'mushroom' },
  herb: { name: 'Травы', short: 'травы', color: 0x9bbb72, icon: 'herb' },
  yeast: { name: 'Дрожжи', short: 'дрожжи', color: 0xe0c27a, icon: 'yeast' },
  spring: { name: 'Родниковая вода', short: 'родник', color: 0x9cdcea, icon: 'water' },
};

const RECIPES = {
  mead: {
    key: 'mead',
    name: 'Медовуха «Тихий берег»',
    short: 'Медовуха',
    ingredients: { hop: 1, honey: 2, water: 2 },
    bottles: 18,
    basePrice: 600,
    color: 0xf0b34b,
    desc: 'Мягкая, тёплая, с мёдом и хмелем. Так варил отец.',
    tasting: 'мёд, липа, тёплый хлеб',
    steps: [
      { type: 'balance', name: 'РАЗВОД МЁДА', hint: 'Доведи плотность сусла до зелёной зоны: мёд и вода.', target: 0.58, span: 0.10, points: 15, scale: [8, 16, '°P'] },
      { type: 'hold', name: 'ДРОЖЖИ', hint: 'Прогрей сусло до 22–25°C и держи ровно.', target: 0.60, span: 0.10, duration: 3.8, points: 15, scale: [10, 35, '°C'] },
      { type: 'timing', name: 'ПОДКОРМКА', hint: 'Добавь мёд и питание в три приёма — лови момент.', target: 0.55, span: 0.12, hits: 3, points: 15 },
      { type: 'hold', name: 'ТИХОЕ БРОЖЕНИЕ', hint: 'Держи 18–20°C. Дрожжи не любят спешки.', target: 0.40, span: 0.10, duration: 4.8, points: 15, scale: [10, 30, '°C'] },
    ],
  },
  beer: {
    key: 'beer',
    name: 'Пиво «Отцовское»',
    short: 'Пиво',
    ingredients: { hop: 2, honey: 1, water: 2, yeast: 1 },
    bottles: 24,
    basePrice: 700,
    color: 0xd8a85c,
    desc: 'Плотное, горькое, честное. Рецепт со старой мельницы.',
    tasting: 'солод, хмель, свежий ветер',
    steps: [
      { type: 'hold', name: 'ЗАТИРАНИЕ', hint: 'Держи 63–67°C: солод должен отдать сахар.', target: 0.55, span: 0.10, duration: 4.6, points: 15, scale: [45, 80, '°C'] },
      { type: 'timing', name: 'ХМЕЛЬ', hint: 'Три добавки хмеля — в кипящее сусло.', target: 0.60, span: 0.11, hits: 3, points: 15 },
      { type: 'balance', name: 'ПРОМЫВКА', hint: 'Отрегулируй плотность сусла перед варкой.', target: 0.50, span: 0.10, points: 15, scale: [8, 16, '°P'] },
      { type: 'hold', name: 'БРОЖЕНИЕ', hint: 'Держи 18–20°C. Пиво любит прохладу и терпение.', target: 0.38, span: 0.10, duration: 5.0, points: 15, scale: [12, 28, '°C'] },
    ],
  },
  festival: {
    key: 'festival',
    name: 'Медовуха «Зимний берег»',
    short: 'Зимняя медовуха',
    ingredients: { hop: 2, honey: 2, water: 2, berries: 2, herb: 1 },
    bottles: 28,
    basePrice: 800,
    color: 0xd47b73,
    desc: 'Праздничная: ягоды, травы и много мёда. Для площади.',
    tasting: 'ягоды, травы, дым и фонарики',
    steps: [
      { type: 'balance', name: 'НАСТОЙ ЯГОД', hint: 'Найди баланс ягод, трав и мёда — не перебей аромат.', target: 0.62, span: 0.10, points: 15, scale: [0, 100, '%'] },
      { type: 'timing', name: 'ПРЯНОСТИ', hint: 'Добавляй мёд, ягоды и травы каждый в свой момент.', target: 0.52, span: 0.12, hits: 3, points: 15 },
      { type: 'hold', name: 'БРОЖЕНИЕ', hint: 'Держи 16–18°C: праздничная медовуха любит прохладу.', target: 0.32, span: 0.10, duration: 5.0, points: 15, scale: [12, 26, '°C'] },
      { type: 'timing', name: 'ОСВЕТЛЕНИЕ', hint: 'Сними с осадка — не взболтай праздничный настой.', target: 0.70, span: 0.09, points: 15, hits: 1 },
    ],
  },
  stout: {
    key: 'stout',
    name: 'Стаут «Старая плотина»',
    short: 'Плотинный стаут',
    ingredients: { hop: 2, honey: 1, water: 2, mushroom: 2, spring: 2, yeast: 1 },
    bottles: 20,
    basePrice: 1200,
    color: 0x9a6546,
    desc: 'Тёмный, дымный, с родниковой водой и лесными грибами. Городской заказ.',
    tasting: 'дым, карамель, родник и мох',
    steps: [
      { type: 'hold', name: 'КОПЧЁНЫЙ СОЛОД', hint: 'Держи 63–67°C: солод отдаёт дым и сахар.', target: 0.55, span: 0.10, duration: 4.5, points: 12, scale: [45, 80, '°C'] },
      { type: 'timing', name: 'ХМЕЛЬ', hint: 'Три добавки хмеля — в кипящее сусло.', target: 0.55, span: 0.12, hits: 3, points: 12 },
      { type: 'balance', name: 'РОДНИКОВАЯ ВОДА', hint: 'Отрегулируй плотность на родниковой воде.', target: 0.60, span: 0.10, points: 12, scale: [8, 18, '°P'] },
      { type: 'hold', name: 'БРОЖЕНИЕ', hint: 'Держи 14–16°C: стаут бродит медленно и глубоко.', target: 0.25, span: 0.10, duration: 5.2, points: 12, scale: [12, 24, '°C'] },
      { type: 'timing', name: 'ОСАДОК', hint: 'Сними с осадка — стаут не любит мути.', target: 0.68, span: 0.09, points: 12, hits: 1 },
    ],
  },
};

const UPGRADES = {
  boots: {
    key: 'boots',
    name: 'Сапоги отца',
    desc: 'Скорость +12%. По грязи — как по суше.',
    cost: 2500,
    icon: 'boots',
  },
  kettle: {
    key: 'kettle',
    name: 'Медный котёл',
    desc: 'Качество варки +8. Медь помнит руки.',
    cost: 3500,
    icon: 'kettle',
  },
  lamp: {
    key: 'lamp',
    name: 'Фонарь отца',
    desc: '+1 сердце. Света хватит на двоих.',
    cost: 3000,
    icon: 'lamp',
  },
};

const TRAVEL_POINTS = {
  home: { key: 'home', name: 'Дом', sub: 'двор и огород', x: 220, y: 600, minDay: 1 },
  brewery: { key: 'brewery', name: 'Пивоварня', sub: '«Тихий берег»', x: 5200, y: 600, minDay: 1 },
  mill: { key: 'mill', name: 'Старая мельница', sub: 'лесная дорога', x: 6800, y: 600, minDay: 2 },
  village: { key: 'village', name: 'Площадь', sub: 'фестиваль', x: 8000, y: 600, minDay: 3 },
  dam: { key: 'dam', name: 'Старая плотина', sub: 'родник и туман', x: 9600, y: 600, minDay: 3 },
};

const DAY_INFO = {
  1: { name: 'НОЧЬ ПЕРВАЯ', label: 'Долг', short: 'ночь 1' },
  2: { name: 'ДЕНЬ ВТОРОЙ', label: 'Старая мельница', short: 'день 2' },
  3: { name: 'ВЕЧЕР ТРЕТИЙ', label: 'Тихий берег', short: 'день 3' },
};

const PAYMENTS = { 1: 7000, 2: 15000, 3: 25000 };

const STAGES = {
  INTRO: 'intro',
  GATHER1: 'gather1',
  BREW1: 'brew1',
  PAY1: 'pay1',
  SLEEP1: 'sleep1',
  DAY2_START: 'day2_start',
  MILL: 'mill',
  BREW2: 'brew2',
  DEFENSE: 'defense',
  PAY2: 'pay2',
  SLEEP2: 'sleep2',
  DAY3_START: 'day3_start',
  VILLAGE: 'village',
  BREW3: 'brew3',
  JUDGE: 'judge',
  CITY_ORDER: 'city_order',
  CITY_PREP: 'city_prep',
  CITY_DAM: 'city_dam',
  CITY_DELIVER: 'city_deliver',
  FINALE: 'finale',
  DONE: 'done',
};

const STAGE_OBJECTIVES = {
  [STAGES.INTRO]: 'Поговорить с Борисычем',
  [STAGES.GATHER1]: 'Собрать хмель, мёд и воду для первой медовухи',
  [STAGES.BREW1]: 'Сварить первую медовуху у медного чана',
  [STAGES.PAY1]: 'Продать бутылки и отдать Борисычу 7 000 ₽',
  [STAGES.SLEEP1]: 'Вернуться домой и лечь спать',
  [STAGES.DAY2_START]: 'Поговорить с Борисычем у пивоварни',
  [STAGES.MILL]: 'Найти Пал Палыча на старой мельнице',
  [STAGES.BREW2]: 'Собрать ингредиенты и сварить пиво «Отцовское»',
  [STAGES.DEFENSE]: 'Отбить сборщиков от пивоварни',
  [STAGES.PAY2]: 'Отдать Борисычу 15 000 ₽',
  [STAGES.SLEEP2]: 'Вернуться домой и лечь спать',
  [STAGES.DAY3_START]: 'Идти на площадь «Тихий берег»',
  [STAGES.VILLAGE]: 'Сварить «Зимний берег» для фестиваля',
  [STAGES.BREW3]: 'Сварить «Зимний берег» для фестиваля',
  [STAGES.JUDGE]: 'Отнести медовуху на судейский стол',
  [STAGES.CITY_ORDER]: 'Поговорить с городским покупателем на площади',
  [STAGES.CITY_PREP]: 'Сварить три свежие партии для города: медовуху, пиво и «Зимний берег»',
  [STAGES.CITY_DAM]: 'Найти родниковую воду на старой плотине',
  [STAGES.CITY_DELIVER]: 'Сварить «Плотинный стаут» и отнести заказ Аркадию',
  [STAGES.FINALE]: 'Поговорить с Борисычем',
  [STAGES.DONE]: 'Долг закрыт. Варка продолжается.',
};

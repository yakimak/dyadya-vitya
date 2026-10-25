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
  [STAGES.FINALE]: 'Поговорить с Борисычем',
  [STAGES.DONE]: 'Долг закрыт. Варка продолжается.',
};

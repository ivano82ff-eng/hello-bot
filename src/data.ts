export type Item = {
  id: string;
  emoji: string;
  name: string;
  points: number;
  weight: number;
  quips: string[];
};

export const ITEMS: Item[] = [
  {
    id: 'mug',
    emoji: '☕',
    name: 'Кружка кофе',
    points: 10,
    weight: 20,
    quips: ['Кофе познакомился с полом.', 'Пятно в форме Австралии.', 'Теперь ковёр бодрячком.'],
  },
  {
    id: 'pen',
    emoji: '🖊️',
    name: 'Ручка',
    points: 5,
    weight: 18,
    quips: ['Ручка укатилась под шкаф. Навсегда.', 'Одна ручка — один шаг к хаосу.'],
  },
  {
    id: 'plant',
    emoji: '🪴',
    name: 'Фикус',
    points: 15,
    weight: 14,
    quips: ['Земля теперь везде.', 'Фикус хотел свободы.', 'Пылесос уже плачет.'],
  },
  {
    id: 'phone',
    emoji: '📱',
    name: 'Телефон',
    points: 25,
    weight: 12,
    quips: ['Экран пошёл трещинами, как и планы на вечер.', 'Звонок сброшен. Телефон тоже.'],
  },
  {
    id: 'glasses',
    emoji: '👓',
    name: 'Очки',
    points: 20,
    weight: 11,
    quips: ['Теперь хозяин ищет очки. Очками.', 'Минус две диоптрии, плюс двадцать очков.'],
  },
  {
    id: 'mouse',
    emoji: '🖱️',
    name: 'Мышка',
    points: 18,
    weight: 11,
    quips: ['Курсор ушёл в свободное плавание.', 'Мышку поймал кот. Как и положено.'],
  },
  {
    id: 'donut',
    emoji: '🍩',
    name: 'Пончик',
    points: 12,
    weight: 10,
    quips: ['Упал глазурью вниз. Это закон.', 'Пончик съеден полом.'],
  },
  {
    id: 'headphones',
    emoji: '🎧',
    name: 'Наушники',
    points: 22,
    weight: 8,
    quips: ['Тишина. Наконец-то тишина.', 'Провод намотался на всё, что мог.'],
  },
  {
    id: 'candle',
    emoji: '🕯️',
    name: 'Свечка',
    points: 16,
    weight: 7,
    quips: ['Уют потушен об пол.', 'Пахнет ванилью и безнаказанностью.'],
  },
  {
    id: 'keyboard',
    emoji: '⌨️',
    name: 'Клавиатура',
    points: 30,
    weight: 5,
    quips: ['Клавиша Ctrl улетела дальше всех.', 'Теперь этот текст не набрать.'],
  },
  {
    id: 'laptop',
    emoji: '💻',
    name: 'Ноутбук',
    points: 60,
    weight: 2,
    quips: ['Ты слышал этот звук? Хозяин тоже.', 'Несохранённое ушло вместе с ним.'],
  },
];

export const OWNER_WORK_LINES = [
  'так-так…',
  'ещё один созвон',
  'дедлайн в пятницу',
  'почему тесты красные',
  'кофе почти остыл',
  'Барсик, ты где?',
  'ага, вот эта строчка',
  'ещё пять минуточек',
];

export const OWNER_SUSPICIOUS_LINES = ['хм?', 'что за шум?', 'а?', 'Барсик?', 'опять он…'];

export const OWNER_CATCH_LINES = [
  'БАРСИК!!!',
  'Я ВСЁ ВИДЕЛ!',
  'КОТ, ТЫ ЧТО ДЕЛАЕШЬ',
  'НЕ ТРОГАЙ!',
  'ПЛОХОЙ КОТ!',
];

export const CAT_BUSTED_LINES = [
  'я тут просто мимо шёл',
  'оно само',
  'это гравитация, я ни при чём',
  'я вообще сплю',
  'докажи',
];

export const CAT_HAPPY_LINES = ['мрр', 'ещё!', 'легко', 'мяу-хаос', 'дальше'];

export const RESPAWN_LINES = [
  'Хозяин ставит вещь на место. Наивный.',
  'На столе снова порядок. Ненадолго.',
  'Что-то новое появилось на столе.',
];

export type Rank = { minScore: number; title: string; note: string };

export const RANKS: Rank[] = [
  { minScore: 1500, title: 'Легенда: хозяин перешёл на удалёнку', note: 'В другую квартиру.' },
  { minScore: 900, title: 'Магистр беспорядка', note: 'Стол больше не функционирует как стол.' },
  { minScore: 500, title: 'Специалист по гравитации', note: 'Все опыты подтвердились.' },
  { minScore: 200, title: 'Младший вредитель', note: 'Начало положено, кружка не выжила.' },
  { minScore: 0, title: 'Стажёр хаоса', note: 'Хозяин почти не заметил. Обидно.' },
];

export function rankFor(score: number): Rank {
  return RANKS.find((rank) => score >= rank.minScore) ?? RANKS[RANKS.length - 1];
}

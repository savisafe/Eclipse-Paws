// Authored content for level 1 «Сад первой зари» (ECLIPSE_PAWS_SCENARIO.md §12).
//
// The level is the one the scenario calls approved ("основная концепция утверждена"), so unlike
// the graybox levels it is described here beat by beat: seven named zones, the garden's own
// interactive props, its inhabitants, and the scripted order of events. Adapters map the `art`
// keys below onto the files in `src/assets/decorations/garden` / `src/assets/sprites/npcs`.
//
// Dialogue marked "verbatim" is quoted from the scenario. The rest is a first draft: §15 lists
// "окончательные реплики и имя Садовника в первом уровне" as still open, so these lines stay
// short, stay in character (Лумус — прямо и эмоционально, Нокс — короче и суше) and avoid
// inventing plot beats the scenario does not have.

export type GardenZoneId =
  | 'awakening-meadow'
  | 'long-morning-alley'
  | 'root-descent'
  | 'abandoned-greenhouse'
  | 'gardener-house'
  | 'sundial-square'
  | 'night-path';

export interface GardenZone {
  /** Landmark drawn large enough to be visible from the neighbouring zones (§12). */
  landmark: string;
  id: GardenZoneId;
  title: string;
  xEnd: number;
  xStart: number;
}

export const GARDEN_ZONES: readonly GardenZone[] = [
  {
    id: 'awakening-meadow',
    title: 'Луг пробуждения',
    landmark: 'клумба, в которую упал Лумус',
    xStart: 0,
    xEnd: 760,
  },
  {
    id: 'long-morning-alley',
    title: 'Аллея длинного утра',
    landmark: 'садовые колокольчики',
    xStart: 760,
    xEnd: 1560,
  },
  {
    id: 'root-descent',
    title: 'Корневой спуск',
    landmark: 'живая изгородь',
    xStart: 1560,
    xEnd: 2360,
  },
  {
    id: 'abandoned-greenhouse',
    title: 'Заброшенная теплица',
    landmark: 'водяное колесо',
    xStart: 2360,
    xEnd: 3060,
  },
  {
    id: 'gardener-house',
    title: 'Домик Садовника',
    landmark: 'механическая лейка',
    xStart: 3060,
    xEnd: 3760,
  },
  {
    id: 'sundial-square',
    title: 'Площадь солнечных часов',
    landmark: 'древние солнечные часы',
    xStart: 3760,
    xEnd: 4460,
  },
  {
    id: 'night-path',
    title: 'Ночная тропа к Вратам',
    landmark: 'Врата воспоминаний',
    xStart: 4460,
    xEnd: 5200,
  },
];

export type GardenPropArt =
  | 'light-flower'
  | 'garden-bells'
  | 'living-hedge'
  | 'ancient-sundial'
  | 'memory-statue'
  | 'watering-can'
  | 'parachute-seed'
  | 'water-sluice'
  | 'memory-gate';

/** Which cat's power the prop answers to — light, shadow, or either. */
export type GardenPropOwner = 'luma' | 'nox' | 'any';

export type GardenPropRole =
  // Opens under Лумус' light and then works as a soft trampoline (§12).
  | 'flower-trampoline'
  // Opens under light and releases pollen that shows Элиас' trail.
  | 'flower-trail'
  // Answers to Оглушающий крик — the level's safe introduction to the ability.
  | 'bells'
  // Blocks the path until Лумус holds the branches aside.
  | 'hedge'
  // A remote switch: reachable only with Нокс' Теневой наскок.
  | 'hedge-switch'
  // The level's main mechanism: light half + shadow half, together they move the dream's time.
  | 'sundial-light'
  | 'sundial-shadow'
  // Story props: a statue speaks differently to each cat, the watering can is a cat joke.
  | 'statue'
  | 'watering-can'
  // A seed you can glide down on, and the sluice that raises leaves into a path.
  | 'parachute-seed'
  | 'water-sluice'
  // The gate the level ends at; it only opens after the hounds are gone.
  | 'gate';

export interface GardenProp {
  art: GardenPropArt;
  hint: string;
  id: string;
  /** Line shown when the prop answers; two lines when day and night differ. */
  lineDay: string;
  lineNight?: string;
  owner: GardenPropOwner;
  role: GardenPropRole;
  x: number;
  y: number;
  zone: GardenZoneId;
}

export const GARDEN_PROPS: readonly GardenProp[] = [
  {
    id: 'bells-alley',
    role: 'bells',
    art: 'garden-bells',
    owner: 'luma',
    x: 900,
    y: 545,
    zone: 'long-morning-alley',
    hint: 'Крикни рядом [1]',
    lineDay: 'Колокольчики отвечают. Где-то в аллее просыпается закрытый цветок.',
  },
  {
    id: 'flower-alley',
    role: 'flower-trampoline',
    art: 'light-flower',
    owner: 'luma',
    x: 1180,
    y: 560,
    zone: 'long-morning-alley',
    hint: 'Раскрыть светом [E]',
    lineDay: 'Цветок раскрылся. На него можно запрыгнуть.',
    lineNight: 'Ночью цветок закрыт — здесь больше не пройти.',
  },
  {
    id: 'statue-alley',
    role: 'statue',
    art: 'memory-statue',
    owner: 'any',
    x: 1420,
    y: 520,
    zone: 'long-morning-alley',
    hint: 'Рассмотреть [E]',
    lineDay: 'У неё стёрли лицо. А руки всё равно кого-то держат.',
    lineNight: 'Она говорит одно слово. Кажется, это имя.',
  },
  {
    id: 'hedge-descent',
    role: 'hedge',
    art: 'living-hedge',
    owner: 'luma',
    x: 1620,
    y: 545,
    zone: 'root-descent',
    hint: 'Отвести ветви светом [E]',
    lineDay: 'Изгородь тянется к свету. Проход открыт ненадолго.',
  },
  {
    id: 'hedge-switch-descent',
    role: 'hedge-switch',
    art: 'living-hedge',
    owner: 'nox',
    x: 1980,
    y: 430,
    zone: 'root-descent',
    hint: 'Теневой наскок [1]',
    lineDay: 'Переключатель щёлкнул. Изгородь запомнила, что её просили открыться.',
  },
  {
    id: 'seed-descent',
    role: 'parachute-seed',
    art: 'parachute-seed',
    owner: 'any',
    x: 2270,
    y: 470,
    zone: 'root-descent',
    hint: 'Схватиться в прыжке',
    lineDay: 'Семя-парашют держит кота. Сад виден до самой башни.',
  },
  {
    id: 'flower-greenhouse',
    role: 'flower-trampoline',
    art: 'light-flower',
    owner: 'luma',
    x: 2600,
    y: 600,
    zone: 'abandoned-greenhouse',
    hint: 'Раскрыть светом [E]',
    lineDay: 'Верхний путь через теплицу открыт.',
    lineNight: 'Ночью цветок закрыт — здесь больше не пройти.',
  },
  {
    id: 'sluice-greenhouse',
    role: 'water-sluice',
    art: 'water-sluice',
    owner: 'any',
    x: 2940,
    y: 610,
    zone: 'abandoned-greenhouse',
    hint: 'Повернуть шлюз [E]',
    lineDay: 'Вода пошла другим руслом. Широкие листья поднялись из канала.',
  },
  {
    id: 'flower-trail-house',
    role: 'flower-trail',
    art: 'light-flower',
    owner: 'luma',
    x: 3200,
    y: 580,
    zone: 'gardener-house',
    hint: 'Раскрыть светом [E]',
    lineDay: 'Пыльца легла на след. Кто-то прошёл здесь и не оглянулся.',
  },
  {
    id: 'watering-can-house',
    role: 'watering-can',
    art: 'watering-can',
    owner: 'any',
    x: 3380,
    y: 600,
    zone: 'gardener-house',
    hint: 'Тронуть лапой [E]',
    lineDay: 'Лейка просыпается и поливает Нокса. Нокс делает вид, что так и задумано.',
  },
  {
    id: 'statue-house',
    role: 'statue',
    art: 'memory-statue',
    owner: 'any',
    x: 3620,
    y: 540,
    zone: 'gardener-house',
    hint: 'Рассмотреть [E]',
    lineDay: 'Двое. Один выше. Второй смеётся.',
    lineNight: 'Второго здесь давно нет. Первый всё ещё ждёт.',
  },
  {
    id: 'sundial-light',
    role: 'sundial-light',
    art: 'ancient-sundial',
    owner: 'luma',
    x: 4060,
    y: 555,
    zone: 'sundial-square',
    hint: 'Разбудить свет [E]',
    lineDay: 'Свет внутри механизма проснулся. Не хватает тени.',
  },
  {
    id: 'sundial-shadow',
    role: 'sundial-shadow',
    art: 'ancient-sundial',
    owner: 'nox',
    x: 4180,
    y: 555,
    zone: 'sundial-square',
    hint: 'Освободить тень [E]',
    lineDay: 'Тень стрелки сдвинулась впервые за очень долгое утро.',
  },
  {
    id: 'memory-gate',
    role: 'gate',
    art: 'memory-gate',
    owner: 'any',
    x: 5080,
    y: 540,
    zone: 'night-path',
    hint: 'Врата воспоминаний',
    lineDay: 'Врата открываются только после заката.',
    lineNight: 'За вратами — отпечаток ладони на стене сна и короткое эхо голоса Элиаса.',
  },
];

/** Which of the four drawn moods the line is spoken in (see `src/assets/portraits`). */
export type GardenEmotion = 'neutral' | 'joy' | 'worry' | 'resolve';

export interface GardenSpokenLine {
  emotion?: GardenEmotion;
  speaker: string;
  text: string;
}

export interface GardenNpc {
  /** Portrait/sprite family under `src/assets`. */
  art: 'gardener' | 'sun-little-one';
  /** What the day-time character shows: a pleasant memory (§12). */
  dayLines: readonly GardenSpokenLine[];
  id: string;
  name: string;
  /** What its night shadow says: the feeling hidden inside that memory (§12). */
  nightLines: readonly GardenSpokenLine[];
  x: number;
  y: number;
  zone: GardenZoneId;
}

// Note on the little ones' moods: their «worry»/«resolve» portraits are the cold night version of
// the creature, so their day lines stay on «joy»/«neutral» — the night side of the conversation is
// carried by the shadow's own portrait instead (§12).
export const GARDEN_NPCS: readonly GardenNpc[] = [
  {
    id: 'little-one-alley',
    name: 'Солнечный малыш',
    art: 'sun-little-one',
    x: 1050,
    y: 560,
    zone: 'long-morning-alley',
    dayLines: [
      {
        speaker: 'Солнечный малыш',
        text: 'Доброе утро! Оно у нас длинное. Самое длинное, какое я помню.',
        emotion: 'joy',
      },
      {
        speaker: 'Солнечный малыш',
        text: 'А закат? Закат я не помню совсем. Наверное, его никогда и не было.',
        emotion: 'neutral',
      },
    ],
    nightLines: [
      {
        speaker: 'Тень малыша',
        text: 'Я помню закат. Просто мне велели забыть, что он бывает.',
        emotion: 'worry',
      },
    ],
  },
  {
    id: 'little-one-greenhouse',
    name: 'Солнечный малыш',
    art: 'sun-little-one',
    x: 2660,
    y: 600,
    zone: 'abandoned-greenhouse',
    dayLines: [
      {
        speaker: 'Солнечный малыш',
        text: 'Здесь раньше кто-то работал. Он гладил листья и говорил с ними.',
        emotion: 'joy',
      },
      {
        speaker: 'Солнечный малыш',
        text: 'Потом перестал приходить. Но лейка всё ещё его ждёт.',
        emotion: 'neutral',
      },
    ],
    nightLines: [
      {
        speaker: 'Тень малыша',
        text: 'Он приходил не к цветам. Ему просто некуда было идти.',
        emotion: 'worry',
      },
    ],
  },
  {
    id: 'gardener',
    name: 'Садовник',
    art: 'gardener',
    x: 3480,
    y: 545,
    zone: 'gardener-house',
    // Verbatim from §12, «Новый персонаж — Садовник» — a four-line exchange, so each line names
    // and shows its own speaker on the card.
    dayLines: [
      {
        speaker: 'Лумус',
        text: 'Мы ищем нашего хозяина. Высокий, седой, пахнет книгами и вечно забывает поесть.',
        emotion: 'joy',
      },
      {
        speaker: 'Садовник',
        text: 'Здесь проходил тот, кто помнил каждый цветок, но не узнавал ни одного.',
        emotion: 'neutral',
      },
      { speaker: 'Нокс', text: 'Куда он пошёл?', emotion: 'neutral' },
      {
        speaker: 'Садовник',
        text: 'Туда, где сад заканчивается. Но Врата открываются ночью, а наша заря давно разучилась уходить.',
        emotion: 'worry',
      },
    ],
    nightLines: [
      {
        speaker: 'Садовник',
        text: 'Значит, всё-таки умеет уходить. Идите. Я подожду здесь, как умею.',
        emotion: 'resolve',
      },
    ],
  },
  {
    id: 'little-one-night-path',
    name: 'Солнечный малыш',
    art: 'sun-little-one',
    x: 4700,
    y: 560,
    zone: 'night-path',
    dayLines: [
      {
        speaker: 'Солнечный малыш',
        text: 'Дальше я не хожу. Там тропа заканчивается, а я боюсь заканчиваться.',
        emotion: 'neutral',
      },
    ],
    // Verbatim from §12, «Перелом».
    nightLines: [
      {
        speaker: 'Тень малыша',
        text: 'Тише. Теперь сон знает, что вы не его воспоминание.',
        emotion: 'worry',
      },
    ],
  },
];

/** Ordered script of the level. The story system walks this list from top to bottom. */
export type GardenBeatId =
  | 'landing'
  | 'frozen-morning'
  | 'gardener-met'
  | 'nightfall'
  | 'warning'
  | 'quake'
  | 'day-returns'
  | 'hounds-cleared'
  | 'gate-open';

export interface GardenBeat {
  id: GardenBeatId;
  lines: readonly GardenSpokenLine[];
}

export const GARDEN_BEATS: readonly GardenBeat[] = [
  {
    id: 'landing',
    lines: [
      {
        speaker: 'Лумус',
        text: 'Мяу. Я в клумбе. Клумба мягкая. Всё под контролем.',
        emotion: 'joy',
      },
      {
        speaker: 'Нокс',
        text: 'Из клумбы торчат только твои уши. Идём, свет.',
        emotion: 'neutral',
      },
    ],
  },
  {
    id: 'frozen-morning',
    lines: [
      { speaker: 'Лумус', text: 'Здесь тепло. Но утро не двигается с места.', emotion: 'neutral' },
      {
        speaker: 'Нокс',
        text: 'Солнце стоит. Роса не сохнет. Тени не переезжали с ночи.',
        emotion: 'worry',
      },
      {
        speaker: 'Лумус',
        text: 'Значит, найдём хозяина и разбудим его. Он объяснит.',
        emotion: 'resolve',
      },
    ],
  },
  {
    id: 'gardener-met',
    lines: [
      { speaker: 'Нокс', text: 'Врата открываются ночью. Ночи здесь нет.', emotion: 'worry' },
      {
        speaker: 'Лумус',
        text: 'Тогда сделаем ночь сами. Ты видел те часы на площади?',
        emotion: 'resolve',
      },
    ],
  },
  {
    id: 'nightfall',
    lines: [
      { speaker: 'Голос сна', text: 'Сад впервые за очень долгое время закрывает глаза.' },
      { speaker: 'Нокс', text: 'Держись рядом. Ночью веду я.', emotion: 'resolve' },
    ],
  },
  {
    id: 'warning',
    lines: [
      {
        speaker: 'Тень малыша',
        text: 'Тише. Теперь сон знает, что вы не его воспоминание.',
        emotion: 'worry',
      },
    ],
  },
  {
    id: 'quake',
    lines: [
      { speaker: 'Голос сна', text: 'Небо трескается, как стекло лабораторной сферы.' },
      {
        speaker: 'Нокс',
        text: 'Гончие. Они не живые — это сон выставил охрану. За спину, Лумус.',
        emotion: 'resolve',
      },
    ],
  },
  {
    id: 'day-returns',
    lines: [
      { speaker: 'Голос сна', text: 'Механизм срывается. Утро возвращается рывком.' },
      {
        speaker: 'Лумус',
        text: 'Моя очередь. Крикну — они замрут, а ты отдышись.',
        emotion: 'resolve',
      },
    ],
  },
  {
    id: 'hounds-cleared',
    lines: [
      {
        speaker: 'Садовник',
        text: 'Если найдёте его, скажите: сад не сердится. Он умеет ждать.',
        emotion: 'joy',
      },
      {
        speaker: 'Лумус',
        text: 'Семя светится и темнеет одновременно. Возьмём с собой.',
        emotion: 'joy',
      },
    ],
  },
  {
    id: 'gate-open',
    lines: [
      {
        speaker: 'Нокс',
        text: 'Отпечаток ладони. Он был здесь и пошёл глубже.',
        emotion: 'neutral',
      },
      { speaker: 'Лумус', text: 'Тогда и мы глубже. Он не любит ждать один.', emotion: 'resolve' },
    ],
  },
];

// Authored content for level 1 «Сад первой зари» (ECLIPSE_PAWS_SCENARIO.md §12).
//
// The level is the one the scenario calls approved ("основная концепция утверждена"), so unlike
// the graybox levels it is described here beat by beat: seven named zones, the garden's own
// interactive props, its inhabitants, and the scripted order of events. Adapters map the `art`
// keys below onto the files in `src/assets/decorations/garden` / `src/assets/sprites/npcs`.
//
// Dialogue marked "verbatim" is quoted from the scenario. The rest is a first draft: §15 lists
// "окончательные реплики и имя Садовника в первом уровне" as still open, so these lines stay
// short, stay in character (Люмус — прямо и эмоционально, Нокс — короче и суше) and avoid
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
    landmark: 'клумба, в которую упал Люмус',
    xStart: 0,
    xEnd: 910,
  },
  {
    id: 'long-morning-alley',
    title: 'Аллея длинного утра',
    landmark: 'садовые колокольчики',
    xStart: 910,
    xEnd: 1870,
  },
  {
    id: 'root-descent',
    title: 'Корневой спуск',
    landmark: 'живая изгородь',
    xStart: 1870,
    xEnd: 2830,
  },
  {
    id: 'abandoned-greenhouse',
    title: 'Заброшенная теплица',
    landmark: 'водяное колесо',
    xStart: 2830,
    xEnd: 3670,
  },
  {
    id: 'gardener-house',
    title: 'Домик Садовника',
    landmark: 'механическая лейка',
    xStart: 3670,
    xEnd: 4510,
  },
  {
    id: 'sundial-square',
    title: 'Площадь солнечных часов',
    landmark: 'древние солнечные часы',
    xStart: 4510,
    xEnd: 5350,
  },
  {
    id: 'night-path',
    title: 'Ночная тропа к Вратам',
    landmark: 'Врата воспоминаний',
    xStart: 5350,
    xEnd: 6240,
  },
];

export type GardenPropArt =
  'light-flower' | 'garden-bells' | 'living-hedge' | 'ancient-sundial' | 'memory-gate';

/** Which cat's power the prop answers to — light, shadow, or either. */
export type GardenPropOwner = 'luma' | 'nox' | 'any';

export type GardenPropRole =
  // Opens under Люмус' light and then works as a soft trampoline (§12).
  | 'flower-trampoline'
  // Opens under light and releases pollen that shows Элиас' trail.
  | 'flower-trail'
  // Answers to Оглушающий крик — the level's safe introduction to the ability.
  | 'bells'
  // Blocks the path until Люмус holds the branches aside.
  | 'hedge'
  // A remote switch: reachable only with Нокс' Теневой наскок.
  | 'hedge-switch'
  // The level's main mechanism: light half + shadow half, together they move the dream's time.
  | 'sundial-light'
  | 'sundial-shadow'
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
    x: 1080,
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
    x: 1416,
    y: 560,
    zone: 'long-morning-alley',
    hint: 'Раскрыть светом [E]',
    lineDay: 'Цветок раскрылся. На него можно запрыгнуть.',
    lineNight: 'Ночью цветок закрыт — здесь больше не пройти.',
  },
  {
    id: 'hedge-descent',
    role: 'hedge',
    art: 'living-hedge',
    owner: 'luma',
    x: 1944,
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
    x: 2100,
    y: 500,
    zone: 'root-descent',
    hint: 'Синий бутон: Теневой наскок [1]',
    lineDay: 'Переключатель щёлкнул. Изгородь запомнила, что её просили открыться.',
  },
  {
    id: 'flower-trail-house',
    role: 'flower-trail',
    art: 'light-flower',
    owner: 'luma',
    x: 3840,
    y: 580,
    zone: 'gardener-house',
    hint: 'Раскрыть светом [E]',
    lineDay: 'Пыльца легла на след. Кто-то прошёл здесь и не оглянулся.',
  },
  {
    id: 'sundial-light',
    role: 'sundial-light',
    art: 'ancient-sundial',
    owner: 'luma',
    x: 4872,
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
    x: 5016,
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
    x: 6096,
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
    x: 1260,
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
    id: 'gardener',
    name: 'Садовник',
    art: 'gardener',
    x: 4176,
    y: 545,
    zone: 'gardener-house',
    // Verbatim from §12, «Новый персонаж — Садовник» — a four-line exchange, so each line names
    // and shows its own speaker on the card.
    dayLines: [
      {
        speaker: 'Люмус',
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
    x: 5640,
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
        speaker: 'Люмус',
        text: 'Мяу. Я в клумбе. Клумба мягкая. Всё под контролем.',
        emotion: 'joy',
      },
      {
        speaker: 'Нокс',
        text: 'Из клумбы торчат только твои уши. Идём.',
        emotion: 'neutral',
      },
    ],
  },
  {
    id: 'frozen-morning',
    lines: [
      { speaker: 'Люмус', text: 'Здесь тепло. Но утро не двигается с места.', emotion: 'neutral' },
      {
        speaker: 'Нокс',
        text: 'Солнце стоит. Роса не сохнет. Тени не переезжали с ночи.',
        emotion: 'worry',
      },
      {
        speaker: 'Люмус',
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
        speaker: 'Люмус',
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
        text: 'Гончие. Они не живые — это сон выставил охрану. За спину, Люмус.',
        emotion: 'resolve',
      },
    ],
  },
  {
    id: 'day-returns',
    lines: [
      { speaker: 'Голос сна', text: 'Механизм срывается. Утро возвращается рывком.' },
      {
        speaker: 'Люмус',
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
        speaker: 'Люмус',
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
      { speaker: 'Люмус', text: 'Тогда и мы глубже. Он не любит ждать один.', emotion: 'resolve' },
    ],
  },
];

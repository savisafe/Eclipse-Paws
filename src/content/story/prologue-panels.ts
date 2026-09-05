import type { SlidePanel } from './slide-panel';
import panel01 from '../../assets/story/prologue/01-wizard-who-healed-v1.png?url';
import panel02 from '../../assets/story/prologue/02-wounds-without-marks-v1.png?url';
import panel03 from '../../assets/story/prologue/03-impossible-question-v1.png?url';
import panel04 from '../../assets/story/prologue/04-somnium-v1.png?url';
import panel05 from '../../assets/story/prologue/05-collapse-v1.png?url';
import panel06 from '../../assets/story/prologue/06-eternal-sleep-v1.png?url';
import panel07 from '../../assets/story/prologue/07-door-into-dream-v1.png?url';
import panel08 from '../../assets/story/prologue/08-first-step-v1.png?url';

// COM-010/COM-001: captions are verbatim narrator/character lines from
// ECLIPSE_PAWS_SCENARIO.md §10 ("Между двумя ударами") — not invented here. Panel 5 has no
// caption because the scenario explicitly says "Текст отсутствует" for that slide (the collapse
// is meant to be read visually, not narrated).
export const PROLOGUE_PANELS: readonly SlidePanel[] = [
  {
    id: 'prologue-01',
    imageUrl: panel01,
    caption: 'Говорили, Элиас прожил тысячу лет. За это время он научился лечить почти всё.',
  },
  {
    id: 'prologue-02',
    imageUrl: panel02,
    caption: 'Но некоторые раны не оставляли следов на теле. И всё же болели сильнее любых других.',
  },
  {
    id: 'prologue-03',
    imageUrl: panel03,
    caption:
      'Каждая чужая утрата напоминала ему о собственных. Однажды помощь стала поиском. ' +
      'Поиск — обещанием. А обещание — одержимостью.',
  },
  {
    id: 'prologue-04',
    imageUrl: panel04,
    caption:
      '«Я не стану отнимать память. Я только отделю от неё боль». Первым он решил исцелить самого себя.',
  },
  {
    id: 'prologue-05',
    imageUrl: panel05,
  },
  {
    id: 'prologue-06',
    imageUrl: panel06,
    caption: 'Лумус: «Он дышит». Нокс: «Но его здесь нет».',
  },
  {
    id: 'prologue-07',
    imageUrl: panel07,
    caption:
      'Лумус: «Тогда мы найдём его там». Нокс: «И если сон не захочет нас отпустить?» ' +
      'Лумус: «Будем держаться друг за друга».',
  },
  {
    id: 'prologue-08',
    imageUrl: panel08,
    caption:
      'Так два маленьких хранителя вошли в разум, которому тысячи лет. Один нёс свет, чтобы ' +
      'найти дорогу. Другой — тьму, чтобы дорога помнила, куда ведёт.',
  },
];

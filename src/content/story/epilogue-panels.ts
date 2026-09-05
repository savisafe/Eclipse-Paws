import type { SlidePanel } from './slide-panel';
import panel01 from '../../assets/story/epilogue/01-second-tick-v1.png?url';
import panel02 from '../../assets/story/epilogue/02-cats-return-v1.png?url';
import panel03 from '../../assets/story/epilogue/03-formula-without-answer-v1.png?url';
import panel04 from '../../assets/story/epilogue/04-not-magic-pill-v1.png?url';
import panel05 from '../../assets/story/epilogue/05-ordinary-kind-deeds-v1.png?url';
import panel06 from '../../assets/story/epilogue/06-learning-to-listen-v1.png?url';
import panel07 from '../../assets/story/epilogue/07-two-lanterns-v1.png?url';
import panel08 from '../../assets/story/epilogue/08-home-v1.png?url';

// COM-101/COM-101A: captions are verbatim narrator/character lines from ECLIPSE_PAWS_SCENARIO.md
// (эпилог «Те, кто остаются рядом»). Panels 5 and 7 have no caption — the scenario describes them
// purely visually, without a quoted line, so none is invented here.
export const EPILOGUE_PANELS: readonly SlidePanel[] = [
  {
    id: 'epilogue-01',
    imageUrl: panel01,
    caption: 'Для мира прошло меньше секунды. Для троих странников — целая жизнь.',
  },
  {
    id: 'epilogue-02',
    imageUrl: panel02,
    caption: 'Элиас: «Вы нашли меня».',
  },
  {
    id: 'epilogue-03',
    imageUrl: panel03,
    caption:
      'Он искал заклинание, способное вынуть боль из сердца и не потревожить любовь. Но ' +
      'любовь и боль держались за одну нить. «Не лекарство от памяти. Путь через неё».',
  },
  {
    id: 'epilogue-04',
    imageUrl: panel04,
    caption:
      'Нет заклинания, после которого утрата перестаёт иметь значение. Есть время. Есть ' +
      'память. Есть те, кто садится рядом, когда слов недостаточно.',
  },
  {
    id: 'epilogue-05',
    imageUrl: panel05,
  },
  {
    id: 'epilogue-06',
    imageUrl: panel06,
    caption:
      'Иногда помощь начиналась не с ответа. Иногда она начиналась с того, что человеку ' +
      'больше не приходилось оставаться со своей болью одному.',
  },
  {
    id: 'epilogue-07',
    imageUrl: panel07,
  },
  {
    id: 'epilogue-08',
    imageUrl: panel08,
    caption: 'Элиас: «Боль не исчезла. Но рядом с ней снова появилось место для жизни».',
  },
];

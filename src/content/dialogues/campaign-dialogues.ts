import type { CampaignLevelId } from '../levels/campaign-levels';

export interface DialogueBeat {
  speaker: 'Кокс' | 'Боня' | 'Эйлара';
  text: string;
  tone: 'light' | 'shadow' | 'world';
}

export const CAMPAIGN_DIALOGUES: Readonly<Record<CampaignLevelId, readonly DialogueBeat[]>> = {
  'garden-first-dawn': [
    { speaker: 'Кокс', text: 'Маятник молчит… но я всё ещё слышу твоё сердце.', tone: 'light' },
    {
      speaker: 'Боня',
      text: 'Держись ближе. Если тьма поглотит одного, второй станет дорогой домой.',
      tone: 'shadow',
    },
  ],
  'whispering-forest': [
    {
      speaker: 'Эйлара',
      text: 'Лес повторяет только те слова, которые путники боятся произнести.',
      tone: 'world',
    },
    { speaker: 'Боня', text: 'Тогда пусть он запомнит: я тебя не оставлю.', tone: 'shadow' },
  ],
  'sky-library': [
    {
      speaker: 'Кокс',
      text: 'Во всех книгах финал уже написан. Но ни один не знает нас.',
      tone: 'light',
    },
    { speaker: 'Боня', text: 'Значит, последнюю страницу напишем вместе.', tone: 'shadow' },
  ],
  'clock-fortress': [
    {
      speaker: 'Боня',
      text: 'Когда часы остановятся, скажи то, что хранил от меня.',
      tone: 'shadow',
    },
    { speaker: 'Кокс', text: 'Скажу. Даже если рассвет окажется последним.', tone: 'light' },
  ],
  'eclipse-heart': [
    {
      speaker: 'Кокс',
      text: 'I love you. Не как свет любит побеждать тьму — как рассвет любит ночь.',
      tone: 'light',
    },
    {
      speaker: 'Боня',
      text: 'I love you too. Поэтому мы не исчезнем друг в друге. Мы станем затмением.',
      tone: 'shadow',
    },
    {
      speaker: 'Эйлара',
      text: 'Два голоса совпали. Маятник снова делает первый вздох.',
      tone: 'world',
    },
  ],
};

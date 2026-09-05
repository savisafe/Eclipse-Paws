import type { CampaignLevelId } from '../levels/campaign-levels';

// Placeholder dialogue for the graybox pass (see campaign-levels.ts). Real per-level dialogue is
// Narrative Agent scope (ECLIPSE_PAWS_RECONSTRUCTION_PLAN.md §5 role table) — these lines are
// intentionally short and generic, using only the canon names Лумус/Нокс, and do not invent
// specific plot beats that belong to a future narrative pass.
export interface DialogueBeat {
  speaker: 'Лумус' | 'Нокс' | 'Голос сна';
  text: string;
  tone: 'light' | 'shadow' | 'world';
}

export const CAMPAIGN_DIALOGUES: Readonly<Record<CampaignLevelId, readonly DialogueBeat[]>> = {
  'garden-first-dawn': [
    { speaker: 'Лумус', text: 'Здесь тепло. Но утро не двигается с места.', tone: 'light' },
    { speaker: 'Нокс', text: 'Значит, кто-то держит его силой. Идём дальше.', tone: 'shadow' },
  ],
  'whispering-lanterns': [
    { speaker: 'Нокс', text: 'Фонари не гаснут сами. Кто-то их бережёт.', tone: 'shadow' },
    { speaker: 'Лумус', text: 'Тогда мы поможем нести свет дальше.', tone: 'light' },
  ],
  'midday-clock-city': [
    { speaker: 'Лумус', text: 'Все спешат. Никто не смотрит на часы.', tone: 'light' },
    { speaker: 'Нокс', text: 'Может, поэтому они и остановились.', tone: 'shadow' },
  ],
  'unread-letters-sea': [
    { speaker: 'Голос сна', text: 'Здесь хранится всё, что не было прочитано.', tone: 'world' },
    { speaker: 'Нокс', text: 'Тогда прочитаем то, что важно сейчас.', tone: 'shadow' },
  ],
  'forgotten-smiles-carnival': [
    { speaker: 'Лумус', text: 'Праздник красивый. Но повторяется по кругу.', tone: 'light' },
    { speaker: 'Нокс', text: 'Значит, выход не в музыке, а за ней.', tone: 'shadow' },
  ],
  'last-star-field': [
    { speaker: 'Нокс', text: 'Тихо. Но тишина здесь не пустая.', tone: 'shadow' },
    { speaker: 'Лумус', text: 'Останемся рядом столько, сколько нужно.', tone: 'light' },
  ],
  'eternal-sleep-heart': [
    { speaker: 'Лумус', text: 'Мы дошли. Дальше — только вместе.', tone: 'light' },
    { speaker: 'Нокс', text: 'Держись. Тень доведёт свет до двери.', tone: 'shadow' },
  ],
};

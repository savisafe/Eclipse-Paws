import gardenUrl from '../../assets/environments/dream-garden-first-dawn-v1.jpg?url';
import forestUrl from '../../assets/environments/dream-whispering-lanterns-v1.jpg?url';
import cityUrl from '../../assets/environments/dream-midday-clock-city-v1.jpg?url';
import seaUrl from '../../assets/environments/dream-unread-letters-sea-v1.jpg?url';
import carnivalUrl from '../../assets/environments/dream-forgotten-smiles-carnival-v1.jpg?url';
import fieldUrl from '../../assets/environments/dream-last-star-field-v1.jpg?url';
import heartUrl from '../../assets/environments/dream-eternal-sleep-heart-v1.jpg?url';

export type DreamEnvironmentId =
  | 'garden-first-dawn'
  | 'whispering-lanterns'
  | 'midday-clock-city'
  | 'unread-letters-sea'
  | 'forgotten-smiles-carnival'
  | 'last-star-field'
  | 'eternal-sleep-heart';

export interface DreamEnvironmentArt {
  accent: number;
  ambient: 'seeds' | 'fireflies' | 'dust' | 'letters' | 'confetti' | 'stars' | 'memory';
  id: DreamEnvironmentId;
  imageUrl: string;
  motion: 'breathe' | 'drift' | 'pulse';
  title: string;
}

export const DREAM_ENVIRONMENTS: readonly DreamEnvironmentArt[] = [
  {
    id: 'garden-first-dawn',
    title: 'Сад первой зари',
    imageUrl: gardenUrl,
    accent: 0xffd978,
    ambient: 'seeds',
    motion: 'breathe',
  },
  {
    id: 'whispering-lanterns',
    title: 'Лес шепчущих фонарей',
    imageUrl: forestUrl,
    accent: 0x78f4dc,
    ambient: 'fireflies',
    motion: 'pulse',
  },
  {
    id: 'midday-clock-city',
    title: 'Город тысячи полуденных часов',
    imageUrl: cityUrl,
    accent: 0xffbd68,
    ambient: 'dust',
    motion: 'drift',
  },
  {
    id: 'unread-letters-sea',
    title: 'Море непрочитанных писем',
    imageUrl: seaUrl,
    accent: 0x8ee9ef,
    ambient: 'letters',
    motion: 'breathe',
  },
  {
    id: 'forgotten-smiles-carnival',
    title: 'Карнавал забытых улыбок',
    imageUrl: carnivalUrl,
    accent: 0xff9f78,
    ambient: 'confetti',
    motion: 'pulse',
  },
  {
    id: 'last-star-field',
    title: 'Поле последней звезды',
    imageUrl: fieldUrl,
    accent: 0xd9e7ff,
    ambient: 'stars',
    motion: 'drift',
  },
  {
    id: 'eternal-sleep-heart',
    title: 'Сердце вечного сна',
    imageUrl: heartUrl,
    accent: 0xc49aff,
    ambient: 'memory',
    motion: 'breathe',
  },
];

export function environmentForLevel(levelIndex: number): DreamEnvironmentArt {
  return DREAM_ENVIRONMENTS[Math.min(Math.max(levelIndex - 1, 0), DREAM_ENVIRONMENTS.length - 1)]!;
}

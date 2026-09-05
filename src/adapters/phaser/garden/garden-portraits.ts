import Phaser from 'phaser';
import gardenerJoy from '../../../assets/portraits/cards/gardener-joy-v1.png?url';
import gardenerNeutral from '../../../assets/portraits/cards/gardener-neutral-v1.png?url';
import gardenerResolve from '../../../assets/portraits/cards/gardener-resolve-v1.png?url';
import gardenerWorry from '../../../assets/portraits/cards/gardener-worry-v1.png?url';
import lumusJoy from '../../../assets/portraits/cards/lumus-joy-v1.png?url';
import lumusNeutral from '../../../assets/portraits/cards/lumus-neutral-v1.png?url';
import lumusResolve from '../../../assets/portraits/cards/lumus-resolve-v1.png?url';
import lumusWorry from '../../../assets/portraits/cards/lumus-worry-v1.png?url';
import noxJoy from '../../../assets/portraits/cards/nox-joy-v1.png?url';
import noxNeutral from '../../../assets/portraits/cards/nox-neutral-v1.png?url';
import noxResolve from '../../../assets/portraits/cards/nox-resolve-v1.png?url';
import noxWorry from '../../../assets/portraits/cards/nox-worry-v1.png?url';
import shadowJoy from '../../../assets/portraits/cards/small-silence-joy-v1.png?url';
import shadowNeutral from '../../../assets/portraits/cards/small-silence-neutral-v1.png?url';
import shadowResolve from '../../../assets/portraits/cards/small-silence-resolve-v1.png?url';
import shadowWorry from '../../../assets/portraits/cards/small-silence-worry-v1.png?url';
import littleOneJoy from '../../../assets/portraits/cards/sun-little-one-joy-v1.png?url';
import littleOneNeutral from '../../../assets/portraits/cards/sun-little-one-neutral-v1.png?url';
import littleOneResolve from '../../../assets/portraits/cards/sun-little-one-resolve-v1.png?url';
import littleOneWorry from '../../../assets/portraits/cards/sun-little-one-worry-v1.png?url';
import dreamVoice from '../../../assets/portraits/cards/dream-voice-v1.png?url';

// §13 asks dialogue to name its speaker, and §14 «Доступность» forbids carrying information by
// colour alone — so every line shows a face as well as a name. Each character was drawn in four
// moods, and the card picks the one the line is written in.
export type PortraitSpeaker =
  | 'lumus'
  | 'nox'
  | 'gardener'
  | 'sun-little-one'
  | 'shadow'
  // «Голос сна» has no face: the eclipse sigil stands in for it so the frame's portrait ring is
  // never left empty.
  | 'dream';
export type PortraitEmotion = 'neutral' | 'joy' | 'worry' | 'resolve';

const PORTRAITS: Readonly<Record<PortraitSpeaker, Readonly<Record<PortraitEmotion, string>>>> = {
  lumus: { neutral: lumusNeutral, joy: lumusJoy, worry: lumusWorry, resolve: lumusResolve },
  nox: { neutral: noxNeutral, joy: noxJoy, worry: noxWorry, resolve: noxResolve },
  gardener: {
    neutral: gardenerNeutral,
    joy: gardenerJoy,
    worry: gardenerWorry,
    resolve: gardenerResolve,
  },
  'sun-little-one': {
    neutral: littleOneNeutral,
    joy: littleOneJoy,
    worry: littleOneWorry,
    resolve: littleOneResolve,
  },
  shadow: { neutral: shadowNeutral, joy: shadowJoy, worry: shadowWorry, resolve: shadowResolve },
  dream: { neutral: dreamVoice, joy: dreamVoice, worry: dreamVoice, resolve: dreamVoice },
};

export function portraitKey(speaker: PortraitSpeaker, emotion: PortraitEmotion): string {
  return `garden-portrait-${speaker}-${emotion}`;
}

export function preloadGardenPortraits(scene: Phaser.Scene): void {
  Object.entries(PORTRAITS).forEach(([speaker, emotions]) => {
    Object.entries(emotions).forEach(([emotion, url]) => {
      scene.load.image(portraitKey(speaker as PortraitSpeaker, emotion as PortraitEmotion), url);
    });
  });
}

export function portraitForSpeaker(speaker: string): PortraitSpeaker | null {
  if (speaker.startsWith('Лумус')) return 'lumus';
  if (speaker.startsWith('Нокс')) return 'nox';
  if (speaker.startsWith('Садовник')) return 'gardener';
  if (speaker.startsWith('Тень')) return 'shadow';
  if (speaker.startsWith('Солнечный')) return 'sun-little-one';
  if (speaker.startsWith('Голос')) return 'dream';
  return null;
}

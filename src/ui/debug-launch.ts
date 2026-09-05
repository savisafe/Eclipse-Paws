import { CAMPAIGN_LEVEL_ORDER, type CampaignLevelId } from '@content/index';

// ARC-015: debug launcher — a single, documented place for every dev-only "jump straight to X"
// query parameter, instead of `new URLSearchParams(window.location.search)` scattered across
// `App.tsx`/`GameCanvas.tsx` with slightly different parsing each time. All flags are no-ops in
// production builds (`import.meta.env.DEV` gate), so this can never affect a real player.
//
// Supported query parameters (see README.md "Разработка" for the user-facing list):
// - `?level=<CampaignLevelId>` — start on a specific level instead of `garden-first-dawn`.
// - `?checkpoint=<id>` — jump straight to a level's checkpoint (id must belong to that level's
//   `checkpoints`; invalid/foreign ids are ignored rather than silently reaching an unrelated
//   checkpoint).
// - `?heroLevel=<N>` — override the hero's progression level (unlocks matching abilities).
// - `?phaseDurationMs=<N>` — override day/night phase duration for faster iteration (this also
//   puts a story-driven level such as «Сад первой зари» back on the timed cycle).
// - `?startNearCombat` / `?startNearFinish` — spawn near the first encounter / the level exit
//   (existing flags, now parsed in one place instead of duplicated in `GameCanvas.tsx`).
//
// Passing `level` and/or `checkpoint` also skips the main menu/story intro on boot and starts the
// level immediately — that is the point of a "launcher": you should not have to click through
// menus to reach the chapter/checkpoint you are debugging. The other flags
// (`heroLevel`/`phaseDurationMs`/`startNearCombat`/`startNearFinish`) deliberately do NOT trigger
// this — they are gameplay-parameter overrides meant to be combined with a normal, manual
// "Новая игра" → "Начать уровень" flow (this is how the existing Playwright e2e suite in
// tests/e2e/boot-menu.spec.ts already uses them); auto-skipping the menu for those too broke
// every one of those tests, which all click through the menu themselves after loading the page
// with e.g. `?startNearCombat=1&heroLevel=2`.

export interface DebugLaunchParams {
  checkpointId: string | null;
  heroLevel: number | null;
  level: CampaignLevelId | null;
  phaseDurationMs: number | null;
  startNearCombat: boolean;
  startNearFinish: boolean;
}

const NO_DEBUG_LAUNCH: DebugLaunchParams = {
  checkpointId: null,
  heroLevel: null,
  level: null,
  phaseDurationMs: null,
  startNearCombat: false,
  startNearFinish: false,
};

export function readDebugLaunchParams(): DebugLaunchParams {
  if (!import.meta.env.DEV) return NO_DEBUG_LAUNCH;

  const search = new URLSearchParams(window.location.search);
  const requestedLevel = search.get('level');
  const requestedHeroLevel = Number(search.get('heroLevel'));
  const requestedPhaseDurationMs = Number(search.get('phaseDurationMs'));

  return {
    checkpointId: search.get('checkpoint'),
    heroLevel:
      Number.isInteger(requestedHeroLevel) && requestedHeroLevel >= 1 ? requestedHeroLevel : null,
    level:
      requestedLevel && CAMPAIGN_LEVEL_ORDER.includes(requestedLevel as CampaignLevelId)
        ? (requestedLevel as CampaignLevelId)
        : null,
    phaseDurationMs:
      Number.isFinite(requestedPhaseDurationMs) && requestedPhaseDurationMs >= 100
        ? requestedPhaseDurationMs
        : null,
    startNearCombat: search.has('startNearCombat'),
    startNearFinish: search.has('startNearFinish'),
  };
}

// Only `level`/`checkpoint` mean "take me straight there" — see the note above.
export function shouldAutoStartDebugLaunch(params: DebugLaunchParams): boolean {
  return params.level !== null || params.checkpointId !== null;
}

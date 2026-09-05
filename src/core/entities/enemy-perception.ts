// ARC-011: first small mechanic migrated end-to-end as an architectural example
// (docs/ECLIPSE_PAWS_RECONSTRUCTION_PLAN.md Фаза 1). Extracted verbatim from
// `src/adapters/phaser/platformer-enemy-system.ts` (`#insideCover`, `canDetectTarget`), which
// previously computed this decision inline using Phaser sprite positions. The math is unchanged;
// only the inputs are now plain numbers/strings instead of `Phaser.Physics.Arcade.Sprite` /
// `PlatformRect` from `@content`, so this stays pure and Phaser/content-free per the core
// boundary rules in eslint.config.js.

export interface RectZone {
  height: number;
  width: number;
  x: number;
  y: number;
}

export function isPointInZone(x: number, y: number, zone: RectZone): boolean {
  return (
    x >= zone.x - zone.width / 2 &&
    x <= zone.x + zone.width / 2 &&
    y >= zone.y - zone.height / 2 &&
    y <= zone.y + zone.height / 2
  );
}

export function isTargetConcealed(
  x: number,
  y: number,
  coverZones: readonly RectZone[],
  hiding: boolean,
): boolean {
  return hiding && coverZones.some((zone) => isPointInZone(x, y, zone));
}

export function canEnemyDetectTarget(
  concealed: boolean,
  enemyConfigId: string,
  coverSensorConfigIds: ReadonlySet<string>,
): boolean {
  return !concealed || coverSensorConfigIds.has(enemyConfigId);
}

export interface HazardPoint {
  x: number;
  y: number;
}

// Second pilot extraction of the same mechanic family (ARC-011 continuation) — verbatim from
// `platformer-enemy-system.ts`'s private `#hazardAhead`, which took a
// `Phaser.Physics.Arcade.Sprite` only to read its `.x`; the rule itself only ever needed the x
// coordinate and travel direction.
export function isHazardAhead(
  spriteX: number,
  direction: number,
  footY: number,
  hazards: readonly HazardPoint[],
  detectionRangeX = 125,
  detectionRangeY = 90,
): boolean {
  return hazards.some((hazard) => {
    const dx = hazard.x - spriteX;
    return (
      Math.sign(dx || direction) === Math.sign(direction) &&
      Math.abs(dx) < detectionRangeX &&
      Math.abs(hazard.y - footY) < detectionRangeY
    );
  });
}

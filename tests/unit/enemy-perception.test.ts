import { describe, expect, it } from 'vitest';
import { canEnemyDetectTarget, isHazardAhead, isPointInZone, isTargetConcealed } from '@core/index';

describe('enemy perception (ARC-011 pilot extraction)', () => {
  describe('isPointInZone', () => {
    const zone = { x: 100, y: 200, width: 40, height: 20 };

    it('is true at the zone center', () => {
      expect(isPointInZone(100, 200, zone)).toBe(true);
    });

    it('is true exactly at the zone edges', () => {
      expect(isPointInZone(80, 190, zone)).toBe(true);
      expect(isPointInZone(120, 210, zone)).toBe(true);
    });

    it('is false just outside the zone', () => {
      expect(isPointInZone(79, 200, zone)).toBe(false);
      expect(isPointInZone(100, 211, zone)).toBe(false);
    });
  });

  describe('isTargetConcealed', () => {
    const zones = [{ x: 0, y: 0, width: 10, height: 10 }];

    it('is false when not hiding, even inside a cover zone', () => {
      expect(isTargetConcealed(0, 0, zones, false)).toBe(false);
    });

    it('is true when hiding inside a cover zone', () => {
      expect(isTargetConcealed(0, 0, zones, true)).toBe(true);
    });

    it('is false when hiding but outside every cover zone', () => {
      expect(isTargetConcealed(500, 500, zones, true)).toBe(false);
    });

    it('is false with no cover zones at all', () => {
      expect(isTargetConcealed(0, 0, [], true)).toBe(false);
    });
  });

  describe('canEnemyDetectTarget', () => {
    const sensors = new Set(['echo-owl', 'twilight-golem']);

    it('always detects when the target is not concealed', () => {
      expect(canEnemyDetectTarget(false, 'shadefang', sensors)).toBe(true);
    });

    it('cannot detect a concealed target without a cover sensor', () => {
      expect(canEnemyDetectTarget(true, 'shadefang', sensors)).toBe(false);
    });

    it('detects a concealed target if the enemy has a cover sensor', () => {
      expect(canEnemyDetectTarget(true, 'echo-owl', sensors)).toBe(true);
    });
  });

  describe('isHazardAhead', () => {
    const hazards = [{ x: 500, y: 610 }];

    it('is true for a hazard ahead in the direction of travel, within range', () => {
      expect(isHazardAhead(420, 1, 610, hazards)).toBe(true);
    });

    it('is false when the hazard is behind the direction of travel', () => {
      expect(isHazardAhead(420, -1, 610, hazards)).toBe(false);
    });

    it('is false when the hazard is further than the x range', () => {
      expect(isHazardAhead(200, 1, 610, hazards)).toBe(false);
    });

    it('is false when the hazard is far off on the y axis', () => {
      expect(isHazardAhead(420, 1, 300, hazards)).toBe(false);
    });

    it('is false with no hazards at all', () => {
      expect(isHazardAhead(420, 1, 610, [])).toBe(false);
    });
  });
});

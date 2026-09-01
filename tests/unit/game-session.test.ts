import { describe, expect, it } from 'vitest';
import { PROTOTYPE_CONTENT } from '@content/index';
import { GameSession } from '@core/index';

describe('GameSession', () => {
  it('switches the active cat and applies phase damage modifiers', () => {
    const session = new GameSession(PROTOTYPE_CONTENT);

    expect(session.attack('shadefang-1')?.damage).toBe(18);
    expect(session.switchActiveCat()).toBe('nox');
    expect(session.attack('shadefang-2')?.damage).toBeCloseTo(3);
  });

  it('uses stronger typed special abilities', () => {
    const session = new GameSession(PROTOTYPE_CONTENT);

    expect(session.attack('shadefang-1', true)?.damage).toBe(27);
    expect(session.drainEvents()).toContainEqual(
      expect.objectContaining({ type: 'AbilityUsed', abilityId: 'luma-sky-lightning' }),
    );
  });

  it('shares damage and quickly restores the current checkpoint after defeat', () => {
    const session = new GameSession(PROTOTYPE_CONTENT);

    expect(session.takeDamage(1)).toBe(false);
    expect(session.takeDamage(1)).toBe(false);
    expect(session.snapshot().bondHealth).toBe(1);
    expect(session.takeDamage(1)).toBe(true);

    const snapshot = session.snapshot();
    expect(snapshot.bondHealth).toBe(3);
    expect(snapshot.checkpointRestartCount).toBe(1);
    expect(
      snapshot.enemies.every(
        (enemy) => enemy.health === PROTOTYPE_CONTENT.enemyTypes[enemy.configId]?.health,
      ),
    ).toBe(true);
  });

  it('records a reached checkpoint only once', () => {
    const session = new GameSession(PROTOTYPE_CONTENT);

    session.reachCheckpoint('moon-well');
    session.reachCheckpoint('moon-well');

    expect(session.snapshot().checkpointId).toBe('moon-well');
    expect(
      session.drainEvents().filter((event) => event.type === 'CheckpointReached'),
    ).toHaveLength(1);
  });
});

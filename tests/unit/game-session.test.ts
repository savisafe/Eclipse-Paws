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

  it('enforces cooldowns before another attack', () => {
    const session = new GameSession(PROTOTYPE_CONTENT);

    expect(session.attack('shadefang-1')).not.toBeNull();
    expect(session.attack('shadefang-1')).toBeNull();
    session.update(420);
    expect(session.attack('shadefang-1')).not.toBeNull();
  });

  it('fills the Eclipse meter and spends 50 on a manual phase change', () => {
    const session = new GameSession(PROTOTYPE_CONTENT);

    for (const enemyId of ['shadefang-1', 'shadefang-2']) {
      session.attack(enemyId);
      session.update(420);
      session.attack(enemyId);
      session.update(420);
    }

    expect(session.snapshot().eclipseMeter).toBeGreaterThanOrEqual(50);
    expect(session.manualChangePhase()).toBe(true);
    expect(session.snapshot().phase).toBe('night');
    expect(session.snapshot().eclipseMeter).toBeLessThan(50);
  });

  it('uses a support shield before shared health', () => {
    const session = new GameSession(PROTOTYPE_CONTENT);

    expect(session.useSupport()).not.toBeNull();
    expect(session.snapshot().shieldCharges).toBe(1);
    session.takeDamage(1);
    expect(session.snapshot().bondHealth).toBe(3);
    expect(session.snapshot().shieldCharges).toBe(0);
    session.takeDamage(1);
    expect(session.snapshot().bondHealth).toBe(2);
  });

  it('uses the support ability as healing when bond health is missing', () => {
    const session = new GameSession(PROTOTYPE_CONTENT);
    session.takeDamage(1);

    expect(session.snapshot().bondHealth).toBe(2);
    expect(session.useSupport()).not.toBeNull();
    expect(session.snapshot().bondHealth).toBe(3);
    expect(session.snapshot().shieldCharges).toBe(0);
    expect(session.drainEvents()).toContainEqual(
      expect.objectContaining({ type: 'HealingReceived', amount: 1, remainingHealth: 3 }),
    );
  });

  it('spends a full meter on the shared Eclipse ultimate', () => {
    const session = new GameSession(PROTOTYPE_CONTENT);
    const targets = ['shadefang-1', 'light-wisp-1', 'spore-beast-1', 'shadefang-2'];

    targets.forEach((enemyId) => {
      while ((session.snapshot().enemies.find((enemy) => enemy.id === enemyId)?.health ?? 0) > 0) {
        session.attack(enemyId);
        session.update(420);
      }
    });

    expect(session.snapshot().eclipseMeter).toBe(100);
    expect(session.useUltimate(['twilight-golem-1'])).toBe(true);
    expect(session.snapshot().eclipseMeter).toBe(0);
    expect(session.snapshot().shieldCharges).toBe(1);
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

  it('carries hero progression, scales damage, and records collected loot', () => {
    const session = new GameSession(PROTOTYPE_CONTENT, {
      level: 3,
      loot: { 'dawn-crystal': 1, 'moon-petal': 0, 'eclipse-ore': 0 },
      xp: 12,
    });

    expect(session.attack('shadefang-1')?.damage).toBeCloseTo(20.88);
    const kind = session.collectLoot('shadefang-1');
    expect(session.snapshot().heroLevel).toBe(3);
    expect(session.snapshot().loot[kind]).toBeGreaterThan(0);
    expect(session.drainEvents()).toContainEqual(
      expect.objectContaining({ type: 'LootCollected', kind }),
    );
  });
});

import { describe, expect, it } from 'vitest';
import { PROTOTYPE_CONTENT } from '@content/index';
import {
  ECLIPSE_DURATION_MS,
  GameSession,
  SHADOW_VEIL_DURATION_MS,
  STUN_DURATION_MS,
} from '@core/index';

describe('GameSession', () => {
  it('switches the active cat and applies phase damage modifiers', () => {
    const session = new GameSession(PROTOTYPE_CONTENT);

    expect(session.attack('shadefang-1')?.damage).toBe(12);
    expect(session.switchActiveCat()).toBe('nox');
    expect(session.attack('spore-beast-1')?.damage).toBeCloseTo(3.75);
  });

  it('uses stronger typed special abilities once unlocked', () => {
    const session = new GameSession(PROTOTYPE_CONTENT, {
      level: 2,
      loot: { 'dawn-crystal': 0, 'moon-petal': 0, 'eclipse-ore': 0 },
      xp: 0,
    });

    expect(session.attack('shadefang-1', true)?.damage).toBeCloseTo(29.16);
    expect(session.drainEvents()).toContainEqual(
      expect.objectContaining({ type: 'AbilityUsed', abilityId: 'lumus-light-beam' }),
    );
  });

  it('locks special, support and ultimate abilities until the hero levels up', () => {
    const session = new GameSession(PROTOTYPE_CONTENT);

    expect(session.attack('shadefang-1', true)).toBeNull();
    expect(session.useSupport()).toBeNull();
    expect(session.useEclipse()).toBe(false);
  });

  // ECLIPSE_PAWS_SCENARIO.md §12: Оглушающий крик trades damage for a safe window.
  it('stuns nearby enemies for a limited window with the stunning shout', () => {
    const session = new GameSession(PROTOTYPE_CONTENT);

    expect(session.stunEnemies(['shadefang-1', 'light-wisp-1'])).toEqual([
      'shadefang-1',
      'light-wisp-1',
    ]);
    expect(session.isEnemyStunned('shadefang-1')).toBe(true);
    expect(session.snapshot().stunnedEnemyIds).toContain('light-wisp-1');
    expect(session.drainEvents()).toContainEqual(
      expect.objectContaining({ type: 'EnemiesStunned' }),
    );

    session.update(STUN_DURATION_MS);
    expect(session.isEnemyStunned('shadefang-1')).toBe(false);
    expect(session.snapshot().stunnedEnemyIds).toEqual([]);
  });

  it('never stuns an enemy that is already defeated', () => {
    const session = new GameSession(PROTOTYPE_CONTENT);

    expect(session.stunEnemies(['no-such-enemy'])).toEqual([]);
  });

  // §12: "Во время движения он неуязвим" — the shadow dash window absorbs a hit.
  it('ignores damage during the shadow dash invulnerability window', () => {
    const session = new GameSession(PROTOTYPE_CONTENT);

    session.grantInvulnerability(300);
    expect(session.takeDamage(1)).toBe(false);
    expect(session.snapshot().bondHealth).toBe(3);

    session.update(300);
    session.takeDamage(1);
    expect(session.snapshot().bondHealth).toBe(2);
  });

  it('enforces cooldowns before another attack', () => {
    const session = new GameSession(PROTOTYPE_CONTENT);

    expect(session.attack('shadefang-1')).not.toBeNull();
    expect(session.attack('shadefang-1')).toBeNull();
    session.update(620);
    expect(session.attack('shadefang-1')).not.toBeNull();
  });

  it('fills the Eclipse meter from combat and only changes phase on its own timer', () => {
    const session = new GameSession(PROTOTYPE_CONTENT);

    for (const enemyId of ['shadefang-1', 'spore-beast-1']) {
      while ((session.snapshot().enemies.find((enemy) => enemy.id === enemyId)?.health ?? 0) > 0) {
        session.attack(enemyId);
        session.update(420);
      }
    }

    expect(session.snapshot().eclipseMeter).toBeGreaterThanOrEqual(50);
    expect(session.snapshot().phase).toBe('day');
    session.update(PROTOTYPE_CONTENT.phaseDurationMs);
    expect(session.snapshot().phase).toBe('night');
  });

  // §12: Теневой покров hides both cats instead of healing, and drops on an aggressive action.
  it('hides both cats with the shadow veil and drops it when Нокс attacks', () => {
    const session = new GameSession(PROTOTYPE_CONTENT, {
      level: 3,
      loot: { 'dawn-crystal': 0, 'moon-petal': 0, 'eclipse-ore': 0 },
      xp: 0,
    });
    session.switchActiveCat();

    expect(session.useSupport()).not.toBeNull();
    expect(session.snapshot().shadowVeilMs).toBe(SHADOW_VEIL_DURATION_MS);
    expect(session.snapshot().bondHealth).toBe(3);

    session.attack('spore-beast-1');
    expect(session.snapshot().shadowVeilMs).toBe(0);
  });

  it('uses a support shield before shared health', () => {
    const session = new GameSession(PROTOTYPE_CONTENT, {
      level: 3,
      loot: { 'dawn-crystal': 0, 'moon-petal': 0, 'eclipse-ore': 0 },
      xp: 0,
    });

    expect(session.useSupport()).not.toBeNull();
    expect(session.snapshot().shieldCharges).toBe(1);
    session.takeDamage(1);
    expect(session.snapshot().bondHealth).toBe(3);
    expect(session.snapshot().shieldCharges).toBe(0);
    session.takeDamage(1);
    expect(session.snapshot().bondHealth).toBe(2);
  });

  it('uses the support ability as healing when bond health is missing', () => {
    const session = new GameSession(PROTOTYPE_CONTENT, {
      level: 3,
      loot: { 'dawn-crystal': 0, 'moon-petal': 0, 'eclipse-ore': 0 },
      xp: 0,
    });
    session.takeDamage(1);

    expect(session.snapshot().bondHealth).toBe(2);
    expect(session.useSupport()).not.toBeNull();
    expect(session.snapshot().bondHealth).toBe(3);
    expect(session.snapshot().shieldCharges).toBe(0);
    expect(session.drainEvents()).toContainEqual(
      expect.objectContaining({ type: 'HealingReceived', amount: 1, remainingHealth: 3 }),
    );
  });

  // §12: Затмение "не является кнопкой массового уничтожения" — it opens a twilight window and
  // leaves every enemy's health untouched.
  it('spends a full meter on Eclipse without damaging anyone', () => {
    const session = new GameSession(PROTOTYPE_CONTENT, {
      level: 5,
      loot: { 'dawn-crystal': 0, 'moon-petal': 0, 'eclipse-ore': 0 },
      xp: 0,
    });
    const targets = ['shadefang-1', 'light-wisp-1', 'spore-beast-1', 'shadefang-2'];

    targets.forEach((enemyId) => {
      while ((session.snapshot().enemies.find((enemy) => enemy.id === enemyId)?.health ?? 0) > 0) {
        session.attack(enemyId);
        session.update(420);
      }
    });

    expect(session.snapshot().eclipseMeter).toBe(100);
    const bossHealthBefore = session
      .snapshot()
      .enemies.find((enemy) => enemy.id === 'twilight-golem-1')?.health;

    expect(session.useEclipse()).toBe(true);
    expect(session.snapshot().eclipseMeter).toBe(0);
    expect(session.snapshot().eclipseActiveMs).toBe(ECLIPSE_DURATION_MS);
    expect(
      session.snapshot().enemies.find((enemy) => enemy.id === 'twilight-golem-1')?.health,
    ).toBe(bossHealthBefore);
    expect(session.drainEvents()).toContainEqual(
      expect.objectContaining({ type: 'EclipseStarted' }),
    );

    session.update(ECLIPSE_DURATION_MS);
    expect(session.snapshot().eclipseActiveMs).toBe(0);
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

    expect(session.attack('shadefang-1')?.damage).toBeCloseTo(13.92);
    const kind = session.collectLoot('shadefang-1');
    expect(session.snapshot().heroLevel).toBe(3);
    expect(session.snapshot().loot[kind]).toBeGreaterThan(0);
    expect(session.drainEvents()).toContainEqual(
      expect.objectContaining({ type: 'LootCollected', kind }),
    );
  });
});

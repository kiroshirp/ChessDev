import { describe, expect, it } from 'vitest';
import { movePlayer, overlaps, WALK_SPEED } from '@pixelspace/world-engine';
import { foundationMap as map } from '@pixelspace/map-engine';
import { moveIntentSchema, spaceDefinitionSchema } from '@pixelspace/shared';
describe('generic world simulation', () => {
  it('accepts accessor-backed positions used by synchronized schemas', () => {
    const position = Object.create({
      get x() {
        return map.spawn.x;
      },
      get y() {
        return map.spawn.y;
      },
    }) as { x: number; y: number };
    expect(movePlayer(position, { x: 0, y: 0 }, 0.1, map)).toEqual(map.spawn);
    expect(movePlayer(position, { x: 1, y: 0 }, 0.1, map).x).toBeCloseTo(map.spawn.x + 16);
  });
  it('keeps diagonal speed equal to horizontal speed', () => {
    const straight = movePlayer(map.spawn, { x: 1, y: 0 }, 0.1, map);
    const diagonal = movePlayer(map.spawn, { x: 1, y: 1 }, 0.1, map);
    expect(Math.hypot(diagonal.x - map.spawn.x, diagonal.y - map.spawn.y)).toBeCloseTo(
      straight.x - map.spawn.x,
    );
    expect(straight.x - map.spawn.x).toBeCloseTo(WALK_SPEED * 0.1);
  });
  it('blocks a table and slides alongside it', () => {
    let position = { x: 370, y: 270 };
    for (let i = 0; i < 50; i++) position = movePlayer(position, { x: 1, y: 0 }, 0.05, map);
    expect(position.x).toBeLessThanOrEqual(373);
    expect(map.obstacles.some((rect) => overlaps(position, rect))).toBe(false);
    const slid = movePlayer(position, { x: 1, y: 1 }, 0.1, map);
    expect(slid.y).toBeGreaterThan(position.y);
  });
  it('never walks through walls over repeated ticks', () => {
    let position = { ...map.spawn };
    for (let i = 0; i < 300; i++) position = movePlayer(position, { x: -1, y: 1 }, 0.1, map);
    expect(map.obstacles.some((rect) => overlaps(position, rect))).toBe(false);
    expect(position.x).toBeGreaterThanOrEqual(43);
    expect(position.y).toBeLessThanOrEqual(597);
  });
  it('caps long frames and rejects non-finite values', () => {
    expect(movePlayer(map.spawn, { x: 1, y: 0 }, 99, map).x).toBeCloseTo(
      map.spawn.x + WALK_SPEED * 0.1,
    );
    expect(movePlayer(map.spawn, { x: Infinity, y: 0 }, 0.1, map)).toEqual(map.spawn);
    expect(movePlayer(map.spawn, { x: 1, y: 0 }, -1, map)).toEqual(map.spawn);
  });
  it('has a valid, non-colliding spawn', () => {
    expect(map.schemaVersion).toBe(1);
    expect(map.obstacles.some((rect) => overlaps(map.spawn, rect))).toBe(false);
  });
});
describe('network contracts', () => {
  it('accepts bounded intents and rejects arbitrary position payloads', () => {
    expect(moveIntentSchema.safeParse({ sequence: 1, horizontal: -1, vertical: 0 }).success).toBe(
      true,
    );
    for (const payload of [
      { sequence: -1, horizontal: 0, vertical: 0 },
      { sequence: 1, horizontal: 50, vertical: 0 },
      { sequence: 1, horizontal: 0, vertical: 0, x: 1000, playerId: 'other' },
    ])
      expect(moveIntentSchema.safeParse(payload).success).toBe(false);
  });
  it('validates module-neutral spaces', () => {
    expect(
      spaceDefinitionSchema.safeParse({
        id: 'office-1',
        name: 'Office',
        type: 'office',
        mapId: map.id,
        capacity: 20,
        enabledModules: [],
        accessPolicyId: 'members',
      }).success,
    ).toBe(true);
    expect(spaceDefinitionSchema.safeParse({ capacity: 0 }).success).toBe(false);
  });
});

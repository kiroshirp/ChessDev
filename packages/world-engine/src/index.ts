import type { WorldMap, Rect } from '@pixelspace/map-engine';
export interface Position {
  x: number;
  y: number;
}
export const PLAYER_RADIUS = 11;
export const WALK_SPEED = 160;

export function overlaps(position: Position, rect: Rect, radius = PLAYER_RADIUS): boolean {
  return (
    position.x + radius > rect.x &&
    position.x - radius < rect.x + rect.width &&
    position.y + radius > rect.y &&
    position.y - radius < rect.y + rect.height
  );
}

// Pure simulation shared with the future authoritative server. Bounded substeps prevent tunnelling.
export function movePlayer(
  position: Position,
  input: Position,
  elapsed: number,
  map: WorldMap,
): Position {
  if (![position.x, position.y, input.x, input.y, elapsed].every(Number.isFinite))
    return { x: position.x, y: position.y };
  const length = Math.hypot(input.x, input.y);
  if (!length || elapsed <= 0) return { x: position.x, y: position.y };
  const seconds = Math.min(elapsed, 0.1);
  const dx = (input.x / length) * WALK_SPEED * seconds;
  const dy = (input.y / length) * WALK_SPEED * seconds;
  const steps = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) / 4));
  const next = { x: position.x, y: position.y };
  for (let i = 0; i < steps; i++) {
    const x = Math.max(PLAYER_RADIUS, Math.min(map.width - PLAYER_RADIUS, next.x + dx / steps));
    if (!map.obstacles.some((rect) => overlaps({ x, y: next.y }, rect))) next.x = x;
    const y = Math.max(PLAYER_RADIUS, Math.min(map.height - PLAYER_RADIUS, next.y + dy / steps));
    if (!map.obstacles.some((rect) => overlaps({ x: next.x, y }, rect))) next.y = y;
  }
  return next;
}

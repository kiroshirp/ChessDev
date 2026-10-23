import { describe, expect, it } from 'vitest';
import { openings, puzzles, position } from '../apps/web/src/training';
describe('contenido de entrenamiento', () => {
  it('todas las líneas tienen movimientos legales', () => {
    for (const o of openings) expect(position(o.moves).history()).toEqual(o.moves);
  });
  it('cada solución de la colección da mate', () => {
    for (const p of puzzles) {
      const chess = position(p.setup);
      chess.move(p.solution);
      expect(chess.isCheckmate()).toBe(true);
    }
  });
});

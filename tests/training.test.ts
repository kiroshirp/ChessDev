import { describe, expect, it, vi } from 'vitest';
import { Chess } from 'chess.js';
import {
  addMove,
  cycleStep,
  exportStudy,
  importStudy,
  loadLibrary,
  mainLine,
  newStudy,
  schedule,
  studyLines,
  uciMove,
} from '../apps/web/src/library';
import { dailyPuzzle, importPuzzleCsv } from '../apps/web/src/puzzles';
import { evaluationLabel, parseInfo, reviewStudy, Engine } from '../apps/web/src/engine';
import daily from './fixtures/lichess-daily.json' with { type: 'json' };

describe('estudios PGN reales', () => {
  it('conserva variantes anidadas, comentarios, símbolos y resultado al exportar/reimportar', () => {
    const study = importStudy(
      '[Event "Mi repertorio"]\n\n{Inicio} 1.e4 {Centro} e5 (1...c5 $1 2.Nf3 (2.Nc3) d6) 2.Nf3 Nc6 1-0',
    );
    const roundtrip = importStudy(exportStudy(study));
    expect(studyLines(roundtrip).map((l) => l.moves.map((m) => m.san))).toEqual([
      ['e4', 'e5', 'Nf3', 'Nc6'],
      ['e4', 'c5', 'Nf3', 'd6'],
      ['e4', 'c5', 'Nc3'],
    ]);
    expect(roundtrip.root.comment).toBe('Inicio');
    expect(roundtrip.root.children[0]!.comment).toBe('Centro');
    expect(roundtrip.root.children[0]!.children[1]!.nags).toEqual([1]);
    expect(roundtrip.headers.Result).toBe('1-0');
    expect(new Chess().loadPgn(exportStudy(study))).toBeUndefined();
  });
  it('añadir desde una posición crea una variante y mantiene la principal', () => {
    const study = importStudy('1.e4 e5 2.Nf3');
    const result = addMove(study, study.root.children[0]!.id, 'c7', 'c5', 'q');
    expect(studyLines(result.study).map((l) => l.moves.map((m) => m.san))).toEqual([
      ['e4', 'e5', 'Nf3'],
      ['e4', 'c5'],
    ]);
    expect(studyLines(study)).toHaveLength(1);
  });
  it('migra los estudios antiguos una vez y mantiene estables las claves de repaso', () => {
    const storage = new Map<string, string>();
    storage.set(
      'chessdev.studies',
      JSON.stringify([{ id: 'legacy', name: 'Anterior', pgn: '1.e4 e5', updated: '2026-10-23' }]),
    );
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => storage.get(k) ?? null,
      setItem: (k: string, v: string) => storage.set(k, v),
    });
    try {
      const first = loadLibrary(),
        second = loadLibrary();
      expect(first.studies[0]!.id).toBe('legacy');
      expect(studyLines(first.studies[0]!)[0]!.id).toBe(studyLines(second.studies[0]!)[0]!.id);
      expect(storage.has('chessdev.studies')).toBe(true);
    } finally {
      vi.unstubAllGlobals();
    }
  });
  it('respeta FEN personalizado y rechaza jugadas ilegales incluso en variantes', () => {
    const study = importStudy(
      '[SetUp "1"]\n[FEN "8/4k3/8/4K3/8/8/8/R7 w - - 0 20"]\n\n20.Ra7+ Kf8 *',
    );
    expect(mainLine(importStudy(exportStudy(study)).root).at(-1)!.san).toBe('Kf8');
    expect(() => importStudy('1.e4 (1.e5) e5')).toThrow('Jugada PGN no válida');
    expect(() => importStudy('1.e4 (1.d4')).toThrow('sin cerrar');
    expect(() => newStudy('Mal', 'invalid')).toThrow();
  });
});
describe('repaso SM2 y Woodpecker', () => {
  it('programa a 1 y 6 días, usa facilidad y reinicia al fallar', () => {
    const first = schedule(undefined, 5, 0),
      second = schedule(first, 5, first.due),
      third = schedule(second, 5, second.due);
    expect(first.due).toBe(86400000);
    expect(second.interval).toBe(6);
    expect(third.interval).toBe(Math.round(6 * second.ease));
    const failed = schedule(third, 0, third.due);
    expect(failed.repetitions).toBe(0);
    expect(failed.failures).toBe(1);
    expect(failed.interval).toBe(1);
    let card = failed;
    for (let i = 0; i < 20; i++) card = schedule(card, 0, card.due);
    expect(card.ease).toBe(1.3);
  });
  it('cierra el ciclo solo al terminar todas las posiciones y conserva sus medidas', () => {
    const initial = {
      ids: ['a', 'b'],
      cycle: 0,
      index: 0,
      milliseconds: 0,
      errors: 0,
      results: [],
      target: 3,
    };
    const step = cycleStep(initial, 4000, 1);
    expect(step.index).toBe(1);
    expect(step.results).toEqual([]);
    const next = cycleStep(step, 6000, 2);
    expect(next.cycle).toBe(1);
    expect(next.index).toBe(0);
    expect(next.results).toEqual([{ milliseconds: 10000, errors: 3, count: 2 }]);
  });
});
describe('problemas Lichess', () => {
  it('sitúa el problema diario después de initialPly+1 y verifica toda la solución', () => {
    const puzzle = dailyPuzzle(daily);
    expect(puzzle.id).toBe('lichess:wX7Ch');
    let board = new Chess(puzzle.fen);
    for (const move of puzzle.moves) board = uciMove(board.fen(), move);
    expect(board.isCheckmate()).toBe(true);
    expect(puzzle.source).toBe('https://lichess.org/training/wX7Ch');
  });
  it('el CSV aplica la primera jugada del rival antes de pedir la solución', () => {
    const puzzle = dailyPuzzle(daily),
      game = new Chess();
    game.loadPgn(daily.game.pgn);
    const history = game.history({ verbose: true });
    const before = history[daily.puzzle.initialPly]!,
      moves = [before.from + before.to + (before.promotion ?? ''), ...puzzle.moves];
    const csv = `PuzzleId,FEN,Moves,Rating,RatingDeviation,Popularity,NbPlays,Themes,GameUrl,OpeningTags\nwX7Ch,${before.before},${moves.join(' ')},1755,50,99,10,mateIn2 middlegame short attraction,https://lichess.org/p82kY9AM,`;
    expect(importPuzzleCsv(csv)[0]).toEqual(puzzle);
    expect(() => importPuzzleCsv('bad,file')).toThrow();
    expect(() =>
      dailyPuzzle({ ...daily, puzzle: { ...daily.puzzle, solution: ['a1a8'] } }),
    ).toThrow();
  });
});
describe('evaluaciones verificables de motor', () => {
  it('normaliza el punto de vista de negras y los mates; descarta cotas', () => {
    expect(parseInfo('info depth 12 score cp 45 pv e2e4 e7e5', new Chess().fen())?.cp).toBe(45);
    const b = new Chess();
    b.move('e4');
    expect(parseInfo('info depth 15 score mate 3 pv d8h4', b.fen())?.mate).toBe(-3);
    expect(parseInfo('info depth 10 score cp 43 lowerbound', b.fen())).toBeNull();
    expect(evaluationLabel({ mate: 0, cp: -100000 })).toBe('−M0');
  });
  it('reconoce posiciones terminadas sin iniciar ni inventar evaluación de motor', async () => {
    const engine = new Engine(),
      board = new Chess();
    ['f3', 'e5', 'g4', 'Qh4#'].forEach((m) => board.move(m));
    expect(await engine.analyze(board.fen())).toMatchObject({
      depth: 0,
      cp: -100000,
      mate: 0,
      best: '(none)',
    });
  });
  it('la revisión compara evaluaciones reales y no promedia mates como centipeones', async () => {
    const study = importStudy('1.e4 e5'),
      values = [20, -180, -100];
    let i = 0;
    const engine = {
      analyze: async (fen: string) => ({
        fen,
        depth: 14,
        cp: values[i++]!,
        mate: null,
        best: 'e2e4',
        pv: ['e2e4'],
      }),
    } as Engine;
    const review = await reviewStudy(study, exportStudy(study), engine, () => {});
    expect(review.moves.map((m) => m.loss)).toEqual([200, 80]);
    expect(review.moves[0]!.color).toBe('w');
  });
});

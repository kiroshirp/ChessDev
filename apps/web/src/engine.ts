import { Chess } from 'chess.js';
export interface Evaluation {
  fen: string;
  depth: number;
  cp: number;
  mate: number | null;
  best: string;
  pv: string[];
}
export function parseInfo(line: string, fen: string): Omit<Evaluation, 'best'> | null {
  const depth = /\bdepth (\d+)/.exec(line),
    score = /\bscore (cp|mate) (-?\d+)/.exec(line),
    pv = /\bpv (.+)$/.exec(line);
  if (!depth || !score || /\b(?:upperbound|lowerbound)\b/.test(line)) return null;
  const direction = fen.split(' ')[1] === 'w' ? 1 : -1,
    value = Number(score[2]) * direction;
  return {
    fen,
    depth: Number(depth[1]),
    cp: score[1] === 'mate' ? Math.sign(value) * 100000 : value,
    mate: score[1] === 'mate' ? value : null,
    pv: pv ? pv[1]!.trim().split(/\s+/) : [],
  };
}
export class Engine {
  private worker: Worker | null = null;
  private ready: Promise<void> | null = null;
  private reject: ((reason: Error) => void) | null = null;
  private busy = false;
  private timeout: ReturnType<typeof setTimeout> | null = null;
  private generation = 0;
  async init() {
    if (this.ready) return this.ready;
    const worker = (this.worker = new Worker(
      `${import.meta.env.BASE_URL}engine/stockfish-19-lite-single.js`,
    ));
    this.ready = new Promise<void>((resolve, reject) => {
      this.reject = reject;
      const timeout = (this.timeout = setTimeout(() => {
        this.dispose(
          new Error('El motor no ha podido cargarse. Comprueba la conexión y vuelve a intentarlo.'),
        );
      }, 45000));
      worker.onerror = () =>
        this.dispose(new Error('Este navegador no ha podido ejecutar Stockfish.'));
      worker.onmessage = (e) => {
        const line = String(e.data);
        if (line === 'uciok') {
          worker.postMessage('setoption name Hash value 16');
          worker.postMessage('isready');
        }
        if (line === 'readyok') {
          clearTimeout(timeout);
          this.timeout = null;
          this.reject = null;
          resolve();
        }
      };
      worker.postMessage('uci');
    });
    return this.ready;
  }
  async analyze(fen: string, depth = 14, milliseconds = 500): Promise<Evaluation> {
    const board = new Chess(fen);
    if (board.isGameOver())
      return {
        fen,
        depth: 0,
        cp: board.isCheckmate() ? (board.turn() === 'w' ? -100000 : 100000) : 0,
        mate: board.isCheckmate() ? 0 : null,
        best: '(none)',
        pv: [],
      };
    if (this.busy) throw new Error('El motor ya está analizando. Espera o cancela el análisis.');
    this.busy = true;
    const generation = this.generation;
    try {
      await this.init();
      if (generation !== this.generation) throw new Error('Análisis cancelado');
      const worker = this.worker!;
      return await new Promise<Evaluation>((resolve, reject) => {
        this.reject = reject;
        let latest: Omit<Evaluation, 'best'> | null = null;
        const timeout = (this.timeout = setTimeout(() => {
          this.dispose(new Error('El motor ha tardado demasiado. Vuelve a intentarlo.'));
        }, 30000));
        worker.onmessage = (e) => {
          const line = String(e.data),
            info = parseInfo(line, fen);
          if (info) latest = info;
          if (line.startsWith('bestmove ')) {
            clearTimeout(timeout);
            this.timeout = null;
            this.reject = null;
            const best = line.split(' ')[1]!;
            if (!latest) {
              reject(new Error('El motor no ha devuelto una evaluación verificable.'));
              return;
            }
            resolve({ ...latest, best });
          }
        };
        worker.onerror = () =>
          this.dispose(new Error('El motor se ha detenido. Vuelve a intentarlo.'));
        worker.postMessage(`position fen ${fen}`);
        worker.postMessage(`go depth ${depth} movetime ${milliseconds}`);
      });
    } finally {
      if (generation === this.generation) this.busy = false;
    }
  }
  dispose(reason = new Error('Análisis cancelado')) {
    if (this.timeout) clearTimeout(this.timeout);
    this.timeout = null;
    this.generation++;
    this.worker?.terminate();
    this.worker = null;
    this.ready = null;
    this.busy = false;
    const reject = this.reject;
    this.reject = null;
    reject?.(reason);
  }
}
export interface ReviewedMove {
  ply: number;
  color: 'w' | 'b';
  played: string;
  before: Evaluation;
  after: Evaluation;
  loss: number;
  mateError: boolean;
  suggested: string;
}
export interface GameReview {
  id: string;
  name: string;
  pgn: string;
  initialFen: string;
  created: string;
  moves: ReviewedMove[];
  result: string;
}
export function legalSan(fen: string, uci: string) {
  try {
    return new Chess(fen).move({
      from: uci.slice(0, 2),
      to: uci.slice(2, 4),
      promotion: uci[4] ?? 'q',
    }).san;
  } catch {
    return uci;
  }
}
export function evaluationLabel(e: Pick<Evaluation, 'cp' | 'mate'>) {
  return e.mate === null
    ? `${e.cp >= 0 ? '+' : ''}${(e.cp / 100).toFixed(2)}`
    : `${e.cp >= 0 ? '+' : '−'}M${Math.abs(e.mate)}`;
}
export function principalVariation(e: Evaluation) {
  const board = new Chess(e.fen),
    san: string[] = [];
  for (const uci of e.pv.slice(0, 12)) {
    try {
      san.push(
        board.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] ?? 'q' }).san,
      );
    } catch {
      break;
    }
  }
  return san.join(' ');
}
export async function reviewStudy(
  study: { id: string; name: string; root: { fen: string }; headers: Record<string, string> },
  pgn: string,
  engine: Engine,
  onProgress: (done: number, total: number) => void,
): Promise<GameReview> {
  const game = new Chess();
  game.loadPgn(pgn);
  const verbose = game.history({ verbose: true });
  const fens = [study.root.fen, ...verbose.map((m) => m.after)];
  const evaluations: Evaluation[] = [];
  for (let i = 0; i < fens.length; i++) {
    evaluations.push(await engine.analyze(fens[i]!, 14, 350));
    onProgress(i + 1, fens.length);
  }
  return {
    id: study.id,
    name: study.name,
    pgn,
    initialFen: study.root.fen,
    created: new Date().toISOString(),
    result: study.headers.Result ?? '*',
    moves: verbose.map((move, i) => {
      const before = evaluations[i]!,
        after = evaluations[i + 1]!,
        difference = (before.cp - after.cp) * (move.color === 'w' ? 1 : -1);
      return {
        ply: i + 1,
        color: move.color,
        played: move.san,
        before,
        after,
        loss: before.mate === null && after.mate === null ? Math.max(0, difference) : 0,
        mateError: (before.mate !== null || after.mate !== null) && difference > 0,
        suggested: legalSan(before.fen, before.best),
      };
    }),
  };
}

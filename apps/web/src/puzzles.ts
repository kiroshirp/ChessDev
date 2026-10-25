import { Chess } from 'chess.js';
import { uciMove, type Puzzle } from './library';
interface DailyPayload {
  game: { pgn: string };
  puzzle: { id: string; initialPly: number; solution: string[]; themes: string[]; rating: number };
}
export function dailyPuzzle(value: unknown): Puzzle {
  const data = value as DailyPayload;
  if (
    !data?.game ||
    typeof data.game.pgn !== 'string' ||
    !data?.puzzle ||
    !Array.isArray(data.puzzle.solution) ||
    !data.puzzle.solution.length ||
    data.puzzle.solution.length > 64 ||
    !Array.isArray(data.puzzle.themes) ||
    !data.puzzle.themes.every((t) => typeof t === 'string') ||
    !Number.isInteger(data.puzzle.initialPly) ||
    !/^\w{5,12}$/.test(data.puzzle.id)
  )
    throw new Error('La respuesta de Lichess no contiene un problema válido.');
  const game = new Chess();
  game.loadPgn(data.game.pgn);
  const moves = game.history(),
    board = new Chess(game.getHeaders().FEN);
  if (data.puzzle.initialPly < 0 || data.puzzle.initialPly >= moves.length)
    throw new Error('La posición del problema no coincide con la partida.');
  for (const san of moves.slice(0, data.puzzle.initialPly + 1)) board.move(san);
  let fen = board.fen();
  for (const uci of data.puzzle.solution) {
    if (!/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(uci)) throw new Error('Solución UCI no válida.');
    fen = uciMove(fen, uci).fen();
  }
  return {
    id: `lichess:${data.puzzle.id}`,
    source: `https://lichess.org/training/${data.puzzle.id}`,
    fen: board.fen(),
    moves: data.puzzle.solution,
    title: `Problema Lichess ${data.puzzle.id}`,
    themes: data.puzzle.themes ?? [],
    rating: Number.isFinite(data.puzzle.rating) ? data.puzzle.rating : null,
  };
}
export async function fetchDaily(): Promise<Puzzle> {
  const response = await fetch('https://lichess.org/api/puzzle/daily', {
    signal: AbortSignal.timeout(15000),
    credentials: 'omit',
  });
  if (!response.ok)
    throw new Error('Lichess no ha podido entregar el problema diario. Inténtalo más tarde.');
  return dailyPuzzle(await response.json());
}
function csvRow(line: string) {
  const cells: string[] = [];
  let text = '',
    quoted = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (quoted && line[i + 1] === '"') {
        text += '"';
        i++;
      } else quoted = !quoted;
    } else if (c === ',' && !quoted) {
      cells.push(text);
      text = '';
    } else text += c;
  }
  cells.push(text);
  return cells;
}
export function importPuzzleCsv(csv: string): Puzzle[] {
  if (csv.length > 5000000) throw new Error('Selecciona un CSV de hasta 5 MB.');
  const result: Puzzle[] = [];
  for (const line of csv.replace(/^\uFEFF/, '').split(/\r?\n/)) {
    if (!line.trim() || line.startsWith('PuzzleId,')) continue;
    if (result.length >= 500)
      throw new Error('Importa como máximo 500 problemas por archivo para no bloquear el móvil.');
    const row = csvRow(line),
      id = row[0],
      fen = row[1],
      moves = row[2]?.trim().split(/\s+/);
    if (!id || !fen || !moves?.length || !/^\w{5,12}$/.test(id))
      throw new Error('El archivo no tiene el formato CSV público de Lichess.');
    let current = uciMove(fen, moves[0]!).fen();
    const initial = current;
    for (const move of moves.slice(1)) current = uciMove(current, move).fen();
    if (moves.length < 2) throw new Error('El problema no contiene solución.');
    result.push({
      id: `lichess:${id}`,
      source: `https://lichess.org/training/${id}`,
      fen: initial,
      moves: moves.slice(1),
      title: `Problema Lichess ${id}`,
      themes: (row[7] ?? '').split(' ').filter(Boolean),
      rating: row[3]?.trim() && Number.isFinite(Number(row[3])) ? Number(row[3]) : null,
    });
  }
  if (!result.length) throw new Error('El archivo no contiene problemas.');
  return result;
}

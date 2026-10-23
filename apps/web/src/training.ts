import { Chess } from 'chess.js';
export const openings = [
  {
    id: 'italiana',
    name: 'Apertura italiana',
    tag: 'ABIERTA',
    moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Bc5', 'c3', 'Nf6'],
    description: 'Controla el centro, desarrolla tus piezas y apunta al flanco de rey.',
    lesson:
      'El alfil de c4 presiona f7. Prepara d4 con c3 y completa el desarrollo antes de atacar.',
  },
  {
    id: 'londres',
    name: 'Sistema de Londres',
    tag: 'SISTEMA',
    moves: ['d4', 'd5', 'Nf3', 'Nf6', 'Bf4', 'e6', 'e3', 'Bd6'],
    description: 'Una estructura sólida para construir tu siguiente jugada.',
    lesson:
      'Desarrolla el alfil de casillas negras antes de e3. Sostén d4 y busca un desarrollo armonioso.',
  },
  {
    id: 'siciliana',
    name: 'Defensa siciliana',
    tag: 'SEMIABIERTA',
    moves: ['e4', 'c5', 'Nf3', 'd6', 'd4', 'cxd4', 'Nxd4', 'Nf6'],
    description: 'Desequilibra la posición y juega por la iniciativa con negras.',
    lesson:
      'c5 disputa d4 desde el flanco. En la variante abierta, las negras obtienen una columna c semiabierta.',
  },
  {
    id: 'dama',
    name: 'Gambito de dama',
    tag: 'CERRADA',
    moves: ['d4', 'd5', 'c4', 'e6', 'Nc3', 'Nf6', 'Bg5', 'Be7'],
    description: 'Presiona el centro y aprende a jugar con espacio.',
    lesson:
      'c4 presiona el peón de d5. Desarrolla las piezas y prepara la ruptura central, sin perseguir recuperar un peón a toda costa.',
  },
];
export const puzzles = [
  {
    id: 'mate-1',
    title: 'La diagonal olvidada',
    setup: ['f3', 'e5', 'g4'],
    solution: 'Qh4#',
    hint: 'La dama puede entrar por la diagonal d8–h4. Busca un jaque sin defensa.',
    theme: 'Mate en una',
  },
  {
    id: 'mate-2',
    title: 'El punto más débil',
    setup: ['e4', 'e5', 'Bc4', 'Nc6', 'Qh5', 'Nf6'],
    solution: 'Qxf7#',
    hint: 'La dama y el alfil apuntan a f7. El rey no puede capturar una pieza protegida.',
    theme: 'Ataque a f7',
  },
  {
    id: 'mate-3',
    title: 'Desarrollo con intención',
    setup: ['e4', 'e5', 'Nf3', 'd6', 'Bc4', 'Bg4', 'Nc3', 'g6', 'Nxe5', 'Bxd1', 'Bxf7+', 'Ke7'],
    solution: 'Nd5#',
    hint: 'El caballo de c3 puede incorporarse al ataque con jaque.',
    theme: 'Coordinación de piezas',
  },
];
export function position(moves: readonly string[]) {
  const chess = new Chess();
  for (const move of moves) chess.move(move);
  return chess;
}
export interface Study {
  id: string;
  name: string;
  pgn: string;
  updated: string;
}
export interface Progress {
  solved: string[];
  completed: string[];
  attempts: number;
  dates: string[];
}
export const emptyProgress: Progress = { solved: [], completed: [], attempts: 0, dates: [] };
export function loadStudies(): Study[] {
  try {
    const data: unknown = JSON.parse(localStorage.getItem('chessdev.studies') || '[]');
    if (!Array.isArray(data)) return [];
    return data.filter(
      (s): s is Study =>
        typeof s?.id === 'string' &&
        typeof s.name === 'string' &&
        typeof s.pgn === 'string' &&
        typeof s.updated === 'string',
    );
  } catch {
    return [];
  }
}
export function loadProgress(): Progress {
  try {
    const p = JSON.parse(localStorage.getItem('chessdev.progress') || 'null');
    if (
      p &&
      ['solved', 'completed', 'dates'].every(
        (k) => Array.isArray(p[k]) && p[k].every((v: unknown) => typeof v === 'string'),
      ) &&
      Number.isInteger(p.attempts) &&
      p.attempts >= 0
    )
      return p;
  } catch {
    /* Browser storage may be unavailable. */
  }
  return emptyProgress;
}
export function downloadPgn(pgn: string) {
  const url = URL.createObjectURL(new Blob([pgn], { type: 'application/x-chess-pgn' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'chessdev-estudio.pgn';
  anchor.click();
  URL.revokeObjectURL(url);
}

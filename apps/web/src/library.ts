import { Chess, DEFAULT_POSITION, type Square, type PieceSymbol } from 'chess.js';
import { useEffect, useState } from 'react';
import type { GameReview } from './engine';
export interface MoveNode {
  id: string;
  san: string;
  uci: string;
  fen: string;
  comment: string;
  nags: number[];
  children: MoveNode[];
}
export interface Study {
  id: string;
  name: string;
  headers: Record<string, string>;
  root: MoveNode;
  updated: string;
}
export interface Line {
  id: string;
  studyId: string;
  name: string;
  initialFen: string;
  moves: { san: string; uci: string; fen: string }[];
}
export interface Card {
  repetitions: number;
  interval: number;
  ease: number;
  due: number;
  attempts: number;
  failures: number;
}
export interface Practice {
  id: string;
  lineId: string;
  studyId: string;
  at: string;
  quality: number;
  errors: number;
  hints: number;
  milliseconds: number;
  mode: string;
}
export interface Puzzle {
  id: string;
  source: string;
  fen: string;
  moves: string[];
  title: string;
  themes: string[];
  rating: number | null;
}
export interface Cycle {
  ids: string[];
  cycle: number;
  index: number;
  milliseconds: number;
  errors: number;
  results: { milliseconds: number; errors: number; count: number }[];
  target: number;
}
export interface Library {
  version: 1;
  studies: Study[];
  cards: Record<string, Card>;
  practices: Practice[];
  puzzles: Puzzle[];
  reviews: GameReview[];
  cycle: Cycle | null;
}
export const emptyLibrary = (): Library => ({
  version: 1,
  studies: [],
  cards: {},
  practices: [],
  puzzles: [],
  reviews: [],
  cycle: null,
});
export function newStudy(name = 'Mi estudio', fen = DEFAULT_POSITION): Study {
  new Chess(fen);
  return {
    id: crypto.randomUUID(),
    name,
    headers: {},
    root: { id: crypto.randomUUID(), san: '', uci: '', fen, comment: '', nags: [], children: [] },
    updated: new Date().toISOString(),
  };
}
export function addMove(
  study: Study,
  nodeId: string,
  from: Square,
  to: Square,
  promotion: PieceSymbol = 'q',
) {
  const next = structuredClone(study),
    node = findNode(next.root, nodeId);
  if (!node) throw new Error('No se encuentra la posición.');
  const chess = new Chess(node.fen),
    move = chess.move({ from, to, promotion }),
    uci = move.from + move.to + (move.promotion ?? '');
  let child = node.children.find((n) => n.uci === uci);
  if (!child) {
    child = {
      id: crypto.randomUUID(),
      san: move.san,
      uci,
      fen: chess.fen(),
      comment: '',
      nags: [],
      children: [],
    };
    node.children.push(child);
  }
  next.updated = new Date().toISOString();
  return { study: next, nodeId: child.id };
}
export function findNode(root: MoveNode, id: string): MoveNode | null {
  if (root.id === id) return root;
  for (const child of root.children) {
    const found = findNode(child, id);
    if (found) return found;
  }
  return null;
}
export function pathTo(root: MoveNode, id: string): MoveNode[] | null {
  if (root.id === id) return [root];
  for (const c of root.children) {
    const tail = pathTo(c, id);
    if (tail) return [root, ...tail];
  }
  return null;
}
export function studyLines(study: Study): Line[] {
  const lines: Line[] = [];
  function visit(node: MoveNode, path: MoveNode[]) {
    if (!node.children.length && path.length)
      lines.push({
        id: `${study.id}:${node.id}`,
        studyId: study.id,
        name: `${study.name} · línea ${lines.length + 1}`,
        initialFen: study.root.fen,
        moves: path.map((n) => ({ san: n.san, uci: n.uci, fen: n.fen })),
      });
    for (const c of node.children) visit(c, [...path, c]);
  }
  visit(study.root, []);
  return lines;
}
function headerValue(value: string) {
  return value.replaceAll('\\', '\\\\').replaceAll('"', '\\"').replaceAll('\n', ' ');
}
export function exportStudy(study: Study): string {
  const headers: Record<string, string> = { ...study.headers, Event: study.name };
  if (study.root.fen !== DEFAULT_POSITION)
    Object.assign(headers, { SetUp: '1', FEN: study.root.fen });
  function moveText(node: MoveNode, parent: MoveNode) {
    const fields = parent.fen.split(' '),
      number = fields[5] ?? '1',
      prefix = fields[1] === 'w' ? `${number}.` : `${number}...`;
    return `${prefix} ${node.san}${node.nags.map((n) => ` $${n}`).join('')}${node.comment ? ` {${node.comment.replaceAll(/[{}]/g, '')}}` : ''}`;
  }
  function continuation(parent: MoveNode): string {
    const first = parent.children[0];
    if (!first) return '';
    const variations = parent.children
      .slice(1)
      .map((v) => `(${moveText(v, parent)} ${continuation(v)})`)
      .join(' ');
    return `${moveText(first, parent)} ${variations} ${continuation(first)}`;
  }
  const h = Object.entries(headers)
    .map(([k, v]) => `[${k} "${headerValue(v)}"]`)
    .join('\n');
  return `${h}\n\n${study.root.comment ? `{${study.root.comment.replaceAll(/[{}]/g, '')}} ` : ''}${continuation(study.root)} ${headers.Result ?? '*'}`.trim();
}
export function importStudy(pgn: string, name?: string): Study {
  if (pgn.length > 1000000) throw new Error('El PGN debe ocupar menos de 1 MB.');
  const headers: Record<string, string> = {};
  const body = pgn.replace(
    /^\s*\[(\w+)\s+"((?:\\.|[^"\\])*)"\s*\]\s*$/gm,
    (_all, k: string, v: string) => {
      headers[k] = v.replace(/\\([\\"])/g, '$1');
      return '';
    },
  );
  const study = newStudy(
    name || headers.Event || 'Estudio importado',
    headers.FEN || DEFAULT_POSITION,
  );
  study.headers = headers;
  const tokens = body.match(/\{[^}]*\}|;[^\n]*|\(|\)|\$\d+|[^\s(){}]+/g) ?? [];
  let current = study.root,
    previous: MoveNode | null = null,
    count = 0;
  const stack: { current: MoveNode; previous: MoveNode | null }[] = [];
  for (let token of tokens) {
    if (token.startsWith('{') || token.startsWith(';')) {
      current.comment = [
        current.comment,
        token.startsWith('{') ? token.slice(1, -1) : token.slice(1),
      ]
        .filter(Boolean)
        .join('\n');
      continue;
    }
    if (token === '(') {
      if (!previous) throw new Error('Variante PGN sin jugada anterior.');
      if (stack.length >= 32) throw new Error('El PGN tiene demasiados niveles de variantes.');
      stack.push({ current, previous });
      current = previous;
      previous = null;
      continue;
    }
    if (token === ')') {
      const saved = stack.pop();
      if (!saved) throw new Error('Paréntesis PGN sin apertura.');
      current = saved.current;
      previous = saved.previous;
      continue;
    }
    if (/^\$\d+$/.test(token)) {
      current.nags.push(Number(token.slice(1)));
      continue;
    }
    token = token.replace(/^\d+\.(?:\.\.)?/, '');
    if (['*', '1-0', '0-1', '1/2-1/2'].includes(token)) {
      if (!stack.length) headers.Result = token;
      continue;
    }
    if (!token || token === '...') continue;
    const annotation = token.match(/([!?]+)$/)?.[1];
    token = token.replace(/[!?]+$/, '');
    const chess = new Chess(current.fen);
    let move;
    try {
      move = chess.move(token);
    } catch {
      throw new Error(`Jugada PGN no válida: ${token}`);
    }
    if (++count > 1500) throw new Error('El PGN tiene demasiadas jugadas.');
    const uci = move.from + move.to + (move.promotion ?? '');
    let child = current.children.find((n) => n.uci === uci);
    if (!child) {
      child = {
        id: crypto.randomUUID(),
        san: move.san,
        uci,
        fen: chess.fen(),
        comment: '',
        nags: [],
        children: [],
      };
      current.children.push(child);
    }
    if (annotation)
      child.nags.push(
        ({ '!': 1, '?': 2, '!!': 3, '??': 4, '!?': 5, '?!': 6 } as Record<string, number>)[
          annotation
        ] ?? 0,
      );
    previous = current;
    current = child;
  }
  if (stack.length) throw new Error('El PGN contiene variantes sin cerrar.');
  if (!count) throw new Error('El PGN no contiene jugadas.');
  return study;
}
export function schedule(card: Card | undefined, quality: number, now = Date.now()): Card {
  const q = Math.max(0, Math.min(5, Math.floor(quality))),
    old = card ?? { repetitions: 0, interval: 0, ease: 2.5, due: now, attempts: 0, failures: 0 };
  const ease = Math.max(1.3, old.ease + 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)),
    repetitions = q < 3 ? 0 : old.repetitions + 1;
  const interval =
    q < 3
      ? 1
      : repetitions === 1
        ? 1
        : repetitions === 2
          ? 6
          : Math.max(1, Math.round(old.interval * old.ease));
  return {
    repetitions,
    interval,
    ease,
    due: now + interval * 86400000,
    attempts: old.attempts + 1,
    failures: old.failures + (q < 3 ? 1 : 0),
  };
}
const key = 'chessdev.library.v1',
  event = 'chessdev-library-changed';
export function loadLibrary(): Library {
  try {
    const raw = JSON.parse(localStorage.getItem(key) ?? 'null');
    if (
      raw?.version === 1 &&
      Array.isArray(raw.studies) &&
      Array.isArray(raw.practices) &&
      Array.isArray(raw.puzzles) &&
      Array.isArray(raw.reviews) &&
      raw.cards &&
      typeof raw.cards === 'object'
    )
      return raw;
    const result = emptyLibrary();
    for (const old of JSON.parse(localStorage.getItem('chessdev.studies') ?? '[]')) {
      try {
        const study = importStudy(old.pgn, old.name);
        study.id = old.id;
        study.updated = old.updated;
        result.studies.push(study);
      } catch {
        /* Keep original entry untouched in the legacy key. */
      }
    }
    // Persist generated node IDs once so migrated review cards remain stable.
    localStorage.setItem(key, JSON.stringify(result));
    return result;
  } catch {
    return emptyLibrary();
  }
}
export function saveLibrary(value: Library) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new Event(event));
  } catch {
    throw new Error(
      'No se ha podido guardar en este navegador. Exporta tus estudios antes de cerrar.',
    );
  }
}
export function useLibrary() {
  const [data, setData] = useState(loadLibrary);
  useEffect(() => {
    const refresh = () => setData(loadLibrary());
    window.addEventListener(event, refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener(event, refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);
  function update(change: (current: Library) => Library) {
    saveLibrary(change(loadLibrary()));
  }
  return { data, update };
}
export function uciMove(fen: string, uci: string) {
  const chess = new Chess(fen);
  chess.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] ?? 'q' });
  return chess;
}
export function cycleStep(cycle: Cycle, milliseconds: number, errors: number): Cycle {
  const next = {
    ...cycle,
    index: cycle.index + 1,
    milliseconds: cycle.milliseconds + milliseconds,
    errors: cycle.errors + errors,
  };
  if (next.index >= next.ids.length) {
    next.results = [
      ...next.results,
      { milliseconds: next.milliseconds, errors: next.errors, count: next.ids.length },
    ];
    next.cycle++;
    next.index = 0;
    next.milliseconds = 0;
    next.errors = 0;
  }
  return next;
}
export function mainLine(root: MoveNode) {
  const nodes = [root];
  let node = root;
  while (node.children[0]) {
    node = node.children[0];
    nodes.push(node);
  }
  return nodes;
}

import { useState } from 'react';
import { Chess, type Square, type PieceSymbol } from 'chess.js';
import { Board } from './Board';
import {
  cycleStep,
  schedule,
  studyLines,
  uciMove,
  useLibrary,
  type Line,
  type Puzzle,
} from './library';
import { fetchDaily, importPuzzleCsv } from './puzzles';
import { legalSan } from './engine';
export type TrainerMode =
  'learn' | 'openings' | 'review' | 'woodpecker' | 'puzzles' | 'weakness' | 'endgames';
interface Session {
  key: string;
  studyId: string;
  title: string;
  source: string;
  initialFen: string;
  fen: string;
  moves: string[];
  index: number;
  side: 'w' | 'b';
  errors: number;
  hints: number;
  revealed: boolean;
  done: boolean;
  started: number;
  milliseconds: number;
}
function advance(session: Session): Session {
  const next = { ...session };
  while (next.index < next.moves.length && new Chess(next.fen).turn() !== next.side) {
    next.fen = uciMove(next.fen, next.moves[next.index]!).fen();
    next.index++;
  }
  return next;
}
function fromLine(line: Line, side: 'w' | 'b'): Session {
  return advance({
    key: `${line.id}:${side}`,
    studyId: line.studyId,
    title: line.name,
    source: 'Tu estudio',
    initialFen: line.initialFen,
    fen: line.initialFen,
    moves: line.moves.map((m) => m.uci),
    index: 0,
    side,
    errors: 0,
    hints: 0,
    revealed: false,
    done: false,
    started: Date.now(),
    milliseconds: 0,
  });
}
function fromPuzzle(p: Puzzle): Session {
  return {
    key: p.id,
    studyId: '',
    title: p.title,
    source: p.source,
    initialFen: p.fen,
    fen: p.fen,
    moves: p.moves,
    index: 0,
    side: new Chess(p.fen).turn(),
    errors: 0,
    hints: 0,
    revealed: false,
    done: false,
    started: Date.now(),
    milliseconds: 0,
  };
}
function duration(ms: number) {
  return `${Math.floor(ms / 60000)}:${String(Math.floor(ms / 1000) % 60).padStart(2, '0')}`;
}
export function Trainer({ mode }: { mode: TrainerMode }) {
  const { data, update } = useLibrary(),
    [studyId, setStudyId] = useState(''),
    [side, setSide] = useState<'w' | 'b'>('w'),
    [session, setSession] = useState<Session | null>(null),
    [notice, setNotice] = useState(''),
    [busy, setBusy] = useState(false),
    [selected, setSelected] = useState<string[]>([]),
    [target, setTarget] = useState(7);
  const isLine = ['learn', 'openings', 'review'].includes(mode),
    now = Date.now();
  const lines = data.studies
    .filter((s) => !studyId || s.id === studyId)
    .flatMap(studyLines)
    .filter((l) =>
      l.moves.some((_m, i) => (l.initialFen.split(' ')[1] === side ? i % 2 === 0 : i % 2 === 1)),
    );
  const availableLines =
    mode === 'review'
      ? lines.filter(
          (l) => data.cards[`${l.id}:${side}`] && data.cards[`${l.id}:${side}`]!.due <= now,
        )
      : lines;
  const problems = data.puzzles.filter((p) =>
    mode === 'weakness'
      ? p.id.startsWith('review:')
      : mode === 'endgames'
        ? p.themes.some((t) => t.toLowerCase().includes('endgame'))
        : true,
  );
  function startLine(line: Line) {
    setSession(fromLine(line, side));
    setNotice('');
  }
  function startPuzzle(p: Puzzle) {
    setSession(fromPuzzle(p));
    setNotice('');
  }
  function finish(next: Session) {
    const milliseconds = Date.now() - next.started,
      quality = next.revealed ? 0 : next.hints ? 2 : next.errors ? 3 : 5;
    next.done = true;
    next.milliseconds = milliseconds;
    update((current) => ({
      ...current,
      cards: { ...current.cards, [next.key]: schedule(current.cards[next.key], quality) },
      practices: [
        {
          id: crypto.randomUUID(),
          lineId: next.key,
          studyId: next.studyId,
          at: new Date().toISOString(),
          quality,
          errors: next.errors,
          hints: next.hints,
          milliseconds,
          mode,
        },
        ...current.practices,
      ],
      cycle:
        mode === 'woodpecker' &&
        current.cycle &&
        current.cycle.cycle < current.cycle.target &&
        current.cycle.ids[current.cycle.index] === next.key
          ? cycleStep(current.cycle, milliseconds, next.errors)
          : current.cycle,
    }));
    setNotice(
      `Sesión completada: ${next.errors} errores, ${next.hints} pistas, ${duration(milliseconds)}. La próxima revisión se calcula con SM2.`,
    );
    setSession(next);
  }
  function play(from: Square, to: Square, promotion: PieceSymbol) {
    if (!session || session.done) return;
    try {
      const board = new Chess(session.fen),
        move = board.move({ from, to, promotion }),
        uci = move.from + move.to + (move.promotion ?? '');
      const mateAlternative = !isLine && board.isCheckmate();
      if (uci !== session.moves[session.index] && !mateAlternative) {
        setSession({ ...session, errors: session.errors + 1 });
        setNotice(
          'Jugada legal, pero no es la continuación de esta posición. Inténtalo de nuevo o consulta una pista.',
        );
        return;
      }
      const next = mateAlternative
        ? { ...session, fen: board.fen(), index: session.moves.length }
        : advance({ ...session, fen: board.fen(), index: session.index + 1 });
      if (next.index >= next.moves.length) finish(next);
      else {
        setSession(next);
        setNotice('Correcto. Se ha reproducido la respuesta del otro color.');
      }
    } catch (e) {
      setNotice((e as Error).message);
    }
  }
  async function daily() {
    setBusy(true);
    try {
      const puzzle = await fetchDaily();
      update((current) => ({
        ...current,
        puzzles: [puzzle, ...current.puzzles.filter((p) => p.id !== puzzle.id)],
      }));
      startPuzzle(puzzle);
    } catch (e) {
      setNotice((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  function newCycle() {
    const ids = selected.length ? selected : problems.map((p) => p.id);
    if (!ids.length) {
      setNotice('Añade problemas reales desde Lichess o desde una revisión de tus partidas.');
      return;
    }
    try {
      update((current) => ({
        ...current,
        cycle: { ids, cycle: 0, index: 0, milliseconds: 0, errors: 0, results: [], target },
      }));
      startPuzzle(data.puzzles.find((p) => p.id === ids[0])!);
    } catch (e) {
      setNotice((e as Error).message);
    }
  }
  function continueCycle() {
    const cycle = data.cycle;
    if (!cycle || cycle.cycle >= cycle.target) {
      setSession(null);
      return;
    }
    const puzzle = data.puzzles.find((p) => p.id === cycle.ids[cycle.index]);
    if (puzzle) startPuzzle(puzzle);
    else
      setNotice(
        'No se encuentra una posición de la colección. Crea un ciclo con las posiciones disponibles.',
      );
  }
  const cycle = data.cycle;
  return (
    <div className="real-workspace">
      {notice && (
        <p className="notice" role="status">
          {notice}
        </p>
      )}
      <section className="card training-intro">
        <h2>
          {
            {
              learn: 'Aprende las variantes de tus estudios',
              openings: 'Entrena tu repertorio de aperturas',
              review: 'Repaso espaciado de tus líneas',
              woodpecker: 'Ciclos Woodpecker',
              puzzles: 'Problemas con fuente verificable',
              weakness: 'Entrena posiciones de tus errores',
              endgames: 'Entrena finales de tu colección',
            }[mode]
          }
        </h2>
        <p>
          {isLine
            ? 'Juega solo tu color: las respuestas se reproducen automáticamente. Cada intento registra errores, pistas, tiempo y próxima fecha de revisión.'
            : 'Las posiciones proceden de Lichess o de las revisiones que has calculado con Stockfish. Cada problema conserva su fuente y su solución.'}
        </p>
        {isLine ? (
          <div className="button-row">
            <label>
              Estudio
              <select
                aria-label="Estudio"
                value={studyId}
                onChange={(e) => {
                  setStudyId(e.target.value);
                  setSession(null);
                }}
              >
                <option value="">Todos mis estudios</option>
                {data.studies.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Mi color
              <select
                value={side}
                onChange={(e) => {
                  setSide(e.target.value as 'w' | 'b');
                  setSession(null);
                }}
              >
                <option value="w">Blancas</option>
                <option value="b">Negras</option>
              </select>
            </label>
            <span className="pill">
              {availableLines.length} líneas {mode === 'review' ? 'pendientes' : 'disponibles'}
            </span>
          </div>
        ) : (
          <div className="button-row">
            <button className="button cream" disabled={busy} onClick={() => void daily()}>
              {busy ? 'Consultando Lichess…' : 'Cargar problema diario de Lichess'}
            </button>
            <label className="file-label">
              Importar colección CSV Lichess
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  try {
                    if (file.size > 5000000) throw new Error('Selecciona un CSV de hasta 5 MB.');
                    const imported = importPuzzleCsv(await file.text());
                    update((current) => ({
                      ...current,
                      puzzles: [
                        ...imported,
                        ...current.puzzles.filter((p) => !imported.some((i) => i.id === p.id)),
                      ],
                    }));
                    setNotice(
                      `${imported.length} problemas importados con su fuente, rating y solución.`,
                    );
                  } catch (error) {
                    setNotice((error as Error).message);
                  }
                  e.target.value = '';
                }}
              />
            </label>
            <a
              className="text-button"
              href="https://database.lichess.org/#puzzles"
              target="_blank"
              rel="noreferrer"
            >
              Formato y licencia CC0 ↗
            </a>
          </div>
        )}
      </section>
      {mode === 'review' && !availableLines.length && (
        <p className="empty-state card">
          No hay líneas que debas repasar ahora. Aprende primero una variante de tus estudios; el
          próximo repaso se programa según tu resultado.
        </p>
      )}
      {isLine && mode !== 'review' && !lines.length && (
        <p className="empty-state card">
          Todavía no hay variantes para este color. Crea o importa un estudio PGN en Mis estudios.
          Puedes añadir tus propias variantes y elegir el color que quieres practicar.
        </p>
      )}
      {!isLine && !problems.length && (
        <p className="empty-state card">
          {mode === 'weakness'
            ? 'Revisa una partida y pulsa Entrenar mis errores para generar posiciones a partir de pérdidas reales.'
            : mode === 'endgames'
              ? 'Tu colección todavía no contiene posiciones etiquetadas como finales. Importa un CSV de Lichess con el tema endgame.'
              : 'Tu colección está vacía. Carga el problema diario o importa una colección.'}
        </p>
      )}
      {mode === 'woodpecker' && (
        <section className="card cycle-panel">
          <h3>Tu plan de ciclos</h3>
          <p>
            Resuelve la misma colección en cada ciclo. El objetivo del siguiente ciclo es la mitad
            del tiempo medido en el anterior; Los tiempos y errores de cada ciclo se guardan al
            completarlo.
          </p>
          <div className="button-row">
            <label>
              Número de ciclos
              <select value={target} onChange={(e) => setTarget(Number(e.target.value))}>
                {[2, 3, 4, 5, 6, 7].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
            <button className="button cream" onClick={newCycle}>
              Crear plan con {selected.length || problems.length} problemas
            </button>
            {cycle && cycle.cycle < cycle.target && (
              <button className="button" onClick={continueCycle}>
                Continuar ciclo {cycle.cycle + 1} / {cycle.target}
              </button>
            )}
          </div>
          {cycle && (
            <>
              <p>
                {cycle.cycle >= cycle.target
                  ? 'Plan completado'
                  : `Ciclo ${cycle.cycle + 1}/${cycle.target} · ${cycle.index}/${cycle.ids.length} problemas completados`}
              </p>
              {cycle.results.length > 0 && (
                <p>
                  Objetivo del próximo ciclo:{' '}
                  {duration(cycle.results[cycle.results.length - 1]!.milliseconds / 2)}
                </p>
              )}
              <div className="cycle-results">
                {cycle.results.map((r, i) => (
                  <span key={i}>
                    Ciclo {i + 1}: {duration(r.milliseconds)} · {r.errors} errores · {r.count}{' '}
                    problemas
                  </span>
                ))}
              </div>
            </>
          )}
        </section>
      )}
      {session && (
        <div className="workspace-grid">
          <section className="board-panel card">
            <div className="board-meta">
              <span className="tiny-dot" />
              <strong>{session.title}</strong>
              <span>Juegas {session.side === 'w' ? 'blancas' : 'negras'}</span>
            </div>
            <Board
              fen={session.fen}
              flipped={session.side === 'b'}
              onMove={play}
              interactive={!session.done}
            />
            <div className="training-session-status">
              {session.done
                ? 'Sesión completada'
                : `Continuación ${session.index + 1}/${session.moves.length}`}{' '}
              · {session.errors} errores · {session.hints} pistas
            </div>
          </section>
          <aside className="workspace-side card">
            <h2>{session.done ? 'Resultado de tu sesión' : 'Recuerda la continuación'}</h2>
            <p>
              {session.source.startsWith('https://lichess.org/') ? (
                <a href={session.source} target="_blank" rel="noreferrer">
                  Ver problema original en Lichess ↗
                </a>
              ) : (
                session.source
              )}
            </p>
            <p>
              {isLine
                ? 'Las jugadas del otro color se reproducen automáticamente. Las variantes y comentarios se editan en Mis estudios.'
                : 'Juega la solución de la posición. En problemas de mate se aceptan también otras jugadas que dan mate inmediatamente.'}
            </p>
            {!session.done && (
              <>
                <button
                  className="button"
                  onClick={() => {
                    setSession({ ...session, hints: session.hints + 1 });
                    setNotice(
                      `Pista: juega ${legalSan(session.fen, session.moves[session.index]!)}.`,
                    );
                  }}
                >
                  Pista
                </button>
                <button
                  className="button"
                  onClick={() => {
                    setSession({ ...session, revealed: true, hints: session.hints + 1 });
                    let fen = session.fen;
                    const text = session.moves
                      .slice(session.index)
                      .map((uci) => {
                        const san = legalSan(fen, uci);
                        fen = uciMove(fen, uci).fen();
                        return san;
                      })
                      .join(' ');
                    setNotice(`Solución: ${text}. Este intento se registrará como no recordado.`);
                  }}
                >
                  Ver solución
                </button>
              </>
            )}
            {session.done && (
              <>
                <p>Tiempo: {duration(session.milliseconds)}</p>
                <p>
                  Próximo repaso:{' '}
                  {new Date(data.cards[session.key]?.due ?? Date.now()).toLocaleString('es-ES')}
                </p>
                {mode === 'woodpecker' ? (
                  <button className="button cream" onClick={continueCycle}>
                    Continuar plan
                  </button>
                ) : (
                  <button
                    className="button cream"
                    onClick={() => {
                      const next = isLine
                        ? availableLines.find((l) => `${l.id}:${side}` !== session.key)
                        : problems.find((p) => p.id !== session.key);
                      if (next) {
                        if (isLine) startLine(next as Line);
                        else startPuzzle(next as Puzzle);
                      } else setSession(null);
                    }}
                  >
                    Siguiente posición
                  </button>
                )}
              </>
            )}
            <p className="local-note">
              La puntuación de recuerdo se usa solo para programar SM2. No es Elo ni precisión de
              juego.
            </p>
          </aside>
        </div>
      )}
      {isLine ? (
        <section className="card collection-list">
          <h3>Variantes de tu biblioteca</h3>
          {availableLines.map((line) => {
            const card = data.cards[`${line.id}:${side}`];
            return (
              <button className="collection-item" key={line.id} onClick={() => startLine(line)}>
                <strong>{line.name}</strong>
                <span>{line.moves.map((m) => m.san).join(' ')}</span>
                <small>
                  {card
                    ? `${card.attempts} intentos · próximo repaso ${new Date(card.due).toLocaleDateString('es-ES')}`
                    : 'Sin entrenar'}
                </small>
              </button>
            );
          })}
        </section>
      ) : (
        <section className="card collection-list">
          <h3>{problems.length} posiciones en tu colección</h3>
          {problems.map((p) => (
            <div className="collection-row" key={p.id}>
              {mode === 'woodpecker' && (
                <input
                  type="checkbox"
                  aria-label={`Incluir ${p.title}`}
                  checked={selected.includes(p.id)}
                  onChange={(e) =>
                    setSelected(
                      e.target.checked ? [...selected, p.id] : selected.filter((id) => id !== p.id),
                    )
                  }
                />
              )}
              <button className="collection-item" onClick={() => startPuzzle(p)}>
                <strong>{p.title}</strong>
                <span>{p.themes.join(' · ')}</span>
                <small>
                  {p.rating === null
                    ? 'Sin rating asignado'
                    : `Rating del problema en Lichess: ${p.rating}`}
                </small>
              </button>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}

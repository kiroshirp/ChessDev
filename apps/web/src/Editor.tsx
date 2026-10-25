import { useEffect, useRef, useState } from 'react';
import type { Square, PieceSymbol } from 'chess.js';
import { Board } from './Board';
import {
  addMove,
  exportStudy,
  findNode,
  importStudy,
  mainLine,
  newStudy,
  pathTo,
  useLibrary,
  type MoveNode,
  type Study,
} from './library';
import {
  Engine,
  evaluationLabel,
  principalVariation,
  reviewStudy,
  type Evaluation,
  type GameReview,
} from './engine';
import { downloadPgn } from './training';

export type EditorMode = 'studies' | 'analysis' | 'summary' | 'mistakes';
function Tree({
  node,
  selected,
  onSelect,
  depth = 0,
}: {
  node: MoveNode;
  selected: string;
  onSelect: (id: string) => void;
  depth?: number;
}) {
  return (
    <>
      {node.children.map((child, i) => (
        <div key={child.id} className="variation-row">
          <button
            style={{ paddingLeft: `${Math.min(depth, 5) * 12 + 8}px` }}
            className={selected === child.id ? 'current' : ''}
            onClick={() => onSelect(child.id)}
          >
            <small>
              {i > 0 ? '↳ ' : ''}
              {child.fen.split(' ')[1] === 'b'
                ? `${child.fen.split(' ')[5]}.`
                : `${Number(child.fen.split(' ')[5]) - 1}…`}
            </small>{' '}
            {child.san}
            {child.nags.length ? ` $${child.nags.join(' $')}` : ''}
            {child.comment ? ' ▤' : ''}
          </button>
          <Tree
            node={child}
            selected={selected}
            onSelect={onSelect}
            depth={depth + (i > 0 ? 1 : 0)}
          />
        </div>
      ))}
    </>
  );
}
export function Editor({ mode, initialPgn = '' }: { mode: EditorMode; initialPgn?: string }) {
  const { data, update } = useLibrary();
  const [draft, setDraft] = useState(() => newStudy()),
    [selected, setSelected] = useState(draft.root.id),
    [pgn, setPgn] = useState(''),
    [fenInput, setFenInput] = useState(''),
    [notice, setNotice] = useState(''),
    [flipped, setFlipped] = useState(false);
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null),
    [busy, setBusy] = useState(false),
    [status, setStatus] = useState(''),
    [activeReview, setActiveReview] = useState<GameReview | null>(null),
    [filter, setFilter] = useState(200);
  const engine = useRef(new Engine()),
    run = useRef(0);
  useEffect(
    () => () => {
      run.current++;
      engine.current.dispose();
    },
    [],
  );
  useEffect(() => {
    if (initialPgn) {
      try {
        const next = importStudy(initialPgn);
        setDraft(next);
        setSelected(next.root.id);
        setPgn(initialPgn);
        setActiveReview(null);
      } catch (e) {
        setNotice((e as Error).message);
      }
    }
  }, [initialPgn]);
  const node = findNode(draft.root, selected) ?? draft.root,
    path = pathTo(draft.root, node.id) ?? [draft.root],
    line = mainLine(draft.root);
  function selectStudy(study: Study) {
    cancel();
    setDraft(structuredClone(study));
    setSelected(study.root.id);
    setPgn(exportStudy(study));
    setActiveReview(data.reviews.find((r) => r.id === study.id) ?? null);
    setEvaluation(null);
    setNotice('');
  }
  function changed(next: Study) {
    cancel();
    setDraft({ ...next, updated: new Date().toISOString() });
    setEvaluation(null);
    setActiveReview(null);
  }
  function move(from: Square, to: Square, promotion: PieceSymbol) {
    try {
      const next = addMove(draft, node.id, from, to, promotion);
      changed(next.study);
      setSelected(next.nodeId);
      setPgn(exportStudy(next.study));
    } catch (e) {
      setNotice((e as Error).message);
    }
  }
  function importText(value = pgn) {
    try {
      const next = importStudy(value);
      selectStudy(next);
      setNotice('PGN importado con variantes, comentarios y anotaciones.');
    } catch (e) {
      setNotice((e as Error).message);
    }
  }
  function save() {
    if (!draft.name.trim()) {
      setNotice('Escribe un nombre para el estudio.');
      return;
    }
    try {
      const next = { ...draft, name: draft.name.trim(), updated: new Date().toISOString() };
      update((current) => ({
        ...current,
        studies: [next, ...current.studies.filter((s) => s.id !== next.id)],
      }));
      setDraft(next);
      setNotice('Estudio guardado. Todas sus variantes y comentarios se conservan.');
    } catch (e) {
      setNotice((e as Error).message);
    }
  }
  function cancel() {
    run.current++;
    engine.current.dispose();
    setBusy(false);
    setStatus('');
  }
  async function analyzePosition() {
    const id = ++run.current;
    setBusy(true);
    setStatus('Stockfish está analizando esta posición…');
    setNotice('');
    try {
      const result = await engine.current.analyze(node.fen, 18, 1200);
      if (id === run.current) {
        setEvaluation(result);
        setStatus('');
      }
    } catch (e) {
      if (id === run.current) setNotice((e as Error).message);
    } finally {
      if (id === run.current) setBusy(false);
    }
  }
  async function analyzeGame() {
    if (line.length < 2) {
      setNotice('Importa o juega una partida antes de revisarla.');
      return;
    }
    const id = ++run.current;
    setBusy(true);
    setStatus('Preparando revisión de la partida…');
    setNotice('');
    try {
      const result = await reviewStudy(draft, exportStudy(draft), engine.current, (done, total) => {
        if (id === run.current) setStatus(`Analizadas ${done} de ${total} posiciones`);
      });
      if (id !== run.current) return;
      update((current) => ({
        ...current,
        reviews: [result, ...current.reviews.filter((r) => r.id !== result.id)],
      }));
      setActiveReview(result);
      setStatus(
        'Revisión guardada. Puedes consultar cada jugada y guardar los errores para entrenarlos.',
      );
    } catch (e) {
      if (id === run.current) setNotice((e as Error).message);
    } finally {
      if (id === run.current) setBusy(false);
    }
  }
  function amend(comment: string, nags = node.nags) {
    const copy = structuredClone(draft),
      target = findNode(copy.root, node.id)!;
    target.comment = comment;
    target.nags = nags;
    changed(copy);
    setPgn(exportStudy(copy));
  }
  function promote() {
    if (path.length < 2) return;
    const copy = structuredClone(draft),
      parent = findNode(copy.root, path[path.length - 2]!.id)!,
      index = parent.children.findIndex((c) => c.id === node.id);
    if (index > 0) {
      parent.children.unshift(parent.children.splice(index, 1)[0]!);
      changed(copy);
      setPgn(exportStudy(copy));
    }
  }
  const review = activeReview,
    moves =
      review?.moves.filter((m) => mode !== 'mistakes' || m.loss >= filter || m.mateError) ?? [];
  function makeExercises() {
    if (!review) return;
    const mistakes = review.moves
      .filter((m) => m.loss >= 200 || m.mateError)
      .filter((m) => m.before.pv.length);
    const added = mistakes.map((m) => ({
      id: `review:${review.id}:${m.ply}`,
      source: `Revisión ${review.name}, jugada ${Math.ceil(m.ply / 2)} · Stockfish 19, profundidad ${m.before.depth}`,
      fen: m.before.fen,
      moves: m.before.pv.slice(0, 3),
      title: `${review.name} · ${m.played}`,
      themes: ['partida propia'],
      rating: null,
    }));
    try {
      update((current) => ({
        ...current,
        puzzles: [...added, ...current.puzzles.filter((p) => !added.some((a) => a.id === p.id))],
      }));
      setNotice(
        `${added.length} posiciones de tus errores guardadas para entrenar. La solución es la línea calculada por el motor a la profundidad indicada.`,
      );
    } catch (e) {
      setNotice((e as Error).message);
    }
  }
  return (
    <div className="real-workspace">
      {notice && (
        <p className="notice" role="status">
          {notice}
        </p>
      )}
      <section className="library-toolbar card">
        <label>
          Estudio
          <select
            aria-label="Estudio"
            value={data.studies.some((s) => s.id === draft.id) ? draft.id : ''}
            onChange={(e) => {
              const study = data.studies.find((s) => s.id === e.target.value);
              if (study) selectStudy(study);
            }}
          >
            <option value="">Nuevo / sin guardar</option>
            {data.studies.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <button className="button" onClick={() => selectStudy(newStudy())}>
          + Nuevo estudio
        </button>
        <label className="study-title">
          Nombre del estudio
          <input
            value={draft.name}
            onChange={(e) => changed({ ...draft, name: e.target.value })}
            maxLength={100}
          />
        </label>
        <button className="button cream" onClick={save}>
          Guardar estudio
        </button>
      </section>
      <div className="workspace-grid">
        <section className="board-panel card">
          <div className="board-meta">
            <span className="tiny-dot" />
            <strong>{draft.name}</strong>
            <span>{node.fen.split(' ')[1] === 'w' ? 'Juegan blancas' : 'Juegan negras'}</span>
          </div>
          <Board fen={node.fen} onMove={move} flipped={flipped} interactive={!busy} />
          <div className="replay">
            <button aria-label="Primera posición" onClick={() => setSelected(draft.root.id)}>
              ⇤
            </button>
            <button
              aria-label="Jugada anterior"
              onClick={() => setSelected(path[Math.max(0, path.length - 2)]!.id)}
            >
              ←
            </button>
            <button
              aria-label="Jugada siguiente"
              onClick={() => setSelected(node.children[0]?.id ?? node.id)}
            >
              →
            </button>
            <button
              aria-label="Continuar desde posición final"
              onClick={() => setSelected(line[line.length - 1]!.id)}
            >
              ⇥
            </button>
            <button aria-label="Girar tablero" onClick={() => setFlipped(!flipped)}>
              ⇅
            </button>
          </div>
          <div className="engine-tools">
            <button className="button" disabled={busy} onClick={() => void analyzePosition()}>
              Analizar posición
            </button>
            <button
              className="button cream"
              disabled={busy || line.length < 2}
              onClick={() => void analyzeGame()}
            >
              Revisar partida completa
            </button>
            {busy && (
              <button className="button" onClick={cancel}>
                Cancelar análisis
              </button>
            )}
          </div>
          {status && (
            <p className="engine-status" role="status">
              {status}
            </p>
          )}
          {evaluation?.fen === node.fen && (
            <div className="evaluation" data-testid="engine-evaluation">
              <strong>{evaluationLabel(evaluation)}</strong>
              <span>
                Stockfish 19 Lite · profundidad {evaluation.depth}
                <br />
                Evaluación desde el punto de vista de blancas
              </span>
              <p>Mejor continuación: {principalVariation(evaluation) || 'Posición terminada'}</p>
            </div>
          )}
          <p className="local-note">
            Análisis gratuito en tu dispositivo. El motor ligero se descarga al usarlo (1,9 MB). La
            profundidad depende del tiempo y del dispositivo; no es un entrenador conversacional.{' '}
            <a
              href={`${import.meta.env.BASE_URL}engine/SOURCE.txt`}
              target="_blank"
              rel="noreferrer"
            >
              Motor y licencia ↗
            </a>
          </p>
        </section>
        <aside className="workspace-side card">
          <h2>{mode === 'studies' ? 'Editor de estudios y variantes' : 'Partida y posiciones'}</h2>
          <label>
            Partida en PGN
            <textarea
              value={pgn}
              onChange={(e) => setPgn(e.target.value)}
              rows={5}
              placeholder="Pega tu PGN, con variantes y comentarios"
            />
          </label>
          <div className="button-row">
            <button className="button cream" onClick={() => importText()}>
              Importar PGN
            </button>
            <button className="button" onClick={() => downloadPgn(exportStudy(draft))}>
              Exportar PGN
            </button>
          </div>
          <label className="file-label">
            Abrir archivo PGN
            <input
              type="file"
              accept=".pgn,text/plain"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                if (file.size > 1000000) {
                  setNotice('El PGN debe ocupar menos de 1 MB.');
                  return;
                }
                importText(await file.text());
                e.target.value = '';
              }}
            />
          </label>
          <details>
            <summary>Posición inicial FEN</summary>
            <label>
              FEN
              <input value={fenInput} onChange={(e) => setFenInput(e.target.value)} />
            </label>
            <button
              className="button"
              onClick={() => {
                try {
                  selectStudy(newStudy(draft.name, fenInput));
                } catch {
                  setNotice('La posición FEN no es válida.');
                }
              }}
            >
              Crear desde FEN
            </button>
          </details>
          <h3>Árbol de jugadas</h3>
          <div className="variation-tree">
            <button
              className={node.id === draft.root.id ? 'current' : ''}
              onClick={() => setSelected(draft.root.id)}
            >
              Posición inicial
            </button>
            <Tree node={draft.root} selected={node.id} onSelect={setSelected} />
          </div>
          <label>
            Comentario de la posición
            <textarea value={node.comment} onChange={(e) => amend(e.target.value)} rows={3} />
          </label>
          <label>
            Anotación
            <select
              value={node.nags[0] ?? 0}
              onChange={(e) =>
                amend(node.comment, Number(e.target.value) ? [Number(e.target.value)] : [])
              }
            >
              <option value={0}>Sin anotación</option>
              <option value={1}>! Buena jugada (anotación propia)</option>
              <option value={2}>? Error (anotación propia)</option>
              <option value={3}>!!</option>
              <option value={4}>??</option>
              <option value={5}>!?</option>
              <option value={6}>?!</option>
            </select>
          </label>
          <button className="button" disabled={path.length < 2} onClick={promote}>
            Convertir en variante principal
          </button>
          <p className="local-note">
            Puedes volver a cualquier posición y jugar otra continuación: se crea una variante y se
            conserva la anterior. Los comentarios y símbolos son tus anotaciones, separadas del
            análisis del motor.
          </p>
        </aside>
      </div>
      {data.reviews.length > 0 && (
        <section className="card review-library">
          <h2>Revisiones guardadas</h2>
          <div className="study-list">
            {data.reviews.map((r) => (
              <button
                className="study-chip"
                key={r.id}
                onClick={() => {
                  const study = importStudy(r.pgn, r.name);
                  study.id = r.id;
                  selectStudy(study);
                  setActiveReview(r);
                }}
              >
                {r.name}
              </button>
            ))}
          </div>
        </section>
      )}
      {review && (
        <section className="card review-result">
          <div className="section-heading">
            <h2>
              {mode === 'mistakes' ? 'Revisión de errores' : 'Resumen de partida'} · {review.name}
            </h2>
            <button className="button" onClick={makeExercises}>
              Entrenar mis errores
            </button>
          </div>
          <div className="stats-grid">
            {[
              [review.moves.length, 'Medias jugadas analizadas'],
              [
                review.moves.filter((m) => m.loss >= 200 || m.mateError).length,
                'Pérdidas ≥ 200 cp o mate',
              ],
              [
                review.moves.filter((m) => m.before.mate === null && m.after.mate === null).length
                  ? Math.round(
                      review.moves
                        .filter((m) => m.before.mate === null && m.after.mate === null)
                        .reduce((a, m) => a + m.loss, 0) /
                        review.moves.filter((m) => m.before.mate === null && m.after.mate === null)
                          .length,
                    )
                  : '—',
                'Pérdida media en centipeones',
              ],
              [review.result, 'Resultado declarado en PGN'],
            ].map(([value, label]) => (
              <div className="stat" key={label}>
                <strong>{value}</strong>
                <span>{label}</span>
              </div>
            ))}
          </div>
          <svg
            className="eval-chart"
            viewBox="0 0 600 140"
            role="img"
            aria-label="Evolución de la evaluación de blancas, escala visual entre menos y más diez peones"
          >
            <path d="M10 70H590" stroke="#62686b" />
            <polyline
              fill="none"
              stroke="#c4d7bc"
              strokeWidth="2"
              points={review.moves
                .map(
                  (m, i) =>
                    `${10 + (i / Math.max(1, review.moves.length - 1)) * 580},${70 - (Math.max(-1000, Math.min(1000, m.after.cp)) / 1000) * 60}`,
                )
                .join(' ')}
            />
          </svg>
          <p className="local-note">
            Gráfico: evaluación de blancas (escala visual ±10). 100 centipeones = 1 peón. Las
            posiciones de mate no entran en la pérdida media. El criterio de errores graves es una
            pérdida calculada de al menos 200 cp o perder/permitir un mate; Las cifras describen
            este análisis a la profundidad indicada.
          </p>
          {mode === 'mistakes' && (
            <label>
              Mostrar
              <select value={filter} onChange={(e) => setFilter(Number(e.target.value))}>
                <option value={200}>Pérdidas ≥ 200 cp y mates</option>
                <option value={100}>Pérdidas ≥ 100 cp y mates</option>
                <option value={0}>Todas las jugadas</option>
              </select>
            </label>
          )}
          <div className="review-table">
            {moves.length ? (
              moves.map((m) => (
                <button
                  key={m.ply}
                  className={m.loss >= 200 || m.mateError ? 'review-error' : ''}
                  onClick={() => {
                    setSelected(mainLine(draft.root)[m.ply - 1]?.id ?? draft.root.id);
                    setEvaluation(m.before);
                  }}
                >
                  <span>
                    {Math.ceil(m.ply / 2)}
                    {m.color === 'w' ? '.' : '…'} {m.played}
                  </span>
                  <span>
                    {m.mateError ? 'Cambio de mate' : `${Math.round(m.loss)} cp perdidos`}
                  </span>
                  <span>Mejor: {m.suggested}</span>
                  <small>
                    {evaluationLabel(m.before)} → {evaluationLabel(m.after)} · prof.{' '}
                    {m.before.depth}/{m.after.depth}
                  </small>
                </button>
              ))
            ) : (
              <p>No hay jugadas que cumplan este filtro.</p>
            )}
          </div>
        </section>
      )}
    </div>
  );
}

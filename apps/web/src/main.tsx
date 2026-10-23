import { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Chess, type Square, type PieceSymbol } from 'chess.js';
import type { Identity } from '@pixelspace/auth';
import { Board } from './Board';
import { ChessIcon, ChessPiece } from './ChessPiece';
import { beginLichessLogin, finishLichessLogin, cancelLichessLogin, loginError } from './oauth';
import { ChessBoard } from './ChessBoard';
import { API_URL, WORLD_URL, api, login, logout } from './api';
import { connectWorld, type WorldConnection } from './network';
import { es } from './copy';
import {
  openings,
  puzzles,
  position,
  loadStudies,
  loadProgress,
  downloadPgn,
  type Progress,
} from './training';
import './styles.css';
type Page =
  | 'panel'
  | 'play'
  | 'profile'
  | 'studies'
  | 'courses'
  | 'openings'
  | 'puzzles'
  | 'review'
  | 'woodpecker'
  | 'analysis'
  | 'stats';
const groups: { name: string; items: [Page, string, string][] }[] = [
  {
    name: 'PRINCIPAL',
    items: [
      ['panel', 'Panel', '▦'],
      ['play', 'Jugar', '♞'],
      ['profile', 'Mi perfil', '♙'],
    ],
  },
  {
    name: 'APRENDER',
    items: [
      ['studies', 'Mis estudios', '▤'],
      ['courses', 'Cursos', '▥'],
      ['openings', 'Entrenador de aperturas', '♘'],
    ],
  },
  {
    name: 'PRÁCTICA',
    items: [
      ['puzzles', 'Problemas', '◈'],
      ['review', 'Repaso', '↻'],
      ['woodpecker', 'Woodpecker', '♟'],
    ],
  },
  {
    name: 'ANALIZAR',
    items: [
      ['analysis', 'Tablero de análisis', '⌕'],
      ['stats', 'Estadísticas', '▥'],
    ],
  },
];
function App() {
  const [page, setPage] = useState<Page>('panel'),
    [menu, setMenu] = useState(false);
  const [studies, setStudies] = useState(loadStudies),
    [progress, setProgress] = useState(loadProgress);
  const [notice, setNotice] = useState(''),
    [game, setGame] = useState(() => new Chess());
  const [pgn, setPgn] = useState(''),
    [studyName, setStudyName] = useState('Mi nuevo estudio'),
    [studyId, setStudyId] = useState<string | null>(null);
  const [flipped, setFlipped] = useState(false),
    [cursor, setCursor] = useState<number | null>(null);
  const [openingIndex, setOpeningIndex] = useState(0),
    [step, setStep] = useState(0);
  const [puzzleIndex, setPuzzleIndex] = useState(0),
    [solved, setSolved] = useState(false),
    [hint, setHint] = useState(false);
  const [user, setUser] = useState<Identity | null>(null),
    [caps, setCaps] = useState<{ lichess: boolean; developmentAuth: boolean } | null>(null);
  const [busy, setBusy] = useState(false),
    [devName, setDevName] = useState('');
  const [connection, setConnection] = useState<WorldConnection | null>(null),
    [, render] = useState(0);
  const [games, setGames] = useState<{ id: string; pgn: string; result: string; reason: string }[]>(
    [],
  );
  const connectionRef = useRef<WorldConnection | null>(null);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    const params = new URLSearchParams(location.search);
    const callbackCode = params.get('code'),
      callbackState = params.get('state'),
      callbackError = params.get('error');
    const fragment = new URLSearchParams(location.hash.slice(1));
    const returning =
      params.has('code') ||
      params.has('error') ||
      fragment.has('autherror') ||
      fragment.has('login');
    const signingIn = params.get('signin') === 'lichess';
    if (returning || signingIn) {
      for (const name of ['code', 'state', 'error', 'error_description', 'signin'])
        params.delete(name);
      const query = params.toString();
      history.replaceState(null, '', location.pathname + (query ? `?${query}` : ''));
      setPage('play');
    }
    if (API_URL)
      void (async () => {
        try {
          void api<{ lichess: boolean; developmentAuth: boolean }>('/capabilities')
            .then((capabilities) => {
              if (mounted.current) setCaps(capabilities);
            })
            .catch(() => {
              if (mounted.current && !returning && !signingIn)
                setNotice(
                  'El servicio de cuentas no responde. Puedes volver a intentar el acceso con Lichess.',
                );
            });
          if (signingIn) {
            await beginLichessLogin();
          } else if (callbackError) {
            cancelLichessLogin();
            setNotice('Has cancelado la autorización en Lichess. Puedes volver a intentarlo.');
          } else if (callbackCode) {
            const identity = await finishLichessLogin(callbackCode, callbackState);
            if (mounted.current) {
              setUser(identity);
              setNotice('Sesión iniciada con Lichess.');
            }
          } else if (fragment.has('login')) {
            const identity = await login('/auth/exchange', { code: fragment.get('login') });
            if (mounted.current) setUser(identity);
          } else if (fragment.has('autherror')) {
            cancelLichessLogin();
            setNotice(
              'Este acceso anterior ha caducado. Pulsa Entrar con Lichess para iniciar uno nuevo.',
            );
          } else {
            try {
              const result = await api<{ user: Identity }>('/auth/me');
              if (mounted.current) setUser(result.user);
            } catch {
              /* Anonymous visitor. */
            }
          }
        } catch (error) {
          if (mounted.current) setNotice(loginError(error));
        }
      })();
    return () => {
      mounted.current = false;
      void connectionRef.current?.leave();
    };
  }, []);
  async function signInWithLichess() {
    if (busy) return;
    setBusy(true);
    setNotice('Abriendo Lichess. Si el servidor está en reposo puede tardar unos segundos.');
    try {
      await beginLichessLogin();
    } catch (error) {
      setNotice(loginError(error));
      setBusy(false);
    }
  }
  useEffect(() => {
    if (!user || !['profile', 'stats', 'panel'].includes(page)) return;
    let active = true;
    api<{ games: typeof games }>('/games')
      .then((r) => {
        if (active) setGames(r.games);
      })
      .catch(() => {
        if (active) setNotice('No se ha podido cargar el historial de partidas.');
      });
    return () => {
      active = false;
    };
  }, [user, page]);
  function navigate(next: Page) {
    setPage(next);
    setMenu(false);
    setNotice('');
    setHint(false);
    setCursor(null);
    if (['puzzles', 'woodpecker', 'review'].includes(next)) {
      setPuzzleIndex(0);
      setSolved(false);
      setGame(position(puzzles[0]!.setup));
    } else if (next === 'openings') {
      setStep(0);
      setGame(new Chess());
    } else if (next === 'analysis' || next === 'studies') {
      setGame(new Chess());
      setStudyId(null);
      setPgn('');
      setStudyName('Mi nuevo estudio');
    }
    window.scrollTo({ top: 0 });
  }
  function saveProgress(next: Progress) {
    try {
      localStorage.setItem('chessdev.progress', JSON.stringify(next));
      setProgress(next);
    } catch {
      setNotice('El navegador no permite guardar el progreso. Habilita el almacenamiento local.');
    }
  }
  function record(kind: 'solved' | 'completed', id: string) {
    saveProgress({
      ...progress,
      [kind]: [...new Set([...progress[kind], id])],
      dates: [...new Set([...progress.dates, new Date().toLocaleDateString('sv-SE')])],
    });
  }
  function playMove(from: Square, to: Square, promotion: PieceSymbol) {
    const next = new Chess(game.fen());
    const move = next.move({ from, to, promotion });
    if (!move) return;
    if (['puzzles', 'review', 'woodpecker'].includes(page)) {
      if (solved) return;
      const ok = move.san === puzzles[puzzleIndex]!.solution;
      const updated = { ...progress, attempts: progress.attempts + 1 };
      if (!ok) {
        saveProgress(updated);
        setNotice('Esa jugada es legal, pero no resuelve el ejercicio. Prueba de nuevo.');
        return;
      }
      saveProgress({
        ...updated,
        solved: [...new Set([...progress.solved, puzzles[puzzleIndex]!.id])],
        dates: [...new Set([...progress.dates, new Date().toLocaleDateString('sv-SE')])],
      });
      setGame(next);
      setSolved(true);
      setNotice('¡Correcto! Has encontrado el jaque mate.');
      return;
    }
    if (page === 'openings') {
      const expected = openings[openingIndex]!.moves[step];
      if (move.san !== expected) {
        setNotice('Jugada legal, pero esta línea continúa con ' + expected + '.');
        return;
      }
      const line = openings[openingIndex]!;
      const nextStep = step + 1;
      setStep(nextStep);
      setGame(position(line.moves.slice(0, nextStep)));
      setNotice('');
      if (nextStep === line.moves.length) {
        record('completed', line.id);
        setNotice('Línea completada. Ya puedes repasarla o elegir otra apertura.');
      }
      return;
    }
    const historyMoves = game.history();
    const full = position(historyMoves);
    full.move({ from, to, promotion });
    setGame(full);
    setPgn(full.pgn());
    setCursor(null);
    setNotice('');
  }
  function importPgn(text = pgn) {
    try {
      const next = new Chess();
      next.loadPgn(text);
      if (!next.history().length) throw new Error();
      setGame(next);
      setPgn(next.pgn());
      setCursor(null);
      setNotice('Partida importada. Recorre las jugadas o continúa en el tablero.');
      return true;
    } catch {
      setNotice('PGN no válido o sin jugadas. Revisa la notación antes de importarlo.');
      return false;
    }
  }
  function saveStudy() {
    if (!studyName.trim() || !game.history().length) {
      setNotice('Escribe un nombre y añade al menos una jugada al estudio.');
      return;
    }
    const study = {
      id: studyId ?? crypto.randomUUID(),
      name: studyName.trim().slice(0, 100),
      pgn: game.pgn(),
      updated: new Date().toISOString(),
    };
    const next = [study, ...studies.filter((s) => s.id !== study.id)];
    try {
      localStorage.setItem('chessdev.studies', JSON.stringify(next));
      setStudies(next);
      setStudyId(study.id);
      setNotice('Estudio guardado en este navegador. Puedes exportarlo como PGN.');
    } catch {
      setNotice('No se ha podido guardar. Exporta el PGN para conservarlo.');
    }
  }
  async function startOnline() {
    if (!user || busy) return;
    if (connection?.status === 'connected') {
      connection.send('chess:join');
      return;
    }
    setBusy(true);
    setNotice(
      'Conectando con la sala. El servidor gratuito puede tardar hasta 90 segundos en despertar.',
    );
    try {
      await connectionRef.current?.leave();
      const health = await fetch(`${WORLD_URL.replace(/\/$/, '')}/health`, {
        signal: AbortSignal.timeout(90000),
      });
      if (!health.ok) throw new Error();
      const auth = await api<{ ticket: string }>('/world/ticket', {});
      const next = await connectWorld(WORLD_URL, auth.ticket, () => {
        if (mounted.current) render((n) => n + 1);
      });
      if (!mounted.current) {
        await next.leave();
        return;
      }
      connectionRef.current = next;
      setConnection(next);
      next.send('chess:join');
      setNotice('');
    } catch {
      setNotice('No se ha podido abrir la sala. Comprueba tu sesión y vuelve a intentarlo.');
    } finally {
      setBusy(false);
    }
  }
  async function signOut() {
    try {
      await logout();
      await connectionRef.current?.leave();
      connectionRef.current = null;
      setConnection(null);
      setUser(null);
      setNotice('Sesión cerrada.');
    } catch {
      setNotice('No se ha podido cerrar la sesión. Vuelve a intentarlo.');
    }
  }
  const title = groups.flatMap((g) => g.items).find((i) => i[0] === page)?.[1] ?? 'Panel';
  const puzzle = puzzles[puzzleIndex]!;
  const shownGame = cursor === null ? game : position(game.history().slice(0, cursor));
  const currentOpening = openings[openingIndex]!;
  const trainingPage = ['puzzles', 'review', 'woodpecker'].includes(page);
  function nextPuzzle() {
    const i = (puzzleIndex + 1) % puzzles.length;
    setPuzzleIndex(i);
    setGame(position(puzzles[i]!.setup));
    setSolved(false);
    setHint(false);
    setNotice('');
  }
  return (
    <div className="shell">
      <aside className={`sidebar ${menu ? 'open' : ''}`}>
        <button className="brand" onClick={() => navigate('panel')}>
          <span className="brand-mark">
            <ChessPiece type="r" color="b" />
          </span>
          <span>
            Chess<span className="thin">Dev</span>
            <b>.</b>
          </span>
        </button>
        <div className="workspace">
          <span className="tiny-dot" /> TU ESPACIO DE AJEDREZ
        </div>
        <nav aria-label="Navegación principal">
          {groups.map((group) => (
            <div className="nav-group" key={group.name}>
              <div className="nav-label">{group.name}</div>
              {group.items.map(([id, label, icon]) => (
                <button
                  key={id}
                  className={`nav-item ${page === id ? 'active' : ''}`}
                  onClick={() => navigate(id)}
                  aria-current={page === id ? 'page' : undefined}
                >
                  <span className="nav-icon" aria-hidden="true">
                    <ChessIcon symbol={icon} />
                  </span>
                  {label}
                  {id === 'review' && progress.solved.length > 0 && (
                    <span className="badge">{progress.solved.length}</span>
                  )}
                </button>
              ))}
            </div>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <a href="https://lichess.org/learn" target="_blank" rel="noreferrer">
            <span>↗</span> Aprende las reglas
          </a>
          <button className="account" onClick={() => navigate('profile')}>
            <span className="avatar">
              {user ? user.name[0]?.toUpperCase() : <ChessPiece type="p" />}
            </span>
            <span>
              {user?.name ?? 'Tu próximo movimiento'}
              <small>{user ? 'Mi cuenta · Lichess' : 'Tu espacio empieza aquí'}</small>
            </span>
            <span>⋯</span>
          </button>
        </div>
      </aside>
      {menu && (
        <button className="menu-backdrop" aria-label="Cerrar menú" onClick={() => setMenu(false)} />
      )}
      <main className="main">
        <header className="topbar">
          <div className="breadcrumb">
            <button className="menu-toggle" aria-label="Abrir menú" onClick={() => setMenu(!menu)}>
              ☰
            </button>
            <span className="desktop-breadcrumb">Mi espacio</span>
            <button className="mobile-brand" onClick={() => navigate('panel')}>
              <ChessPiece type="r" />
              ChessDev.
            </button>
            <span>/</span>
            <strong>{title}</strong>
          </div>
          <div className="top-actions">
            <span className="free-label">
              <span className="tiny-dot" /> A tu ritmo. Sin límites.
            </span>
            <button
              className="profile-dot"
              aria-label="Abrir perfil"
              onClick={() => navigate('profile')}
            >
              {user ? user.name[0]?.toUpperCase() : <ChessPiece type="p" />}
            </button>
          </div>
        </header>
        <div className="content">
          <div className="page-heading">
            <div>
              <div className="eyebrow">
                {page === 'panel' ? 'UN POCO DE AJEDREZ. CADA DÍA.' : 'APRENDE · PRACTICA · JUEGA'}
              </div>
              <h1>
                {page === 'panel' ? (
                  <>
                    Tu próxima <span>buena jugada.</span>
                  </>
                ) : (
                  title
                )}
              </h1>
              <p>
                {page === 'panel'
                  ? 'Un lugar para aprender, jugar y disfrutar del camino.'
                  : 'Concéntrate en el tablero. El resto puede esperar.'}
              </p>
            </div>
            <span className="heading-symbol" aria-hidden="true">
              ✳
            </span>
          </div>
          {notice && (
            <div className="notice" role="status">
              {notice}
              <button aria-label="Cerrar aviso" onClick={() => setNotice('')}>
                ×
              </button>
            </div>
          )}
          {page === 'panel' && (
            <>
              <div className="dashboard-grid">
                <section className="hero card">
                  <div className="eyebrow">
                    <span className="tiny-dot" /> EL AJEDREZ NOS CONECTA
                  </div>
                  <h2>
                    Haz espacio
                    <br />
                    para el <span>ajedrez.</span>
                  </h2>
                  <p>
                    Una nueva idea. Una partida más.
                    <br />
                    Un pequeño paso hacia tu mejor versión.
                  </p>
                  <button className="button cream" onClick={() => navigate('puzzles')}>
                    Empezar a entrenar <span>↗</span>
                  </button>
                  <div className="hero-rook" aria-hidden="true">
                    <ChessPiece type="r" />
                  </div>
                  <span className="hero-stamp">
                    TU RITMO.
                    <br />
                    TU SIGUIENTE NIVEL.
                  </span>
                </section>
                <section className="daily card">
                  <div className="card-top">
                    <span className="eyebrow">EL RETO DE HOY</span>
                    <span className="pill">Mate en una</span>
                  </div>
                  <div className="mini-board">
                    <Board fen={position(puzzles[0]!.setup).fen()} interactive={false} />
                  </div>
                  <div className="daily-foot">
                    <div>
                      <h3>Una jugada lo cambia todo.</h3>
                      <p>Juegan negras. ¿Ves el mate?</p>
                    </div>
                    <button
                      className="round-button"
                      aria-label="Resolver el reto"
                      onClick={() => navigate('puzzles')}
                    >
                      ↗
                    </button>
                  </div>
                </section>
              </div>
              <div className="section-heading">
                <h2>
                  Encuentra tu siguiente paso<span>.</span>
                </h2>
                <span>A tu manera, cada día</span>
              </div>
              <div className="action-grid">
                {(
                  [
                    {
                      id: 'play',
                      icon: '♞',
                      title: 'Vamos a jugar',
                      text: 'Comparte tablero. Disfruta la partida.',
                      tag: 'CON OTRA PERSONA',
                    },
                    {
                      id: 'studies',
                      icon: '▤',
                      title: 'Construye tus ideas',
                      text: 'Tus líneas, tus notas, tu ajedrez.',
                      tag: 'ESTUDIOS PGN',
                    },
                    {
                      id: 'analysis',
                      icon: '⌕',
                      title: 'Vuelve a esa partida',
                      text: 'Explora cada posición con calma.',
                      tag: 'TABLERO DE ANÁLISIS',
                    },
                  ] as const
                ).map((item) => (
                  <button
                    className="action-card card"
                    key={item.id}
                    onClick={() => navigate(item.id)}
                  >
                    <div className="action-card-top">
                      <span className="feature-icon">
                        <ChessIcon symbol={item.icon} />
                      </span>
                      <span>↗</span>
                    </div>
                    <small>{item.tag}</small>
                    <h3>{item.title}</h3>
                    <p>{item.text}</p>
                  </button>
                ))}
              </div>
              <div className="section-heading">
                <h2>
                  Empieza con una buena apertura<span>.</span>
                </h2>
                <button className="text-button" onClick={() => navigate('courses')}>
                  Ver los cursos <span>↗</span>
                </button>
              </div>
              <div className="course-grid">
                {openings.slice(0, 3).map((opening, i) => (
                  <button
                    className="course-card card"
                    key={opening.id}
                    onClick={() => {
                      navigate('openings');
                      setOpeningIndex(i);
                    }}
                  >
                    <div className={`course-art art-${i}`}>
                      <span>
                        <ChessIcon symbol={['♘', '♗', '♟'][i]!} />
                      </span>
                      <div className="art-grid" />
                      <span className="course-free">GRATIS</span>
                    </div>
                    <div className="course-info">
                      <small>{opening.tag} · 8 MEDIAS JUGADAS</small>
                      <h3>
                        {opening.name} <span>↗</span>
                      </h3>
                      <p>{opening.description}</p>
                    </div>
                  </button>
                ))}
              </div>
              <section className="journey card">
                <span className="journey-icon">↗</span>
                <div>
                  <h3>El progreso empieza por volver.</h3>
                  <p>
                    {progress.dates.length
                      ? `Has entrenado ${progress.dates.length} días en este navegador. Sigue construyendo tu hábito.`
                      : 'No necesitas hacerlo todo hoy. Solo dar el siguiente paso.'}
                  </p>
                </div>
                <button className="button" onClick={() => navigate('stats')}>
                  Ver mi progreso ↗
                </button>
              </section>
            </>
          )}
          {page === 'courses' && (
            <div className="course-grid all-courses">
              {openings.map((opening, i) => (
                <article className="card course-card" key={opening.id}>
                  <div className={`course-art art-${i % 3}`}>
                    <span>
                      <ChessPiece type="n" />
                    </span>
                    <div className="art-grid" />
                  </div>
                  <div className="course-info">
                    <small>{opening.tag}</small>
                    <h2>{opening.name}</h2>
                    <p>{opening.lesson}</p>
                    <button
                      className="button"
                      onClick={() => {
                        navigate('openings');
                        setOpeningIndex(i);
                      }}
                    >
                      Aprender jugando ↗
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
          {(page === 'analysis' || page === 'studies' || page === 'openings' || trainingPage) && (
            <>
              {page === 'studies' && (
                <div className="study-list">
                  <button
                    className="button"
                    onClick={() => {
                      setStudyId(null);
                      setGame(new Chess());
                      setPgn('');
                      setStudyName('Mi nuevo estudio');
                    }}
                  >
                    + Nuevo estudio
                  </button>
                  {studies.map((study) => (
                    <button
                      className="study-chip"
                      key={study.id}
                      onClick={() => {
                        if (importPgn(study.pgn)) {
                          setStudyId(study.id);
                          setStudyName(study.name);
                        }
                      }}
                    >
                      {study.name} <span>↗</span>
                    </button>
                  ))}
                </div>
              )}
              {page === 'review' && (
                <p className="local-note">
                  Repasa la colección de {puzzles.length} problemas. Has resuelto{' '}
                  {progress.solved.length}. El repaso espaciado automático todavía no está
                  disponible.
                </p>
              )}
              {page === 'woodpecker' && (
                <p className="local-note">
                  Repite esta colección de {puzzles.length} posiciones hasta reconocer los patrones.
                  El progreso se guarda en este navegador.
                </p>
              )}
              <div className="workspace-grid">
                <section className="board-panel card">
                  <div className="board-meta">
                    <span className="tiny-dot" />
                    <strong>
                      {trainingPage
                        ? puzzle.title
                        : page === 'openings'
                          ? currentOpening.name
                          : 'Tu tablero'}
                    </strong>
                    <span>{shownGame.turn() === 'w' ? 'Blancas' : 'Negras'}</span>
                  </div>
                  <Board
                    fen={shownGame.fen()}
                    flipped={flipped || (trainingPage && position(puzzle.setup).turn() === 'b')}
                    onMove={playMove}
                    interactive={(cursor === null && !solved) || (!trainingPage && cursor === null)}
                  />
                  <div className="board-toolbar">
                    <button onClick={() => setFlipped(!flipped)} aria-label="Girar tablero">
                      ⇅ Girar
                    </button>
                    {!trainingPage && page !== 'openings' && (
                      <button
                        onClick={() => {
                          const next = position(game.history());
                          next.undo();
                          setGame(next);
                          setPgn(next.pgn());
                          setCursor(null);
                        }}
                      >
                        ↶ Deshacer
                      </button>
                    )}
                    <span>
                      {shownGame.isCheckmate()
                        ? 'Jaque mate'
                        : shownGame.isDraw()
                          ? 'Tablas'
                          : shownGame.isCheck()
                            ? 'Jaque'
                            : 'Movimientos legales'}
                    </span>
                  </div>
                </section>
                <aside className="workspace-side card">
                  {trainingPage ? (
                    <>
                      <div className="eyebrow">
                        {page === 'woodpecker'
                          ? 'RECONOCE. REPITE. RECUERDA.'
                          : 'ENTRENA TU MIRADA'}
                      </div>
                      <h2>{puzzle.theme}</h2>
                      <p>
                        Encuentra la jugada que da jaque mate. Selecciona una pieza y después su
                        destino.
                      </p>
                      <div className="training-counter">
                        {String(puzzleIndex + 1).padStart(2, '0')}
                        <span> / {String(puzzles.length).padStart(2, '0')}</span>
                      </div>
                      <button className="button" onClick={() => setHint(true)}>
                        Ver una pista
                      </button>
                      {hint && <p className="hint">{puzzle.hint}</p>}
                      {solved && (
                        <button className="button cream" onClick={nextPuzzle}>
                          {puzzleIndex === puzzles.length - 1
                            ? 'Repetir colección'
                            : 'Siguiente problema'}{' '}
                          ↗
                        </button>
                      )}
                      <small className="local-note">
                        Colección inicial original · Sin rating simulado
                      </small>
                    </>
                  ) : page === 'openings' ? (
                    <>
                      <div className="eyebrow">TU REPERTORIO EMPIEZA AQUÍ</div>
                      <h2>Aprende jugando.</h2>
                      <label>
                        Apertura
                        <select
                          value={openingIndex}
                          onChange={(e) => {
                            setOpeningIndex(Number(e.target.value));
                            setGame(new Chess());
                            setStep(0);
                            setNotice('');
                          }}
                        >
                          {openings.map((o, i) => (
                            <option key={o.id} value={i}>
                              {o.name}
                            </option>
                          ))}
                        </select>
                      </label>
                      <p>{currentOpening.lesson}</p>
                      <div className="line-progress">
                        {currentOpening.moves.map((move, i) => (
                          <span key={i} className={i < step ? 'done' : i === step ? 'next' : ''}>
                            {i % 2 === 0 ? `${i / 2 + 1}. ` : ''}
                            {move}
                          </span>
                        ))}
                      </div>
                      <p>
                        {step < currentOpening.moves.length
                          ? `Juega ${currentOpening.moves[step]} en el tablero.`
                          : '¡Has completado la línea!'}
                      </p>
                      <button
                        className="button"
                        onClick={() => {
                          setGame(new Chess());
                          setStep(0);
                          setNotice('');
                        }}
                      >
                        Repetir línea ↻
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="eyebrow">
                        {page === 'studies' ? 'TU BIBLIOTECA PERSONAL' : 'CADA POSICIÓN, UNA IDEA'}
                      </div>
                      <h2>{page === 'studies' ? 'Guarda tu ajedrez.' : 'Explora tu partida.'}</h2>
                      {page === 'studies' && (
                        <label>
                          Nombre del estudio
                          <input
                            value={studyName}
                            onChange={(e) => setStudyName(e.target.value)}
                            maxLength={100}
                          />
                        </label>
                      )}
                      <label>
                        Partida en PGN
                        <textarea
                          value={pgn}
                          onChange={(e) => setPgn(e.target.value)}
                          placeholder="1. e4 e5 2. Nf3 Nc6 3. Bc4"
                          rows={5}
                        />
                      </label>
                      <label className="file-label">
                        O abre un archivo PGN
                        <input
                          type="file"
                          accept=".pgn,text/plain"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            if (file.size > 1000000) {
                              setNotice('El archivo debe ser menor de 1 MB.');
                              return;
                            }
                            try {
                              importPgn(await file.text());
                            } catch {
                              setNotice('No se ha podido leer el archivo.');
                            }
                            e.target.value = '';
                          }}
                        />
                      </label>
                      <div className="button-row">
                        <button className="button cream" onClick={() => importPgn()}>
                          Importar PGN
                        </button>
                        <button
                          className="button"
                          disabled={!game.history().length}
                          onClick={() => downloadPgn(game.pgn())}
                        >
                          Exportar ↗
                        </button>
                      </div>
                      <div className="move-list">
                        {game.history().map((move, i) => (
                          <button
                            key={i}
                            className={cursor === i + 1 ? 'current' : ''}
                            onClick={() => setCursor(i + 1)}
                          >
                            {i % 2 === 0 ? `${i / 2 + 1}. ` : ''}
                            {move}
                          </button>
                        ))}
                      </div>
                      {game.history().length > 0 && (
                        <div className="replay">
                          <button aria-label="Primera posición" onClick={() => setCursor(0)}>
                            ⇤
                          </button>
                          <button
                            aria-label="Jugada anterior"
                            onClick={() =>
                              setCursor(Math.max(0, (cursor ?? game.history().length) - 1))
                            }
                          >
                            ←
                          </button>
                          <button
                            aria-label="Jugada siguiente"
                            onClick={() =>
                              setCursor(Math.min(game.history().length, (cursor ?? 0) + 1))
                            }
                          >
                            →
                          </button>
                          <button
                            aria-label="Continuar desde posición final"
                            onClick={() => setCursor(null)}
                          >
                            ⇥
                          </button>
                        </div>
                      )}
                      {page === 'studies' && (
                        <button className="button cream" onClick={saveStudy}>
                          Guardar estudio
                        </button>
                      )}
                      <p className="local-note">
                        Estudios y progreso guardados en este navegador. Exporta tus PGN para
                        conservar una copia. El tablero permite explorar jugadas; no incluye
                        evaluación de motor.
                      </p>
                    </>
                  )}
                </aside>
              </div>
            </>
          )}
          {(page === 'play' || page === 'profile') && (
            <section className="account-layout card">
              <div className="account-illustration">
                <span>
                  <ChessPiece type="n" />
                </span>
                <div className="eyebrow">EL AJEDREZ NOS CONECTA</div>
              </div>
              <div className="account-content">
                <div className="eyebrow">
                  {page === 'play' ? 'COMPARTE EL TABLERO' : 'TU ESPACIO PERSONAL'}
                </div>
                <h2>{user ? `Hola, ${user.name}.` : 'Una cuenta. Muchas buenas partidas.'}</h2>
                <p>
                  {page === 'play'
                    ? 'Partidas amistosas con otra persona en una mesa compartida. Sin reloj ni clasificación. Puedes jugar o mirar.'
                    : 'Accede con Lichess para jugar y consultar las partidas guardadas en tu cuenta.'}
                </p>
                {!user ? (
                  <>
                    {API_URL && caps?.lichess !== false ? (
                      <button
                        className="button cream"
                        disabled={busy}
                        onClick={() => void signInWithLichess()}
                      >
                        {busy ? 'Abriendo Lichess…' : 'Entrar con Lichess ↗'}
                      </button>
                    ) : (
                      <p className="local-note">
                        {API_URL
                          ? 'Comprobando el acceso con Lichess…'
                          : 'El acceso con Lichess necesita un servidor de cuentas configurado.'}
                      </p>
                    )}
                    <p className="local-note">
                      Solo solicitamos tu identidad. No leemos tus mensajes ni pedimos tu correo.
                    </p>
                    {import.meta.env.DEV &&
                      ['localhost', '127.0.0.1'].includes(location.hostname) &&
                      caps?.developmentAuth && (
                        <form
                          className="development-login"
                          onSubmit={async (e) => {
                            e.preventDefault();
                            setBusy(true);
                            try {
                              setUser(await login('/auth/dev', { name: devName }));
                              setNotice('Identidad local de pruebas iniciada.');
                            } catch {
                              setNotice('No se ha podido iniciar la prueba local.');
                            } finally {
                              setBusy(false);
                            }
                          }}
                        >
                          <label>
                            Nombre para la prueba
                            <input
                              value={devName}
                              onChange={(e) => setDevName(e.target.value)}
                              required
                              minLength={1}
                              maxLength={32}
                            />
                          </label>
                          <button className="button" disabled={busy}>
                            Entrar en prueba local
                          </button>
                          <small>Solo desarrollo · No existe en producción</small>
                        </form>
                      )}
                  </>
                ) : (
                  <>
                    <div className="status-line">
                      <span className="tiny-dot" />
                      {user.development ? 'Identidad local de pruebas' : 'Conectado con Lichess'}
                    </div>
                    {page === 'play' && (
                      <button
                        className="button cream"
                        disabled={busy || !WORLD_URL}
                        onClick={() => void startOnline()}
                      >
                        {busy ? 'Conectando…' : 'Abrir mesa compartida'} ↗
                      </button>
                    )}
                    <button className="button" onClick={() => void signOut()}>
                      Cerrar sesión
                    </button>
                  </>
                )}
              </div>
            </section>
          )}
          {(page === 'profile' || page === 'stats') && (
            <>
              <div className="section-heading">
                <h2>
                  Tu camino, en números<span>.</span>
                </h2>
                <span>Datos reales de tu actividad</span>
              </div>
              <div className="stats-grid">
                {[
                  [progress.solved.length, 'Problemas resueltos'],
                  [progress.completed.length, 'Aperturas completadas'],
                  [studies.length, 'Estudios guardados'],
                  [progress.dates.length, 'Días de práctica'],
                ].map(([value, label]) => (
                  <div className="stat card" key={label}>
                    <strong>{value}</strong>
                    <span>{label}</span>
                  </div>
                ))}
              </div>
              <p className="local-note">
                Práctica y estudios: este navegador. Partidas de ChessDev vinculadas a tu cuenta
                Lichess. Sin estimaciones de Elo.
              </p>
              <section className="card history-panel">
                <h2>Mis partidas</h2>
                {!user ? (
                  <p>Inicia sesión desde Mi perfil para consultar tu historial.</p>
                ) : games.length === 0 ? (
                  <p>
                    Todavía no hay partidas guardadas en tu cuenta. Tu siguiente partida puede ser
                    la primera.
                  </p>
                ) : (
                  games.map((g) => (
                    <div className="history-row" key={g.id}>
                      <span>
                        Resultado: {g.result} · {g.reason}
                      </span>
                      <button
                        className="button"
                        onClick={() => {
                          navigate('analysis');
                          importPgn(g.pgn);
                        }}
                      >
                        Revisar ↗
                      </button>
                      <button className="text-button" onClick={() => downloadPgn(g.pgn)}>
                        PGN ↓
                      </button>
                    </div>
                  ))
                )}
              </section>
            </>
          )}
          <footer>
            <span className="footer-brand">
              <ChessPiece type="r" /> ChessDev.
            </span>
            <span>El ajedrez, a tu manera.</span>
            <a href="https://lichess.org/" target="_blank" rel="noreferrer">
              Más ajedrez en Lichess ↗
            </a>
          </footer>
        </div>
      </main>
      {connection?.activity && connection.board && (
        <ChessBoard
          state={connection.board}
          connection={connection}
          t={es}
          onClose={() => connection.closeActivity()}
        />
      )}
    </div>
  );
}
createRoot(document.getElementById('root')!).render(<App />);

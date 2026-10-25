import { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Editor, type EditorMode } from './Editor';
import { Trainer, type TrainerMode } from './Trainer';
import { useLibrary } from './library';
import type { Identity } from '@pixelspace/auth';
import { ChessIcon, ChessPiece } from './ChessPiece';
import { beginLichessLogin, finishLichessLogin, cancelLichessLogin, loginError } from './oauth';
import { ChessBoard } from './ChessBoard';
import { API_URL, WORLD_URL, api, login, logout } from './api';
import { connectWorld, type WorldConnection } from './network';
import { es } from './copy';
import { downloadPgn } from './training';
import './styles.css';
type Page =
  | 'panel'
  | 'play'
  | 'profile'
  | 'studies'
  | 'learn'
  | 'endgames'
  | 'weakness'
  | 'summary'
  | 'mistakes'
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
      ['learn', 'Aprender mis estudios', '▥'],
      ['endgames', 'Finales', '♟'],
      ['openings', 'Entrenador de aperturas', '♘'],
    ],
  },
  {
    name: 'PRÁCTICA',
    items: [
      ['puzzles', 'Problemas', '◈'],
      ['weakness', 'Practicar mis errores', '⌕'],
      ['review', 'Repaso', '↻'],
      ['woodpecker', 'Woodpecker', '♟'],
    ],
  },
  {
    name: 'ANALIZAR',
    items: [
      ['analysis', 'Tablero de análisis', '⌕'],
      ['summary', 'Resumen de partida', '▤'],
      ['mistakes', 'Revisión de errores', '↻'],
      ['stats', 'Estadísticas', '▥'],
    ],
  },
];
function App() {
  const [page, setPage] = useState<Page>('panel'),
    [menu, setMenu] = useState(false);
  const { data: library } = useLibrary();
  const [notice, setNotice] = useState('');
  const [analysisPgn, setAnalysisPgn] = useState('');
  const due = Object.values(library.cards).filter((c) => c.due <= Date.now()).length;
  const practiceDays = new Set(library.practices.map((p) => p.at.slice(0, 10))).size;
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
    setAnalysisPgn('');
    window.scrollTo({ top: 0 });
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
                  {id === 'review' && due > 0 && <span className="badge">{due}</span>}
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
              <span className="tiny-dot" /> Gratis. A tu ritmo.
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
                <section className="daily card real-daily">
                  <span className="eyebrow">TU ENTRENAMIENTO · GRATIS</span>
                  <div className="daily-piece">
                    <ChessPiece type="n" />
                  </div>
                  <h2>
                    Posiciones reales.
                    <br />
                    Tu siguiente reto.
                  </h2>
                  <p>Problema diario de Lichess, colecciones CSV y ejercicios de tus partidas.</p>
                  <button className="button cream" onClick={() => navigate('puzzles')}>
                    Elegir problema ↗
                  </button>
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
              <section className="journey card">
                <span className="journey-icon">↗</span>
                <div>
                  <h3>Tu biblioteca marca el camino.</h3>
                  <p>
                    {library.studies.length} estudios · {due} repasos pendientes · {practiceDays}{' '}
                    días de práctica.
                  </p>
                </div>
                <button className="button" onClick={() => navigate('learn')}>
                  Aprender mis estudios ↗
                </button>
              </section>
              <section className="card scope-note">
                <h3>Qué puedes hacer aquí</h3>
                <p>
                  Editar variantes PGN, entrenar tu repertorio, programar repasos SM2, resolver
                  problemas y repetir ciclos Woodpecker. Analizar partidas con Stockfish, revisar
                  errores y jugar en una mesa compartida con Lichess.
                </p>
                <p>
                  Todo es gratuito. No hay catálogo de cursos ni entrenador conversacional. Los
                  estudios y el entrenamiento se guardan en este navegador: exporta tus PGN para
                  conservarlos o llevarlos a otro dispositivo.
                </p>
              </section>
            </>
          )}
          {(['studies', 'analysis', 'summary', 'mistakes'] as string[]).includes(page) && (
            <Editor key={page} mode={page as EditorMode} initialPgn={analysisPgn} />
          )}
          {(
            [
              'learn',
              'openings',
              'review',
              'woodpecker',
              'puzzles',
              'weakness',
              'endgames',
            ] as string[]
          ).includes(page) && <Trainer key={page} mode={page as TrainerMode} />}
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
                  [library.practices.length, 'Sesiones completadas'],
                  [library.reviews.length, 'Partidas analizadas'],
                  [library.studies.length, 'Estudios guardados'],
                  [practiceDays, 'Días de práctica'],
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
                          setAnalysisPgn(g.pgn);
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

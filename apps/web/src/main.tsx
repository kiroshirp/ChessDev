import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { academyZones, academyObjects } from '@pixelspace/map-engine';
import type { Identity } from '@pixelspace/auth';
import type { Position } from '@pixelspace/world-engine';
import type { SceneControls } from './scene';
import { World } from './World';
import { ChessBoard } from './ChessBoard';
import { WorldConnection, connectWorld } from './network';
import { API_URL, WORLD_URL, api, login, logout, clearToken } from './api';
import { es, en, errors } from './copy';
import './styles.css';
interface Capabilities {
  discord: boolean;
  developmentAuth: boolean;
}
function App() {
  const [locale, setLocale] = useState<'es' | 'en'>('es'),
    t = locale === 'es' ? es : en;
  const [tab, setTab] = useState<'world' | 'guide' | 'account'>('world'),
    [user, setUser] = useState<Identity | null>(null),
    [capabilities, setCapabilities] = useState<Capabilities | null>(null),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    [name, setName] = useState(''),
    [connection, setConnection] = useState<WorldConnection | null>(null),
    [, render] = useState(0),
    [position, setPosition] = useState<Position>({ x: 0, y: 0 }),
    [zoom, setZoom] = useState(1),
    [color, setColor] = useState(0x9f88e5),
    [history, setHistory] = useState<{ id: string; result: string; reason: string; pgn: string }[]>(
      [],
    );
  const worldButton = useRef<HTMLButtonElement>(null),
    connectionRef = useRef<WorldConnection | null>(null),
    mounted = useRef(true);
  const controls = useRef<SceneControls>({
    zoom: 1,
    input: { x: 0, y: 0 },
    connection: null,
    locale: 'es',
  }).current;
  controls.zoom = zoom;
  controls.connection = connection;
  controls.locale = locale;
  const refresh = useCallback(() => {
      if (mounted.current) render((n) => n + 1);
    }, []),
    onPosition = useCallback((p: Position) => setPosition(p), []),
    onEscape = useCallback(() => worldButton.current?.focus(), []);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      void connectionRef.current?.leave();
    };
  }, []);
  useEffect(() => {
    let stopped = false;
    async function initialize() {
      if (!API_URL) return;
      try {
        const caps = await api<Capabilities>('/capabilities');
        if (stopped) return;
        setCapabilities(caps);
        const fragment = new URLSearchParams(location.hash.slice(1)),
          code = fragment.get('login');
        if (code) {
          historyReplace();
          const identity = await login('/auth/exchange', { code });
          if (!stopped) setUser(identity);
        } else if (fragment.has('autherror')) {
          historyReplace();
          setError(t.authDenied);
        } else {
          try {
            const state = await api<{ user: Identity }>('/auth/me');
            if (!stopped) setUser(state.user);
          } catch {
            /* no active session */
          }
        }
      } catch {
        if (!stopped) setError(t.error);
      }
    }
    void initialize();
    return () => {
      stopped = true;
    };
  }, []);
  function historyReplace() {
    window.history.replaceState(null, '', location.pathname + location.search);
  }
  async function connect() {
    if (!user || busy) return;
    setBusy(true);
    setError('');
    try {
      await connectionRef.current?.leave();
      const auth = await api<{ ticket: string }>('/world/ticket', {});
      const next = await connectWorld(WORLD_URL, auth.ticket, refresh);
      connectionRef.current = next;
      setConnection(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : t.error);
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    if (user) void connect();
  }, [user]);
  useEffect(() => {
    if (tab === 'account' && user)
      api<{ games: typeof history }>('/games')
        .then((r) => setHistory(r.games))
        .catch(() => setError(t.error));
  }, [tab, user]);
  const connected = connection?.status === 'connected',
    self = connection?.self,
    near =
      !!self &&
      Math.hypot(self.x - academyObjects[0]!.x, self.y - academyObjects[0]!.y) <=
        academyObjects[0]!.radius;
  const status = connection
    ? connection.status === 'connected'
      ? t.connected
      : connection.status === 'reconnecting'
        ? t.reconnecting
        : t.offline
    : busy
      ? t.connecting
      : t.offline;
  async function devLogin(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      setUser(await login('/auth/dev', { name }));
    } catch {
      setError(t.error);
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
      clearToken();
      setTab('world');
    } catch {
      setError(t.error);
    }
  }
  const friendlyError = (value: string) => errors[value]?.[locale] ?? t.error;
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href={import.meta.env.BASE_URL}>
          <span className="brand-mark">▦</span>
          <span>
            pixel<span className="brand-light">space</span>
            <small>VIRTUAL WORLDS, REAL CONNECTIONS</small>
          </span>
        </a>
        <div className="workspace-label">PIXELSPACE CHESS ACADEMY</div>
        <nav aria-label={t.academy}>
          {(['world', 'guide', 'account'] as const).map((item, i) => (
            <button
              key={item}
              ref={item === 'world' ? worldButton : undefined}
              className={`nav-item ${tab === item ? 'selected' : ''}`}
              aria-current={tab === item ? 'page' : undefined}
              onClick={() => setTab(item)}
            >
              <span aria-hidden="true">{['▦', '☷', '♙'][i]}</span>
              {t[item]}
            </button>
          ))}
        </nav>
        <div className="sidebar-note">
          <span className="tiny-label">{t.phase}</span>
          <p>{t.subtitle}</p>
          <small>{t.guideFoot}</small>
        </div>
        <div className="local-user">
          <span className="user-icon">{user?.name.slice(0, 1) || 'P'}</span>
          <div>
            {user?.name || 'PixelSpace'}
            <small>{user?.development ? t.devBadge : 'Discord'}</small>
          </div>
        </div>
      </aside>
      <main>
        <header className="topbar">
          <span>
            PixelSpace <span className="slash">/</span> {t.academy}
          </span>
          <div>
            {user && (
              <button className="subtle" onClick={() => void signOut()}>
                {t.logout}
              </button>
            )}
            <select
              aria-label="Idioma / Language"
              value={locale}
              onChange={(e) => {
                setLocale(e.target.value as 'es' | 'en');
                document.documentElement.lang = e.target.value;
              }}
            >
              <option value="es">ES</option>
              <option value="en">EN</option>
            </select>
          </div>
        </header>
        <div className="page-content">
          <div className="page-intro">
            <div>
              <div className="eyebrow">
                <span /> {t.phase}
              </div>
              <h1>{t.title}</h1>
              <p>{t.subtitle}</p>
            </div>
            {user && (
              <div className={`session-badge ${connected ? 'is-connected' : ''}`} role="status">
                <span />
                {status}
              </div>
            )}
          </div>
          {error && (
            <p className="error-message" role="alert">
              {friendlyError(error)}
            </p>
          )}
          {!user ? (
            <section className="login-card">
              <div className="academy-emblem" aria-hidden="true">
                ♜
              </div>
              <div className="eyebrow">PIXELSPACE CHESS ACADEMY</div>
              <h2>{t.loginTitle}</h2>
              <p>{t.loginText}</p>
              {capabilities?.discord ? (
                <a className="primary discord-login" href={`${API_URL}/auth/discord`}>
                  {t.login} ↗
                </a>
              ) : (
                <p className="notice">{t.unconfigured}</p>
              )}
              <small>{t.privacy}</small>
              {capabilities?.developmentAuth && (
                <form className="development-login" onSubmit={(e) => void devLogin(e)}>
                  <h3>{t.dev}</h3>
                  <p>{t.devInfo}</p>
                  <label>
                    {t.name}
                    <input
                      required
                      minLength={2}
                      maxLength={24}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      autoComplete="off"
                    />
                  </label>
                  <button className="primary" disabled={busy || name.trim().length < 2}>
                    {busy ? t.connecting : t.enter}
                  </button>
                </form>
              )}
            </section>
          ) : tab === 'guide' ? (
            <section className="documentation-panel">
              <div className="eyebrow">{t.academy}</div>
              <h2>{t.howTitle}</h2>
              <p>{t.howText}</p>
              <p>{t.howPrivacy}</p>
              <button onClick={() => setTab('world')}>{t.back}</button>
            </section>
          ) : tab === 'account' ? (
            <section className="documentation-panel">
              <h2>{t.accountTitle}</h2>
              <p>
                {user.name} · {user.development ? t.devBadge : 'Discord'}
              </p>
              <p>{t.accountText}</p>
              <h3>{t.recent}</h3>
              {history.length ? (
                history.map((game) => (
                  <details key={game.id}>
                    <summary>
                      {t.result}: {game.result} · {game.reason}
                    </summary>
                    <pre>{game.pgn}</pre>
                  </details>
                ))
              ) : (
                <p>{t.noGames}</p>
              )}
            </section>
          ) : (
            <div className="workspace-grid">
              <section className="room-panel">
                <div className="room-heading">
                  <div>
                    <span className="room-icon">♜</span>
                    <div>
                      <h2>{t.academy}</h2>
                      <p>{t.server} · Colyseus</p>
                    </div>
                  </div>
                  <span className="version-chip">v0.1.0</span>
                </div>
                <div className="canvas-wrap">
                  <World
                    controls={controls}
                    label={t.canvas}
                    loading={t.loading}
                    failed={t.failed}
                    onPosition={onPosition}
                    onEscape={onEscape}
                  />
                  <span className="map-caption">{t.focus}</span>
                  {!connected && (
                    <div className="connection-overlay">
                      <p>{status}</p>
                      {!busy && connection?.status !== 'reconnecting' && (
                        <button className="primary" onClick={() => void connect()}>
                          {t.retry}
                        </button>
                      )}
                    </div>
                  )}
                </div>
                <div className="world-toolbar">
                  <div className="room-portals" aria-label={t.menu}>
                    {academyZones.map((zone) => (
                      <button
                        key={zone.id}
                        disabled={!connected}
                        onClick={() => connection?.send('world:portal', zone.id)}
                      >
                        {zone.label[locale]}
                      </button>
                    ))}
                  </div>
                  <select
                    aria-label={t.zoom}
                    value={zoom}
                    onChange={(e) => setZoom(Number(e.target.value))}
                  >
                    <option value="1">100%</option>
                    <option value="1.25">125%</option>
                    <option value="1.5">150%</option>
                  </select>
                </div>
                <div className="keyboard-hint">{t.controls}</div>
              </section>
              <aside className="inspector">
                <section className="info-card">
                  <h2>
                    {t.people}{' '}
                    <span className="people-count" data-testid="player-count">
                      {connection?.players.filter((p) => p.online).length ?? 0}
                    </span>
                  </h2>
                  <ul className="players-list">
                    {connection?.players.map((p) => (
                      <li
                        key={p.id}
                        data-testid={`player-${p.name}`}
                        data-x={Math.round(p.x)}
                        data-y={Math.round(p.y)}
                      >
                        <span style={{ background: `#${p.color.toString(16)}` }} />
                        <div>
                          {p.name}
                          <small>
                            {p.development ? t.devBadge : 'Discord'}
                            {p.online ? '' : ` · ${t.reconnecting}`}
                          </small>
                        </div>
                      </li>
                    ))}
                  </ul>
                  <div className="position">
                    <span>{t.position}</span>
                    <output data-testid="position">
                      {Math.round(position.x)}, {Math.round(position.y)}
                    </output>
                  </div>
                </section>
                <section className="info-card">
                  <h2>{t.table}</h2>
                  <p>{t.friendly}</p>
                  <div className="table-icon" aria-hidden="true">
                    ♟ ♞ ♜
                  </div>
                  {near ? (
                    <button
                      className="primary"
                      disabled={!connected}
                      onClick={() => connection?.send('world:interact', 'table-1')}
                    >
                      {t.interact} <kbd>E</kbd>
                    </button>
                  ) : (
                    <p>{t.near}</p>
                  )}
                </section>
                <section className="info-card">
                  <h2>{t.color}</h2>
                  <div className="swatches">
                    {(
                      [
                        [0x9f88e5, t.purple],
                        [0x65ba9c, t.mint],
                        [0xd3ac62, t.gold],
                      ] as const
                    ).map(([value, label]) => (
                      <button
                        key={value}
                        aria-label={label}
                        aria-pressed={color === value}
                        style={{ background: `#${value.toString(16)}` }}
                        onClick={() => {
                          setColor(value);
                          connection?.send('world:appearance', value);
                        }}
                      >
                        {color === value ? '✓' : ''}
                      </button>
                    ))}
                  </div>
                </section>
                {connection?.error && (
                  <p role="alert" className="error-message">
                    {friendlyError(connection.error)}
                  </p>
                )}
              </aside>
              <div className="touch-controls" aria-label={t.movement}>
                {(
                  [
                    [0, -1, t.up, '↑'],
                    [-1, 0, t.left, '←'],
                    [0, 1, t.down, '↓'],
                    [1, 0, t.right, '→'],
                  ] as const
                ).map(([x, y, label, arrow]) => (
                  <button
                    key={label}
                    aria-label={label}
                    disabled={!connected}
                    onPointerDown={(e) => {
                      e.currentTarget.setPointerCapture(e.pointerId);
                      controls.input = { x, y };
                    }}
                    onPointerUp={() => {
                      controls.input = { x: 0, y: 0 };
                    }}
                    onLostPointerCapture={() => {
                      controls.input = { x: 0, y: 0 };
                    }}
                    onPointerCancel={() => {
                      controls.input = { x: 0, y: 0 };
                    }}
                    onKeyDown={(e) => {
                      if (e.key === ' ' || e.key === 'Enter') {
                        e.preventDefault();
                        controls.input = { x, y };
                      }
                    }}
                    onKeyUp={() => {
                      controls.input = { x: 0, y: 0 };
                    }}
                    onBlur={() => {
                      controls.input = { x: 0, y: 0 };
                    }}
                  >
                    {arrow}
                  </button>
                ))}
              </div>
            </div>
          )}
          <footer>
            <span>{t.noFake}</span>
            <span>{t.footer}</span>
          </footer>
        </div>
      </main>
      {connection?.activity === 'chess' && connection.board && (
        <ChessBoard
          state={connection.board}
          connection={connection}
          t={t}
          onClose={() => connection.closeActivity()}
        />
      )}
    </div>
  );
}
createRoot(document.getElementById('root')!).render(<App />);

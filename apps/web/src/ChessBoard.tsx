import { useEffect, useRef, useState } from 'react';
import { Chess, type Square, type PieceSymbol } from 'chess.js';
import type { BoardSnapshot } from '@pixelspace/chess-core';
import type { WorldConnection } from './network';
import type { Copy } from './copy';
const symbols: Record<string, string> = {
  wk: '♔',
  wq: '♕',
  wr: '♖',
  wb: '♗',
  wn: '♘',
  wp: '♙',
  bk: '♚',
  bq: '♛',
  br: '♜',
  bb: '♝',
  bn: '♞',
  bp: '♟',
};
export function ChessBoard({
  state,
  connection,
  t,
  onClose,
}: {
  state: BoardSnapshot;
  connection: WorldConnection;
  t: Copy;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null),
    [selected, setSelected] = useState<Square | null>(null),
    [promotion, setPromotion] = useState<PieceSymbol>('q'),
    [confirm, setConfirm] = useState(false);
  const chess = new Chess(state.fen),
    mine =
      state.white?.sessionId === connection.id
        ? 'w'
        : state.black?.sessionId === connection.id
          ? 'b'
          : null;
  const canMove =
    state.status === 'active' && mine === chess.turn() && connection.status === 'connected';
  const legal =
    selected && canMove ? chess.moves({ square: selected, verbose: true }).map((m) => m.to) : [];
  useEffect(() => {
    dialog.current?.showModal();
    return () => dialog.current?.close();
  }, []);
  useEffect(() => {
    setSelected(null);
  }, [state.revision]);
  const ranks = mine === 'b' ? [1, 2, 3, 4, 5, 6, 7, 8] : [8, 7, 6, 5, 4, 3, 2, 1],
    files = mine === 'b' ? 'hgfedcba' : 'abcdefgh';
  function play(square: Square) {
    if (!canMove) return;
    if (selected && legal.includes(square)) {
      connection.send('chess:move', {
        from: selected,
        to: square,
        promotion,
        revision: state.revision,
      });
      setSelected(null);
    } else if (chess.get(square)?.color === mine) setSelected(square);
    else setSelected(null);
  }
  function download() {
    const url = URL.createObjectURL(new Blob([state.pgn], { type: 'application/x-chess-pgn' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `pixelspace-${state.id}.pgn`;
    link.click();
    URL.revokeObjectURL(url);
  }
  const status =
    state.status === 'waiting'
      ? t.waiting
      : state.status === 'finished'
        ? `${t.finished} · ${state.result}`
        : chess.turn() === 'w'
          ? t.turnWhite
          : t.turnBlack;
  return (
    <dialog
      ref={dialog}
      className="chess-dialog"
      onCancel={(event) => {
        event.preventDefault();
        if (state.status === 'active' && mine) setConfirm(true);
        else onClose();
      }}
      aria-labelledby="chess-title"
    >
      <div className="chess-heading">
        <div>
          <div className="eyebrow">{t.friendly}</div>
          <h2 id="chess-title">{t.table}</h2>
        </div>
        <button
          aria-label={t.close}
          onClick={() => {
            if (state.status === 'active' && mine) setConfirm(true);
            else onClose();
          }}
        >
          ×
        </button>
      </div>
      <div className="chess-content">
        <div>
          <div className="seat-line">
            <span>{mine === 'b' ? t.white : t.black}</span>
            <strong>{(mine === 'b' ? state.white : state.black)?.name ?? t.available}</strong>
          </div>
          <div className="chess-board" role="group" aria-label={t.board} data-testid="chess-board">
            {ranks.flatMap((rank) =>
              [...files].map((file) => {
                const square = `${file}${rank}` as Square,
                  piece = chess.get(square),
                  isLegal = legal.includes(square),
                  dark = (file.charCodeAt(0) - 97 + rank) % 2 === 1;
                return (
                  <button
                    key={square}
                    data-square={square}
                    className={`${dark ? 'dark-square' : 'light-square'} ${selected === square ? 'square-selected' : ''} ${isLegal ? 'square-legal' : ''} ${piece?.color === 'w' ? 'white-piece' : 'black-piece'}`}
                    aria-label={`${square}${piece ? ` ${piece.color}${piece.type}` : ''}${selected === square ? ` ${t.selected}` : ''}${isLegal ? ` ${t.legal}` : ''}`}
                    onClick={() => play(square)}
                  >
                    <span aria-hidden="true">{piece ? symbols[piece.color + piece.type] : ''}</span>
                    <small aria-hidden="true">{square}</small>
                  </button>
                );
              }),
            )}
          </div>
          <div className="seat-line">
            <span>{mine === 'b' ? t.black : t.white}</span>
            <strong>{(mine === 'b' ? state.black : state.white)?.name ?? t.available}</strong>
          </div>
        </div>
        <aside className="chess-side">
          <p className="game-status" role="status" data-testid="game-status">
            {status}
            {chess.isCheck() && state.status === 'active' ? ` · ${t.check}` : ''}
          </p>
          {!mine && <p>{t.spectator}</p>}
          {state.status === 'waiting' && (
            <div className="stack-actions">
              {!state.white && !mine && (
                <button className="primary" onClick={() => connection.send('chess:sit', 'white')}>
                  {t.sitWhite}
                </button>
              )}
              {!state.black && !mine && (
                <button className="primary" onClick={() => connection.send('chess:sit', 'black')}>
                  {t.sitBlack}
                </button>
              )}
            </div>
          )}
          <label>
            {t.promotion}
            <select value={promotion} onChange={(e) => setPromotion(e.target.value as PieceSymbol)}>
              <option value="q">{t.queen}</option>
              <option value="r">{t.rook}</option>
              <option value="b">{t.bishop}</option>
              <option value="n">{t.knight}</option>
            </select>
          </label>
          <h3>{t.history}</h3>
          <div className="move-history" data-testid="move-history">
            {state.pgn.replace(/\[[^\]]*\]\s*/g, '').trim() || t.movesEmpty}
          </div>
          {mine && state.status === 'active' && (
            <div className="stack-actions">
              <button onClick={() => connection.send('chess:draw')}>
                {t.draw}
                {state.drawOffer ? ' •' : ''}
              </button>
              {state.claimable && (
                <button onClick={() => connection.send('chess:claim')}>{t.claim}</button>
              )}
              <button onClick={() => setConfirm(true)}>{t.resign}</button>
            </div>
          )}
          {state.status === 'finished' && (
            <>
              <p>{state.saved ? t.saved : t.saving}</p>
              <button disabled={!state.saved} onClick={() => connection.send('chess:new')}>
                {t.newGame}
              </button>
            </>
          )}
          <button onClick={download}>{t.download}</button>
          <button
            onClick={() => {
              if (state.status === 'active' && mine) setConfirm(true);
              else onClose();
            }}
          >
            {t.leave}
          </button>
          {connection.error && (
            <p className="error-message" role="alert">
              {t.error}: {connection.error}
            </p>
          )}
          {confirm && (
            <div className="confirm-resign" role="alert">
              <p>{t.resignConfirm}</p>
              <button onClick={() => setConfirm(false)}>{t.cancel}</button>
              <button onClick={onClose}>{t.confirm}</button>
            </div>
          )}
        </aside>
      </div>
    </dialog>
  );
}

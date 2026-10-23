import type { PieceSymbol } from 'chess.js';

// Original vector silhouettes: no system font or emoji rendering is involved.
export function ChessPiece({ type, color = 'w' }: { type: PieceSymbol; color?: 'w' | 'b' }) {
  return (
    <svg
      className={`chess-piece piece-${color}`}
      data-piece={`${color}${type}`}
      viewBox="0 0 64 64"
      aria-hidden="true"
      focusable="false"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
        {type === 'p' && (
          <>
            <circle cx="32" cy="17" r="8" />
            <path d="M27 25c2 8 0 15-5 21h20c-5-6-7-13-5-21Z" />
            <path d="M25 29h14" fill="none" />
          </>
        )}
        {type === 'r' && (
          <>
            <path d="M17 10h7v8h5v-8h6v8h5v-8h7v15l-5 5 2 16H20l2-16-5-5Z" />
            <path d="M20 25h24M23 31h18M20 46h24" fill="none" />
          </>
        )}
        {type === 'n' && (
          <>
            <path d="M20 46c3-5 5-9 7-15l-8 5-7-6 8-13 5-1 2-8 7 7c14 4 18 19 12 31Z" />
            <path d="M33 20c9 6 12 16 8 22M18 29l6-3" fill="none" />
            <circle cx="28" cy="22" r="1.5" className="piece-eye" />
          </>
        )}
        {type === 'b' && (
          <>
            <path d="M27 35c0 5-2 9-6 11h22c-4-2-6-6-6-11Z" />
            <path d="M32 10c-2 5-12 12-12 19 0 6 5 9 12 9s12-3 12-9c0-7-10-14-12-19Z" />
            <path d="m35 19-7 10" fill="none" />
            <circle cx="32" cy="7" r="2.5" />
          </>
        )}
        {type === 'q' && (
          <>
            <path d="m17 20 7 9 1-13 7 11 7-11 1 13 7-9-5 22H22Z" />
            <circle cx="16" cy="17" r="3" />
            <circle cx="24" cy="12" r="3" />
            <circle cx="32" cy="8" r="3" />
            <circle cx="40" cy="12" r="3" />
            <circle cx="48" cy="17" r="3" />
            <path d="m25 42-3 5h20l-3-5ZM22 36h20" />
          </>
        )}
        {type === 'k' && (
          <>
            <path d="M32 7v13m-6-8h12" fill="none" />
            <path d="M23 22c-8-7-14 2-8 10l9 7-3 7h22l-3-7 9-7c6-8 0-17-8-10-1-7-17-7-18 0Z" />
            <path d="M24 39h16M32 22v12" fill="none" />
          </>
        )}
        <path d="M20 46h24l3 6H17ZM16 52h32l3 6H13Z" />
      </g>
    </svg>
  );
}

const iconTypes: Record<string, PieceSymbol> = {
  '♜': 'r',
  '♞': 'n',
  '♘': 'n',
  '♙': 'p',
  '♟': 'p',
  '♗': 'b',
};
export function ChessIcon({ symbol }: { symbol: string }) {
  const type = iconTypes[symbol];
  return type ? <ChessPiece type={type} /> : <>{symbol}</>;
}

import { useState } from 'react';
import { Chess, type Square, type PieceSymbol } from 'chess.js';
import { ChessPiece } from './ChessPiece';
const names: Record<string, string> = {
  k: 'rey',
  q: 'dama',
  r: 'torre',
  b: 'alfil',
  n: 'caballo',
  p: 'peón',
};
export function Board({
  fen,
  onMove,
  flipped = false,
  interactive = true,
}: {
  fen: string;
  onMove?: (from: Square, to: Square, promotion: PieceSymbol) => void;
  flipped?: boolean;
  interactive?: boolean;
}) {
  const [selection, setSelection] = useState<{ square: Square; fen: string } | null>(null);
  const [promotion, setPromotion] = useState<PieceSymbol>('q');
  const chess = new Chess(fen),
    selected = selection?.fen === fen ? selection.square : null;
  const legal = selected ? chess.moves({ square: selected, verbose: true }).map((m) => m.to) : [];
  const files = flipped ? 'hgfedcba' : 'abcdefgh',
    ranks = flipped ? [1, 2, 3, 4, 5, 6, 7, 8] : [8, 7, 6, 5, 4, 3, 2, 1];
  return (
    <div className="board-wrap">
      <div className="board" role="group" aria-label="Tablero de ajedrez">
        {ranks.flatMap((rank, row) =>
          [...files].map((file, col) => {
            const square = `${file}${rank}` as Square,
              piece = chess.get(square);
            return (
              <button
                key={square}
                data-square={square}
                aria-label={`${square}${piece ? ` ${names[piece.type]} ${piece.color === 'w' ? 'blanco' : 'negro'}` : ''}`}
                aria-pressed={selected === square}
                disabled={!interactive}
                className={`square ${(file.charCodeAt(0) - 97 + rank) % 2 === 1 ? 'light' : 'dark'} ${piece?.color === 'w' ? 'white' : 'black'} ${selected === square ? 'selected' : ''} ${legal.includes(square) ? 'legal' : ''}`}
                onClick={() => {
                  if (selected && legal.includes(square)) {
                    onMove?.(selected, square, promotion);
                    setSelection(null);
                  } else setSelection(piece?.color === chess.turn() ? { square, fen } : null);
                }}
              >
                {piece && <ChessPiece type={piece.type} color={piece.color} />}
                {col === 0 && <small className="rank">{rank}</small>}
                {row === 7 && <small className="file">{file}</small>}
              </button>
            );
          }),
        )}
      </div>
      {interactive && (
        <label className="promotion">
          Coronación{' '}
          <select
            aria-label="Pieza de coronación"
            value={promotion}
            onChange={(e) => setPromotion(e.target.value as PieceSymbol)}
          >
            <option value="q">Dama</option>
            <option value="r">Torre</option>
            <option value="b">Alfil</option>
            <option value="n">Caballo</option>
          </select>
        </label>
      )}
    </div>
  );
}

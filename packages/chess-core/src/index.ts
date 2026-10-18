import { Chess, type Square, type PieceSymbol } from 'chess.js';
export interface Seat {
  sessionId: string;
  userId: string;
  name: string;
}
export interface BoardSnapshot {
  id: string;
  fen: string;
  pgn: string;
  revision: number;
  status: 'waiting' | 'active' | 'finished';
  white: Seat | null;
  black: Seat | null;
  result: string;
  reason: string;
  drawOffer: string | null;
  claimable: boolean;
  saved: boolean;
}
export class ChessTable {
  readonly id = crypto.randomUUID();
  readonly chess = new Chess();
  white: Seat | null = null;
  black: Seat | null = null;
  revision = 0;
  status: BoardSnapshot['status'] = 'waiting';
  result = '*';
  reason = '';
  drawOffer: string | null = null;
  saved = false;
  private positions = new Map<string, number>([[this.positionKey(), 1]]);
  private positionKey() {
    return this.chess.fen().split(' ').slice(0, 4).join(' ');
  }
  sit(seat: Seat, color: 'white' | 'black') {
    if (
      this.status !== 'waiting' ||
      this[color] ||
      this.white?.userId === seat.userId ||
      this.black?.userId === seat.userId
    )
      throw new Error('SEAT_UNAVAILABLE');
    this[color] = seat;
    if (this.white && this.black) {
      this.status = 'active';
      for (const [key, value] of Object.entries({
        White: this.white.name,
        Black: this.black.name,
        Event: 'PixelSpace friendly',
        Date: new Date().toISOString().slice(0, 10).replaceAll('-', '.'),
      }))
        this.chess.setHeader(key, value);
    }
    this.revision++;
  }
  move(sessionId: string, from: Square, to: Square, promotion: PieceSymbol, revision: number) {
    if (this.status !== 'active' || revision !== this.revision) throw new Error('STALE_GAME');
    const seat = this.chess.turn() === 'w' ? this.white : this.black;
    if (seat?.sessionId !== sessionId) throw new Error('NOT_YOUR_TURN');
    this.chess.move({ from, to, promotion });
    this.revision++;
    this.drawOffer = null;
    const key = this.positionKey();
    this.positions.set(key, (this.positions.get(key) ?? 0) + 1);
    if (this.chess.isCheckmate())
      this.finish(this.chess.turn() === 'w' ? '0-1' : '1-0', 'CHECKMATE');
    else if (this.chess.isStalemate()) this.finish('1/2-1/2', 'STALEMATE');
    else if (this.chess.isInsufficientMaterial()) this.finish('1/2-1/2', 'INSUFFICIENT_MATERIAL');
    else if ((this.positions.get(key) ?? 0) >= 5) this.finish('1/2-1/2', 'FIVEFOLD');
    else if (Number(this.chess.fen().split(' ')[4]) >= 150)
      this.finish('1/2-1/2', 'SEVENTY_FIVE_MOVES');
  }
  claimDraw(sessionId: string) {
    const seat = this.chess.turn() === 'w' ? this.white : this.black;
    if (this.status !== 'active' || seat?.sessionId !== sessionId || !this.claimable())
      throw new Error('CANNOT_CLAIM');
    this.finish('1/2-1/2', 'DRAW_CLAIM');
  }
  claimable() {
    return this.chess.isThreefoldRepetition() || this.chess.isDrawByFiftyMoves();
  }
  offerDraw(sessionId: string) {
    if (
      this.status !== 'active' ||
      ![this.white?.sessionId, this.black?.sessionId].includes(sessionId)
    )
      throw new Error('NOT_SEATED');
    if (this.drawOffer && this.drawOffer !== sessionId) this.finish('1/2-1/2', 'AGREEMENT');
    else {
      this.drawOffer = sessionId;
      this.revision++;
    }
  }
  leave(sessionId: string) {
    const color =
      this.white?.sessionId === sessionId
        ? 'white'
        : this.black?.sessionId === sessionId
          ? 'black'
          : null;
    if (!color) return;
    if (this.status === 'active') this.finish(color === 'white' ? '0-1' : '1-0', 'RESIGNATION');
    else if (this.status === 'waiting') {
      this[color] = null;
      this.revision++;
    }
  }
  finish(result: string, reason: string) {
    this.status = 'finished';
    this.result = result;
    this.reason = reason;
    this.chess.setHeader('Result', result);
    this.revision++;
  }
  snapshot(): BoardSnapshot {
    return {
      id: this.id,
      fen: this.chess.fen(),
      pgn: this.chess.pgn(),
      revision: this.revision,
      status: this.status,
      white: this.white,
      black: this.black,
      result: this.result,
      reason: this.reason,
      drawOffer: this.drawOffer,
      claimable: this.claimable(),
      saved: this.saved,
    };
  }
}

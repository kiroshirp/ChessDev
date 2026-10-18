import { describe, it, expect } from 'vitest';
import { ChessTable } from '@pixelspace/chess-core';
import { Chess } from 'chess.js';
import { signTicket, verifyTicket } from '@pixelspace/auth';
function table() {
  const t = new ChessTable();
  t.sit({ sessionId: 'white', userId: 'u1', name: 'White' }, 'white');
  t.sit({ sessionId: 'black', userId: 'u2', name: 'Black' }, 'black');
  return t;
}
describe('authoritative friendly chess', () => {
  it('requires two distinct players and rejects illegal, out-of-turn and duplicate moves', () => {
    const t = table();
    expect(() => t.move('black', 'e7', 'e5', 'q', t.revision)).toThrow('NOT_YOUR_TURN');
    expect(() => t.move('white', 'e2', 'e5', 'q', t.revision)).toThrow();
    const revision = t.revision;
    t.move('white', 'e2', 'e4', 'q', revision);
    expect(() => t.move('white', 'e2', 'e4', 'q', revision)).toThrow('STALE_GAME');
    expect(t.chess.history()).toEqual(['e4']);
  });
  it('recognizes checkmate and rejects further moves', () => {
    const t = table();
    for (const [id, from, to] of [
      ['white', 'f2', 'f3'],
      ['black', 'e7', 'e5'],
      ['white', 'g2', 'g4'],
      ['black', 'd8', 'h4'],
    ] as const)
      t.move(id, from, to, 'q', t.revision);
    expect(t.status).toBe('finished');
    expect(t.result).toBe('0-1');
    expect(t.reason).toBe('CHECKMATE');
    expect(() => t.move('white', 'a2', 'a3', 'q', t.revision)).toThrow();
  });
  it('treats threefold as claimable and fivefold as automatic', () => {
    const t = table();
    const cycle = [
      ['white', 'g1', 'f3'],
      ['black', 'g8', 'f6'],
      ['white', 'f3', 'g1'],
      ['black', 'f6', 'g8'],
    ] as const;
    for (let n = 0; n < 2; n++)
      for (const [id, from, to] of cycle) t.move(id, from, to, 'q', t.revision);
    expect(t.claimable()).toBe(true);
    expect(t.status).toBe('active');
    for (let n = 0; n < 2; n++)
      for (const [id, from, to] of cycle) t.move(id, from, to, 'q', t.revision);
    expect(t.reason).toBe('FIVEFOLD');
  });
  it('supports castling, en passant, underpromotion and stalemate in chess.js', () => {
    const castle = new Chess('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1');
    expect(castle.move('O-O').san).toBe('O-O');
    const ep = new Chess();
    for (const m of ['e4', 'a6', 'e5', 'd5']) ep.move(m);
    expect(ep.move('exd6').isEnPassant()).toBe(true);
    const promotion = new Chess('7k/P7/8/8/8/8/8/7K w - - 0 1');
    expect(promotion.move({ from: 'a7', to: 'a8', promotion: 'n' }).promotion).toBe('n');
    expect(new Chess('7k/5K2/6Q1/8/8/8/8/8 b - - 0 1').isStalemate()).toBe(true);
  });
  it('finishes by resignation and prevents a spectator claiming a seat already in use', () => {
    const t = table();
    expect(() => t.sit({ sessionId: 'other', userId: 'u3', name: 'Other' }, 'white')).toThrow();
    t.leave('white');
    expect(t.result).toBe('0-1');
  });
});
describe('world tickets', () => {
  it('rejects tampering and expiry', async () => {
    const secret = 'unit-test-world-secret-with-at-least-32-characters';
    const ticket = await signTicket(
      {
        userId: crypto.randomUUID(),
        sessionId: crypto.randomUUID(),
        name: 'Alice',
        development: false,
      },
      secret,
    );
    expect((await verifyTicket(ticket, secret)).name).toBe('Alice');
    await expect(verifyTicket(`${ticket}x`, secret)).rejects.toThrow();
    await expect(verifyTicket(ticket, secret, Date.now() + 61000)).rejects.toThrow();
  });
});

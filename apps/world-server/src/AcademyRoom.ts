import { Room, type Client, ServerError } from '@colyseus/core';
import { WorldState, PlayerState } from '@pixelspace/realtime';
import { academyMap, academyObjects, academyZones } from '@pixelspace/map-engine';
import { movePlayer } from '@pixelspace/world-engine';
import { moveIntentSchema } from '@pixelspace/shared';
import { verifyTicket, type Identity } from '@pixelspace/auth';
import { ChessTable } from '@pixelspace/chess-core';
import { z } from 'zod';
const square = z.string().regex(/^[a-h][1-8]$/);
const moveSchema = z
  .object({
    from: square,
    to: square,
    promotion: z.enum(['q', 'r', 'b', 'n']).default('q'),
    revision: z.number().int().nonnegative(),
  })
  .strict();
const ticketNonces = new Map<string, number>();
export interface WorldConfig {
  worldSecret: string;
  internalSecret: string;
  apiUrl: string;
  production: boolean;
}
export class AcademyRoom extends Room<{ state: WorldState }> {
  static config: WorldConfig;
  state = new WorldState();
  maxClients = 24;
  patchRate = 50;
  maxMessagesPerSecond = 60;
  private directions = new Map<string, { x: number; y: number; time: number }>();
  private identities = new Map<string, Identity>();
  private watchers = new Set<string>();
  private table = new ChessTable();
  private saving = false;
  async onAuth(_client: Client, options: unknown) {
    const parsed = z
      .object({ ticket: z.string().max(2048) })
      .passthrough()
      .safeParse(options);
    if (!parsed.success) throw new ServerError(401, 'DISCORD_REQUIRED');
    const identity = await verifyTicket(parsed.data.ticket, AcademyRoom.config.worldSecret);
    if (AcademyRoom.config.production && identity.development)
      throw new ServerError(403, 'DISCORD_REQUIRED');
    for (const [nonce, expiry] of ticketNonces) if (expiry < Date.now()) ticketNonces.delete(nonce);
    if (ticketNonces.has(identity.nonce)) throw new ServerError(401, 'TICKET_REUSED');
    const active = await this.internal('/internal/session', { sessionId: identity.sessionId });
    if (!active.active) throw new ServerError(401, 'SESSION_EXPIRED');
    ticketNonces.set(identity.nonce, identity.expires);
    return identity;
  }
  onCreate() {
    this.onMessage('world:move', (client, data: unknown) => {
      const input = moveIntentSchema.safeParse(data);
      const player = this.state.players.get(client.sessionId);
      if (!input.success || !player || input.data.sequence <= player.sequence) return;
      player.sequence = input.data.sequence;
      this.directions.set(client.sessionId, {
        x: input.data.horizontal,
        y: input.data.vertical,
        time: Date.now(),
      });
    });
    this.onMessage('world:appearance', (client, data: unknown) => {
      if ([0x9f88e5, 0x65ba9c, 0xd3ac62].includes(Number(data))) {
        const p = this.state.players.get(client.sessionId);
        if (p) p.color = Number(data);
      }
    });
    this.onMessage('world:portal', (client, data: unknown) => {
      const zone = academyZones.find((z) => z.id === data);
      const p = this.state.players.get(client.sessionId);
      if (!zone || !p || this.seated(client.sessionId)) return;
      p.x = zone.spawn.x;
      p.y = zone.spawn.y;
      this.directions.delete(client.sessionId);
    });
    this.onMessage('world:interact', (client, data: unknown) => {
      const object = academyObjects.find((o) => o.id === data);
      const p = this.state.players.get(client.sessionId);
      if (!object || !p || Math.hypot(p.x - object.x, p.y - object.y) > object.radius) {
        client.send('activity:error', 'TOO_FAR');
        return;
      }
      this.watchers.add(client.sessionId);
      client.send('activity:open', { activityId: object.activityId, objectId: object.id });
      client.send('chess:state', this.table.snapshot());
    });
    this.onMessage('chess:sit', (client, data: unknown) =>
      this.action(client, () => {
        if (!this.watchers.has(client.sessionId) || !['white', 'black'].includes(String(data)))
          throw new Error('NOT_AT_TABLE');
        const p = this.state.players.get(client.sessionId)!,
          object = academyObjects[0]!;
        if (Math.hypot(p.x - object.x, p.y - object.y) > object.radius) throw new Error('TOO_FAR');
        const identity = this.identities.get(client.sessionId)!;
        this.table.sit(
          { sessionId: client.sessionId, userId: identity.userId, name: identity.name },
          data as 'white' | 'black',
        );
        this.directions.delete(client.sessionId);
      }),
    );
    this.onMessage('chess:move', (client, data: unknown) =>
      this.action(client, () => {
        const move = moveSchema.parse(data);
        this.table.move(
          client.sessionId,
          move.from as 'a1',
          move.to as 'a1',
          move.promotion,
          move.revision,
        );
      }),
    );
    this.onMessage('chess:draw', (client) =>
      this.action(client, () => this.table.offerDraw(client.sessionId)),
    );
    this.onMessage('chess:claim', (client) =>
      this.action(client, () => this.table.claimDraw(client.sessionId)),
    );
    this.onMessage('chess:leave', (client) => {
      this.table.leave(client.sessionId);
      this.watchers.delete(client.sessionId);
      this.publish();
    });
    this.onMessage('chess:new', (client) =>
      this.action(client, () => {
        if (
          this.table.status !== 'finished' ||
          !this.watchers.has(client.sessionId) ||
          !this.table.saved
        )
          throw new Error('TABLE_UNAVAILABLE');
        this.table = new ChessTable();
      }),
    );
    this.setSimulationInterval((delta) => {
      for (const [id, p] of this.state.players) {
        const input = this.directions.get(id);
        const active = p.online && input && Date.now() - input.time < 250 && !this.seated(id);
        const next = active
          ? movePlayer(p, { x: input.x, y: input.y }, delta / 1000, academyMap)
          : p;
        p.moving = next.x !== p.x || next.y !== p.y;
        p.x = next.x;
        p.y = next.y;
      }
    }, 1000 / 30);
    this.clock.setInterval(() => {
      void this.checkSessions();
    }, 30000);
  }
  onJoin(client: Client) {
    const identity = client.auth as Identity;
    if ([...this.identities.values()].some((i) => i.userId === identity.userId))
      throw new ServerError(409, 'ALREADY_CONNECTED');
    this.identities.set(client.sessionId, identity);
    this.state.players.set(
      client.sessionId,
      new PlayerState({
        x: academyMap.spawn.x + (this.clients.length % 3) * 64,
        y: academyMap.spawn.y,
        name: identity.name,
        development: identity.development,
      }),
    );
  }
  async onDrop(client: Client) {
    const p = this.state.players.get(client.sessionId);
    if (p) {
      p.online = false;
      p.moving = false;
    }
    this.directions.delete(client.sessionId);
    try {
      await this.allowReconnection(client, 20);
    } catch {
      /* onLeave releases seat */
    }
  }
  onReconnect(client: Client) {
    const p = this.state.players.get(client.sessionId);
    if (p) p.online = true;
  }
  onLeave(client: Client) {
    this.table.leave(client.sessionId);
    this.watchers.delete(client.sessionId);
    this.state.players.delete(client.sessionId);
    this.identities.delete(client.sessionId);
    this.directions.delete(client.sessionId);
    this.publish();
  }
  private seated(id: string) {
    return (
      this.table.status !== 'finished' &&
      (this.table.white?.sessionId === id || this.table.black?.sessionId === id)
    );
  }
  private action(client: Client, fn: () => void) {
    try {
      fn();
      this.publish();
    } catch (error) {
      client.send('activity:error', error instanceof Error ? error.message : 'INVALID_ACTION');
    }
  }
  private publish() {
    for (const c of this.clients)
      if (this.watchers.has(c.sessionId)) c.send('chess:state', this.table.snapshot());
    void this.persist();
  }
  private async persist() {
    if (this.table.status !== 'finished' || this.table.saved || this.saving) return;
    this.saving = true;
    const table = this.table;
    try {
      await this.internal('/internal/results', {
        id: table.id,
        whiteId: table.white?.userId ?? null,
        blackId: table.black?.userId ?? null,
        pgn: table.chess.pgn(),
        result: table.result,
        reason: table.reason,
      });
      table.saved = true;
      for (const c of this.clients)
        if (this.watchers.has(c.sessionId)) c.send('chess:state', table.snapshot());
    } catch {
      for (const c of this.clients)
        if (this.watchers.has(c.sessionId)) c.send('activity:error', 'SAVE_FAILED');
    } finally {
      this.saving = false;
    }
  }
  private async checkSessions() {
    for (const c of this.clients) {
      const identity = this.identities.get(c.sessionId);
      if (!identity) continue;
      try {
        const state = await this.internal('/internal/session', { sessionId: identity.sessionId });
        if (!state.active) c.leave(4001);
      } catch {
        /* next check retries; no new seats are authorized during an API outage */
      }
    }
    await this.persist();
  }
  private async internal(path: string, body: unknown): Promise<Record<string, unknown>> {
    const response = await fetch(`${AcademyRoom.config.apiUrl}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${AcademyRoom.config.internalSecret}`,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) throw new Error('API_UNAVAILABLE');
    return response.json() as Promise<Record<string, unknown>>;
  }
}

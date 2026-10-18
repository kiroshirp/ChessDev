import { Client, type Room } from '@colyseus/sdk';
import { WorldState } from '@pixelspace/realtime';
import type { BoardSnapshot } from '@pixelspace/chess-core';
export interface RemotePlayer {
  id: string;
  x: number;
  y: number;
  name: string;
  color: number;
  moving: boolean;
  online: boolean;
  development: boolean;
  sequence: number;
}
export class WorldConnection {
  players: RemotePlayer[] = [];
  board: BoardSnapshot | null = null;
  activity: string | null = null;
  error = '';
  status: 'connected' | 'reconnecting' | 'offline' = 'connected';
  private sequence = 0;
  private disposed = false;
  constructor(
    readonly room: Room<unknown, WorldState>,
    private changed: () => void,
  ) {
    const refresh = (state: WorldState) => {
      if (!state?.players) return;
      this.players = Array.from(state.players.entries(), ([id, p]) => ({
        id,
        x: p.x,
        y: p.y,
        name: p.name,
        color: p.color,
        moving: p.moving,
        online: p.online,
        development: p.development,
        sequence: p.sequence,
      }));
      changed();
    };
    room.onStateChange(refresh);
    refresh(room.state);
    room.onMessage<BoardSnapshot>('chess:state', (state) => {
      this.board = state;
      changed();
    });
    room.onMessage<{ activityId: string }>('activity:open', (event) => {
      this.activity = event.activityId;
      this.error = '';
      changed();
    });
    room.onMessage<string>('activity:error', (error) => {
      this.error = error;
      changed();
    });
    room.onDrop(() => {
      this.status = 'reconnecting';
      changed();
    });
    room.onReconnect(() => {
      this.status = 'connected';
      changed();
    });
    room.onLeave(() => {
      this.status = 'offline';
      if (!this.disposed) {
        this.activity = null;
        changed();
      }
    });
    room.onError((_code, message) => {
      this.error = message ?? 'CONNECTION_FAILED';
      changed();
    });
    room.reconnection.minUptime = 0;
    room.reconnection.maxRetries = 10;
    room.reconnection.maxEnqueuedMessages = 0;
  }
  get id() {
    return this.room.sessionId;
  }
  get self() {
    return this.players.find((p) => p.id === this.id);
  }
  move(x: number, y: number) {
    if (this.status === 'connected')
      this.room.send('world:move', { sequence: ++this.sequence, horizontal: x, vertical: y });
  }
  send(type: string, data?: unknown) {
    if (this.status === 'connected') this.room.send(type, data);
  }
  closeActivity() {
    this.send('chess:leave');
    this.activity = null;
    this.error = '';
    this.changed();
  }
  async leave() {
    this.disposed = true;
    await this.room.leave();
  }
}
export async function connectWorld(url: string, ticket: string, changed: () => void) {
  const client = new Client(url);
  return new WorldConnection(
    await client.joinOrCreate<WorldState>('academy', { ticket }, WorldState),
    changed,
  );
}

import { schema, t, type SchemaType } from '@colyseus/schema';
export const PlayerState = schema(
  {
    x: t.number().default(0),
    y: t.number().default(0),
    name: t.string().default(''),
    color: t.number().default(0x9f88e5),
    moving: t.boolean().default(false),
    online: t.boolean().default(true),
    development: t.boolean().default(false),
    sequence: t.number().default(-1),
  },
  'Player',
);
export const WorldState = schema({ players: t.map(PlayerState) }, 'World');
export type WorldState = SchemaType<typeof WorldState>;
export type PlayerState = SchemaType<typeof PlayerState>;

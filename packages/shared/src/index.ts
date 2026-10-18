import { z } from 'zod';

export const spaceDefinitionSchema = z
  .object({
    id: z.string().min(1).max(100),
    type: z.enum(['chess_academy', 'office', 'campus', 'social', 'community', 'custom']),
    name: z.string().min(1).max(120),
    mapId: z.string().min(1),
    capacity: z.number().int().positive().max(1000),
    enabledModules: z.array(z.string().min(1)).max(32),
    accessPolicyId: z.string().min(1),
  })
  .strict();
export type SpaceDefinition = z.infer<typeof spaceDefinitionSchema>;

// Intents, never client-authoritative positions. Transport and identity come in Phase 2.
export const moveIntentSchema = z
  .object({
    sequence: z.number().int().nonnegative(),
    horizontal: z.union([z.literal(-1), z.literal(0), z.literal(1)]),
    vertical: z.union([z.literal(-1), z.literal(0), z.literal(1)]),
  })
  .strict();
export type MoveIntent = z.infer<typeof moveIntentSchema>;
export type ConnectionStatus = 'offline' | 'connecting' | 'connected' | 'reconnecting';

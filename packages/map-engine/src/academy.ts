import type { WorldMap, Rect } from './index';
export interface Zone {
  id: string;
  label: { es: string; en: string };
  bounds: Rect;
  spawn: { x: number; y: number };
  floor: number;
}
export interface InteractiveObject {
  id: string;
  kind: 'activity';
  activityId: string;
  x: number;
  y: number;
  radius: number;
}
export const academyZones: Zone[] = [
  {
    id: 'lobby',
    label: { es: 'Vestíbulo', en: 'Lobby' },
    bounds: { x: 32, y: 576, width: 784, height: 544 },
    spawn: { x: 608, y: 832 },
    floor: 0x725343,
  },
  {
    id: 'classroom',
    label: { es: 'Aula', en: 'Classroom' },
    bounds: { x: 32, y: 64, width: 784, height: 480 },
    spawn: { x: 608, y: 384 },
    floor: 0x5a5961,
  },
  {
    id: 'cafe',
    label: { es: 'Cafetería', en: 'Café' },
    bounds: { x: 848, y: 64, width: 784, height: 480 },
    spawn: { x: 1056, y: 384 },
    floor: 0x665442,
  },
  {
    id: 'playroom',
    label: { es: 'Sala de juego', en: 'Playing room' },
    bounds: { x: 848, y: 576, width: 784, height: 544 },
    spawn: { x: 1216, y: 960 },
    floor: 0x655167,
  },
];
export const academyObjects: InteractiveObject[] = [
  { id: 'table-1', kind: 'activity', activityId: 'chess', x: 1216, y: 848, radius: 160 },
];
export const academyMap: WorldMap = {
  schemaVersion: 1,
  id: 'chess-academy-v1',
  width: 1664,
  height: 1152,
  tileSize: 32,
  spawn: { x: 608, y: 832 },
  obstacles: [
    { x: 0, y: 0, width: 1664, height: 64 },
    { x: 0, y: 0, width: 32, height: 1152 },
    { x: 1632, y: 0, width: 32, height: 1152 },
    { x: 0, y: 1120, width: 1664, height: 32 },
    { x: 816, y: 64, width: 32, height: 320 },
    { x: 816, y: 704, width: 32, height: 416 },
    { x: 32, y: 544, width: 512, height: 32 },
    { x: 672, y: 544, width: 320, height: 32 },
    { x: 1120, y: 544, width: 512, height: 32 },
    { x: 192, y: 128, width: 384, height: 64 },
    { x: 128, y: 272, width: 160, height: 48 },
    { x: 384, y: 272, width: 160, height: 48 },
    { x: 1024, y: 128, width: 384, height: 64 },
    { x: 1376, y: 320, width: 128, height: 64 },
    { x: 1152, y: 800, width: 128, height: 96 },
    { x: 1408, y: 800, width: 128, height: 96 },
    { x: 128, y: 704, width: 256, height: 64 },
    { x: 128, y: 960, width: 64, height: 64 },
    { x: 1504, y: 992, width: 64, height: 64 },
  ],
};

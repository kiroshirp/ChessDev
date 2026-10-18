export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}
export {
  academyMap,
  academyZones,
  academyObjects,
  type Zone,
  type InteractiveObject,
} from './academy';
export interface WorldMap {
  schemaVersion: 1;
  id: string;
  width: number;
  height: number;
  tileSize: number;
  spawn: { x: number; y: number };
  obstacles: readonly Rect[];
}
// Generic training room. Contains no chess concepts or activity logic.
export const foundationMap: WorldMap = {
  schemaVersion: 1,
  id: 'foundation-room-v1',
  width: 960,
  height: 640,
  tileSize: 32,
  spawn: { x: 480, y: 440 },
  obstacles: [
    { x: 0, y: 0, width: 960, height: 64 },
    { x: 0, y: 0, width: 32, height: 640 },
    { x: 928, y: 0, width: 32, height: 640 },
    { x: 0, y: 608, width: 960, height: 32 },
    { x: 128, y: 128, width: 192, height: 64 },
    { x: 640, y: 128, width: 192, height: 64 },
    { x: 384, y: 256, width: 192, height: 96 },
    { x: 64, y: 512, width: 64, height: 64 },
    { x: 832, y: 512, width: 64, height: 64 },
  ],
};

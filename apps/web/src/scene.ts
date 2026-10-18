import Phaser from 'phaser';
import { academyMap as map, academyZones, academyObjects } from '@pixelspace/map-engine';
import type { Position } from '@pixelspace/world-engine';
import type { WorldConnection, RemotePlayer } from './network';
export interface SceneControls {
  zoom: number;
  input: Position;
  connection: WorldConnection | null;
  locale: 'es' | 'en';
}
export function createWorld(
  parent: HTMLElement,
  controls: SceneControls,
  label: string,
  report: (position: Position) => void,
  releaseFocus: () => void,
) {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  class AcademyScene extends Phaser.Scene {
    private keys!: Record<string, Phaser.Input.Keyboard.Key>;
    private avatars = new Map<
      string,
      {
        container: Phaser.GameObjects.Container;
        shirt: Phaser.GameObjects.Rectangle;
        legs: Phaser.GameObjects.Rectangle[];
        label: Phaser.GameObjects.Text;
      }
    >();
    private lastInput = 0;
    private lastDirection = '';
    private lastReport = 0;
    private labels: Phaser.GameObjects.Text[] = [];
    private following = '';
    create() {
      const g = this.add.graphics();
      g.fillStyle(0x302c3f);
      g.fillRect(0, 0, map.width, map.height);
      for (const zone of academyZones) {
        for (let y = zone.bounds.y; y < zone.bounds.y + zone.bounds.height; y += 32)
          for (let x = zone.bounds.x; x < zone.bounds.x + zone.bounds.width; x += 64) {
            g.fillStyle(zone.floor + ((x / 64 + y / 32) % 3 === 0 ? 0x080604 : 0));
            g.fillRect(x, y, 63, 31);
            g.fillStyle(0xb89a73, 0.14);
            g.fillRect(x + 5, y + 7, 45, 1);
          }
        g.fillStyle(0x29263d, 0.65);
        g.fillRoundedRect(zone.bounds.x + 110, zone.bounds.y + 20, 400, 54, 7);
        this.labels.push(
          this.add
            .text(zone.bounds.x + 310, zone.bounds.y + 47, zone.label[controls.locale], {
              fontFamily: 'system-ui',
              fontSize: '23px',
              color: '#eadbb7',
              fontStyle: 'bold',
            })
            .setOrigin(0.5),
        );
      }
      // Walkable carpets and the central connecting corridor.
      for (const [x, y, w, h] of [
        [448, 704, 256, 320],
        [1056, 736, 480, 304],
        [544, 448, 576, 224],
      ]) {
        g.fillStyle(0x494060);
        g.fillRect(x!, y!, w!, h!);
        g.lineStyle(3, 0xa88b61);
        g.strokeRect(x! + 7, y! + 7, w! - 14, h! - 14);
      }
      for (const [index, r] of map.obstacles.entries()) {
        if (index < 9) {
          g.fillStyle(0x37384a);
          g.fillRect(r.x, r.y, r.width, r.height);
          g.fillStyle(0x61566a);
          g.fillRect(r.x, r.y, r.width, 5);
          continue;
        }
        g.fillStyle(0x211d2d, 0.5);
        g.fillRect(r.x + 7, r.y + 10, r.width, r.height);
        g.fillStyle(0x584033);
        g.fillRect(r.x + 9, r.y + 5, r.width - 18, r.height);
        g.fillStyle(0xa27b50);
        g.fillRect(r.x, r.y, r.width, r.height - 8);
        g.fillStyle(0xd2ac72);
        g.fillRect(r.x + 4, r.y + 4, r.width - 8, 4);
        if (index === 9) {
          g.fillStyle(0x274e48);
          g.fillRect(r.x + 12, r.y + 10, r.width - 24, r.height - 26);
          g.lineStyle(2, 0xd4cba4);
          g.strokeRect(r.x + 150, r.y + 14, 48, 36);
        }
        if (index === 12) {
          for (let i = 0; i < 5; i++) {
            g.fillStyle(0xd6b989);
            g.fillRect(r.x + 25 + i * 64, r.y + 18, 18, 22);
            g.fillStyle(0x547f6f);
            g.fillRect(r.x + 25 + i * 64, r.y + 15, 18, 6);
          }
        }
        if (index === 14 || index === 15) {
          for (let row = 0; row < 8; row++)
            for (let col = 0; col < 8; col++) {
              g.fillStyle((row + col) % 2 === 0 ? 0xe0cca1 : 0x536b5c);
              g.fillRect(r.x + 32 + col * 8, r.y + 10 + row * 8, 8, 8);
            }
          g.fillStyle(0x312e3d);
          g.fillRect(r.x + 8, r.y + 26, 16, 32);
          g.fillRect(r.x + r.width - 24, r.y + 26, 16, 32);
        }
        if (index >= 17) {
          g.fillStyle(0x365e51);
          g.fillRect(r.x - 4, r.y, r.width + 8, 32);
          g.fillStyle(0x6b9a75);
          g.fillRect(r.x + 12, r.y - 12, r.width - 20, 26);
        }
      }
      for (const x of [112, 448, 1040, 1408]) {
        g.fillStyle(0xa58a61);
        g.fillRect(x, 10, 120, 42);
        g.fillStyle(0x477186);
        g.fillRect(x + 5, 15, 110, 31);
        g.fillStyle(0x9db1aa);
        g.fillRect(x + 12, 20, 35, 18);
        g.fillStyle(0xa58a61);
        g.fillRect(x + 58, 15, 4, 31);
      }
      this.add
        .text(1216, 925, '01', {
          fontFamily: 'monospace',
          fontSize: '16px',
          color: '#e8d2a6',
          backgroundColor: '#322b43',
          padding: { x: 10, y: 5 },
        })
        .setOrigin(0.5);
      this.keys = this.input.keyboard!.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,E', false) as Record<
        string,
        Phaser.Input.Keyboard.Key
      >;
      this.input.keyboard!.on('keydown', (event: KeyboardEvent) => {
        if (document.activeElement !== this.game.canvas) return;
        if (event.key.startsWith('Arrow')) event.preventDefault();
        if (event.key === 'Escape') releaseFocus();
        if (event.key.toLowerCase() === 'e' && !event.repeat)
          controls.connection?.send('world:interact', academyObjects[0]!.id);
      });
      const canvas = this.game.canvas;
      canvas.tabIndex = 0;
      canvas.setAttribute('role', 'img');
      canvas.setAttribute('aria-label', label);
      canvas.addEventListener('pointerdown', () => canvas.focus());
      this.cameras.main.setBounds(0, 0, map.width, map.height);
    }
    private makeAvatar(p: RemotePlayer) {
      const container = this.add.container(p.x, p.y),
        shadow = this.add.ellipse(0, 7, 24, 8, 0x171922, 0.4),
        legs = [-6, 2].map((x) => this.add.rectangle(x, 0, 6, 9, 0x292d49).setOrigin(0)),
        shirt = this.add.rectangle(-10, -18, 20, 18, p.color).setOrigin(0),
        face = this.add.rectangle(-8, -33, 16, 16, 0xe7b58c).setOrigin(0),
        hair = this.add.rectangle(-9, -36, 18, 8, 0x332b3c).setOrigin(0),
        eyes = this.add.rectangle(3, -27, 2, 3, 0x302c37).setOrigin(0),
        name = this.add
          .text(0, -52, p.name, {
            fontFamily: 'system-ui',
            fontSize: '13px',
            color: '#ffffff',
            backgroundColor: '#171a2bc9',
            padding: { x: 6, y: 3 },
          })
          .setOrigin(0.5);
      container.add([shadow, ...legs, shirt, face, hair, eyes, name]);
      return { container, shirt, legs, label: name };
    }
    update(time: number, delta: number) {
      const connection = controls.connection;
      if (!connection) return;
      const ids = new Set(connection.players.map((p) => p.id));
      for (const [id, a] of this.avatars)
        if (!ids.has(id)) {
          a.container.destroy();
          this.avatars.delete(id);
        }
      for (const p of connection.players) {
        let a = this.avatars.get(p.id);
        if (!a) {
          a = this.makeAvatar(p);
          this.avatars.set(p.id, a);
        }
        const distance = Math.hypot(a.container.x - p.x, a.container.y - p.y),
          lerp = distance > 128 ? 1 : Math.min(1, delta / 65);
        a.container.x = Phaser.Math.Linear(a.container.x, p.x, lerp);
        a.container.y = Phaser.Math.Linear(a.container.y, p.y, lerp);
        a.container.setDepth(p.y);
        a.container.setAlpha(p.online ? 1 : 0.45);
        a.shirt.setFillStyle(p.color);
        a.label.setText(p.name);
        a.legs.forEach((leg, i) =>
          leg.setY(
            p.moving && !reduced.matches ? Math.round(Math.sin(time / 90 + i * Math.PI) * 2) : 0,
          ),
        );
        if (p.id === connection.id && this.following !== p.id) {
          this.cameras.main.startFollow(a.container, true, 1, 1);
          this.following = p.id;
        }
      }
      this.cameras.main.setZoom(controls.zoom);
      this.labels.forEach((label, i) => label.setText(academyZones[i]!.label[controls.locale]));
      let input = controls.input;
      if (document.activeElement === this.game.canvas)
        input = {
          x:
            Number(this.keys.D?.isDown || this.keys.RIGHT?.isDown) -
            Number(this.keys.A?.isDown || this.keys.LEFT?.isDown),
          y:
            Number(this.keys.S?.isDown || this.keys.DOWN?.isDown) -
            Number(this.keys.W?.isDown || this.keys.UP?.isDown),
        };
      const direction = `${input.x},${input.y}`;
      if (time - this.lastInput >= 50 || direction !== this.lastDirection) {
        connection.move(input.x, input.y);
        this.lastInput = time;
        this.lastDirection = direction;
      }
      if (connection.self && time - this.lastReport > 100) {
        report({ x: connection.self.x, y: connection.self.y });
        this.lastReport = time;
      }
    }
  }
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: 960,
    height: 640,
    backgroundColor: '#242735',
    pixelArt: true,
    roundPixels: true,
    scene: AcademyScene,
    banner: false,
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    input: { keyboard: true },
    audio: { noAudio: true },
  });
}

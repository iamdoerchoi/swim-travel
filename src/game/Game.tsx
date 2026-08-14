import { useEffect, useRef } from 'react';
import { playCollect, playHit } from './sound';

export interface GameResult {
  distanceM: number;
  itemsCollected: number;
  score: number;
}

interface GameProps {
  onGameOver: (result: GameResult) => void;
}

const GRAVITY = 1400;
const SWIM_ACCEL = -2400;
const MAX_FALL_SPEED = 480;
const MAX_RISE_SPEED = -420;
const BASE_SCROLL_SPEED = 140;
const MAX_SCROLL_SPEED = 320;
const SPEED_RAMP_TIME = 40;
const OBSTACLE_GAP = 230;
const ITEM_GAP = 170;
const PLAYER_X = 70;
const PLAYER_RADIUS = 20;

const OBSTACLE_EMOJIS = ['🪼', '⛱️', '🦈'];
const ITEM_EMOJIS = ['🍦', '🐚', '🍉'];

interface Obstacle {
  x: number;
  y: number;
  radius: number;
  emoji: string;
}

interface Item {
  x: number;
  y: number;
  radius: number;
  emoji: string;
  collected: boolean;
}

export function Game({ onGameOver }: GameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const holdingRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const resize = () => {
      const rect = canvas.parentElement!.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    let playerY = canvas.clientHeight / 2;
    let playerVY = 0;
    let elapsed = 0;
    let distance = 0;
    let itemsCollected = 0;
    let distanceSinceObstacle = 0;
    let distanceSinceItem = 0;
    let obstacles: Obstacle[] = [];
    let items: Item[] = [];
    let ended = false;
    let lastTime = performance.now();
    let rafId = 0;

    const spawnObstacle = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      const emoji =
        OBSTACLE_EMOJIS[Math.floor(Math.random() * OBSTACLE_EMOJIS.length)];
      const y = 40 + Math.random() * (h - 80);
      obstacles.push({ x: w + 40, y, radius: 22, emoji });
    };

    const spawnItem = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      const emoji =
        ITEM_EMOJIS[Math.floor(Math.random() * ITEM_EMOJIS.length)];
      const y = 30 + Math.random() * (h - 60);
      items.push({ x: w + 40, y, radius: 16, emoji, collected: false });
    };

    const loop = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.05);
      lastTime = time;
      elapsed += dt;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;

      const speedProgress = Math.min(elapsed / SPEED_RAMP_TIME, 1);
      const scrollSpeed =
        BASE_SCROLL_SPEED +
        speedProgress * (MAX_SCROLL_SPEED - BASE_SCROLL_SPEED);

      playerVY += (holdingRef.current ? SWIM_ACCEL : GRAVITY) * dt;
      playerVY = Math.max(MAX_RISE_SPEED, Math.min(MAX_FALL_SPEED, playerVY));
      playerY += playerVY * dt;
      playerY = Math.max(PLAYER_RADIUS, Math.min(height - PLAYER_RADIUS, playerY));

      const scrollDelta = scrollSpeed * dt;
      distance += scrollDelta;
      distanceSinceObstacle += scrollDelta;
      distanceSinceItem += scrollDelta;

      if (distanceSinceObstacle > OBSTACLE_GAP) {
        distanceSinceObstacle = 0;
        spawnObstacle();
      }
      if (distanceSinceItem > ITEM_GAP) {
        distanceSinceItem = 0;
        if (Math.random() < 0.7) spawnItem();
      }

      for (const o of obstacles) o.x -= scrollDelta;
      for (const it of items) it.x -= scrollDelta;
      obstacles = obstacles.filter((o) => o.x > -60);
      items = items.filter((it) => it.x > -60 && !it.collected);

      for (const o of obstacles) {
        const dx = o.x - PLAYER_X;
        const dy = o.y - playerY;
        if (Math.hypot(dx, dy) < o.radius + PLAYER_RADIUS - 8) {
          ended = true;
          break;
        }
      }
      for (const it of items) {
        if (it.collected) continue;
        const dx = it.x - PLAYER_X;
        const dy = it.y - playerY;
        if (Math.hypot(dx, dy) < it.radius + PLAYER_RADIUS - 4) {
          it.collected = true;
          itemsCollected += 1;
          playCollect();
        }
      }

      ctx.clearRect(0, 0, width, height);
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, '#7fd8ff');
      gradient.addColorStop(1, '#0a7ea4');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = '28px sans-serif';
      for (const o of obstacles) ctx.fillText(o.emoji, o.x, o.y);
      for (const it of items) {
        if (!it.collected) ctx.fillText(it.emoji, it.x, it.y);
      }

      ctx.font = '32px sans-serif';
      ctx.fillText('🏊', PLAYER_X, playerY);

      ctx.textAlign = 'left';
      ctx.font = '16px sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(`${Math.floor(distance / 10)}m`, 16, 28);
      ctx.fillText(`🍦 x${itemsCollected}`, 16, 52);

      if (ended) {
        playHit();
        onGameOver({
          distanceM: Math.floor(distance / 10),
          itemsCollected,
          score: Math.floor(distance / 10) + itemsCollected * 10,
        });
        return;
      }

      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);

    const handleDown = () => {
      holdingRef.current = true;
    };
    const handleUp = () => {
      holdingRef.current = false;
    };
    canvas.addEventListener('pointerdown', handleDown);
    window.addEventListener('pointerup', handleUp);
    canvas.addEventListener('pointercancel', handleUp);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('pointerdown', handleDown);
      window.removeEventListener('pointerup', handleUp);
      canvas.removeEventListener('pointercancel', handleUp);
    };
  }, [onGameOver]);

  return (
    <div className="game-viewport">
      <canvas ref={canvasRef} className="game-canvas" />
    </div>
  );
}

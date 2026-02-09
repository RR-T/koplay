import { useRef, useEffect } from 'react';
import { drawScene, drawGameOver, animateThrow } from './gorillasCanvas.js';

export default function GorillasTV({ gameState, players }) {
  const canvasRef = useRef(null);
  const lastThrowIdRef = useRef(0);
  const animatingRef = useRef(false);
  const pendingRef = useRef({ gameState, players });

  useEffect(() => {
    pendingRef.current = { gameState, players };

    if (animatingRef.current) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx || !gameState?.buildings) return;

    const throwData = gameState.lastThrow;

    if (throwData && throwData.throwId > lastThrowIdRef.current) {
      lastThrowIdRef.current = throwData.throwId;
      animatingRef.current = true;

      const snapshotState = { ...gameState };

      animateThrow(ctx, throwData, snapshotState, players, () => {
        animatingRef.current = false;
        const { gameState: gs, players: pl } = pendingRef.current;
        drawScene(ctx, gs, pl);
        if (gs.phase === 'gameOver') {
          drawGameOver(ctx, gs, pl);
        }
      });
    } else {
      drawScene(ctx, gameState, players);
      if (gameState.phase === 'gameOver') {
        drawGameOver(ctx, gameState, players);
      }
    }
  }, [gameState, players]);

  return (
    <canvas
      ref={canvasRef}
      width={1280}
      height={720}
      className="max-w-full max-h-[80vh] rounded-lg"
    />
  );
}

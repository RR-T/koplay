import { useRef, useEffect } from 'react';

const COLORS = ['#e94560', '#4ecdc4', '#ffc048', '#4a9eff', '#ff6b6b', '#a855f7'];

export default function ConfettiCanvas({ count = 120, className = '' }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    canvas.width = canvas.parentElement.offsetWidth;
    canvas.height = canvas.parentElement.offsetHeight;

    const pieces = [];
    for (let i = 0; i < count; i++) {
      pieces.push({
        x: Math.random() * canvas.width,
        y: Math.random() * -canvas.height,
        w: Math.random() * 8 + 4,
        h: Math.random() * 6 + 3,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        vx: (Math.random() - 0.5) * 3,
        vy: Math.random() * 3 + 2,
        rot: Math.random() * Math.PI * 2,
        rv: (Math.random() - 0.5) * 0.15,
      });
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;

      for (const p of pieces) {
        p.x += p.vx;
        p.vy += 0.04;
        p.y += p.vy;
        p.rot += p.rv;

        if (p.y < canvas.height + 20) alive = true;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }

      if (alive) {
        animRef.current = requestAnimationFrame(draw);
      }
    }

    animRef.current = requestAnimationFrame(draw);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [count]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 pointer-events-none ${className}`}
    />
  );
}

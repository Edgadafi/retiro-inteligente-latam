const COLORS = ["#22c55e", "#15803d", "#86efac", "#f0fdf4", "#4ade80"];

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
  spin: number;
  life: number;
}

/** Confetti breve sin dependencias — ideal para el pitch del hackathon */
export function burstConfetti(durationMs = 2400): void {
  const canvas = document.createElement("canvas");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  canvas.style.cssText =
    "position:fixed;inset:0;pointer-events:none;z-index:9998;width:100%;height:100%";
  document.body.appendChild(canvas);

  const context = canvas.getContext("2d");
  if (!context) {
    canvas.remove();
    return;
  }
  const ctx: CanvasRenderingContext2D = context;

  const originX = window.innerWidth / 2;
  const originY = window.innerHeight * 0.55;
  const particles: Particle[] = Array.from({ length: 56 }, () => ({
    x: originX + (Math.random() - 0.5) * 120,
    y: originY,
    vx: (Math.random() - 0.5) * 9,
    vy: -(Math.random() * 7 + 4),
    size: Math.random() * 6 + 3,
    color: COLORS[Math.floor(Math.random() * COLORS.length)]!,
    rotation: Math.random() * Math.PI,
    spin: (Math.random() - 0.5) * 0.25,
    life: 1,
  }));

  const start = performance.now();

  function frame(now: number) {
    const elapsed = now - start;
    if (elapsed > durationMs) {
      canvas.remove();
      return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const p of particles) {
      p.vy += 0.18;
      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.spin;
      p.life = Math.max(0, 1 - elapsed / durationMs);

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      ctx.restore();
    }

    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}

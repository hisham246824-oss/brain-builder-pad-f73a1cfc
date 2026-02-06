import { useEffect, useRef } from 'react';

export function ChatBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let particles: Array<{
      x: number; y: number;
      vx: number; vy: number;
      size: number; opacity: number;
      type: 'dot' | 'line' | 'bracket';
      char?: string;
    }> = [];

    const codeChars = ['{ }', '< >', '( )', '[ ]', '//', '##', '**', '→', '⟨⟩', '∴', '≡', 'λ', 'Σ', '∫', 'π'];

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      initParticles();
    };

    const initParticles = () => {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      const count = Math.floor((w * h) / 18000);
      particles = [];

      for (let i = 0; i < count; i++) {
        const type = Math.random() > 0.6 ? 'bracket' : 'dot';
        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          size: type === 'bracket' ? 10 + Math.random() * 4 : 1.5 + Math.random() * 2,
          opacity: 0.03 + Math.random() * 0.06,
          type,
          char: type === 'bracket' ? codeChars[Math.floor(Math.random() * codeChars.length)] : undefined,
        });
      }
    };

    const isDark = () => document.documentElement.classList.contains('dark');

    const draw = () => {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      ctx.clearRect(0, 0, w, h);

      const dark = isDark();
      const baseColor = dark ? '175, 60%, 45%' : '175, 60%, 35%';

      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;

        if (p.type === 'bracket' && p.char) {
          ctx.font = `${p.size}px 'DM Sans', monospace`;
          ctx.fillStyle = `hsla(${baseColor}, ${p.opacity})`;
          ctx.fillText(p.char, p.x, p.y);
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(${baseColor}, ${p.opacity})`;
          ctx.fill();
        }
      });

      // Draw subtle connections between nearby dots
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `hsla(${baseColor}, ${0.02 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      animationId = requestAnimationFrame(draw);
    };

    resize();
    draw();
    window.addEventListener('resize', resize);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ opacity: 0.8 }}
    />
  );
}

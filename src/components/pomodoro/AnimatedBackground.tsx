import { useRef, useEffect } from 'react';

interface AnimatedBackgroundProps {
  color: string;
}

export function AnimatedBackground({ color }: AnimatedBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (el) {
      el.style.setProperty('--orb-color', color);
    }
  }, [color]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 -z-10 overflow-hidden pointer-events-none"
      style={{ contain: 'strict' }}
    >
      {/* Base radial glow */}
      <div
        className="absolute inset-0 transition-[background] duration-1000 ease-in-out"
        style={{
          background: `radial-gradient(ellipse at 50% 50%, ${color}20 0%, transparent 70%)`,
        }}
      />
      {/* CSS-animated orbs using GPU-only transforms */}
      <div
        className="absolute rounded-full blur-2xl orb-1"
        style={{
          width: 500, height: 500,
          left: '5%', top: '10%',
          opacity: 0.15,
          backgroundColor: color,
          willChange: 'transform',
        }}
      />
      <div
        className="absolute rounded-full blur-2xl orb-2"
        style={{
          width: 400, height: 400,
          right: '10%', bottom: '15%',
          opacity: 0.12,
          backgroundColor: color,
          willChange: 'transform',
        }}
      />
      <div
        className="absolute rounded-full blur-2xl orb-3"
        style={{
          width: 350, height: 350,
          left: '35%', top: '55%',
          opacity: 0.1,
          backgroundColor: color,
          willChange: 'transform',
        }}
      />
    </div>
  );
}

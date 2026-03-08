import { motion } from 'framer-motion';
import { useMemo } from 'react';

interface AnimatedBackgroundProps {
  color: string;
}

export function AnimatedBackground({ color }: AnimatedBackgroundProps) {
  // Memoize orb configs to prevent recreation on each render
  const orbs = useMemo(() => [
    {
      size: 'w-[500px] h-[500px]',
      opacity: 0.15,
      position: { left: '5%', top: '10%' },
      animation: {
        x: [0, 80, 0],
        y: [0, -40, 0],
        scale: [1, 1.15, 1],
      },
      duration: 20,
    },
    {
      size: 'w-[400px] h-[400px]',
      opacity: 0.12,
      position: { right: '10%', bottom: '15%' },
      animation: {
        x: [0, -60, 0],
        y: [0, 50, 0],
        scale: [1.1, 0.95, 1.1],
      },
      duration: 18,
    },
    {
      size: 'w-[350px] h-[350px]',
      opacity: 0.1,
      position: { left: '35%', top: '55%' },
      animation: {
        x: [0, 40, 0],
        y: [0, 60, 0],
        scale: [1, 1.2, 1],
      },
      duration: 22,
    },
    {
      size: 'w-[300px] h-[300px]',
      opacity: 0.08,
      position: { right: '25%', top: '20%' },
      animation: {
        x: [0, -30, 0],
        y: [0, -30, 0],
        scale: [0.95, 1.1, 0.95],
      },
      duration: 25,
    },
  ], []);

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none contain-paint">
      {/* Base gradient that follows the color */}
      <motion.div
        className="absolute inset-0"
        animate={{
          background: `radial-gradient(ellipse at 50% 50%, ${color}20 0%, transparent 70%)`,
        }}
        transition={{ duration: 1.5, ease: 'easeInOut' }}
      />
      
      {/* Floating orbs */}
      {orbs.map((orb, index) => (
        <motion.div
          key={index}
          className={`absolute ${orb.size} rounded-full blur-2xl gpu-accelerated will-change-transform`}
          style={{ 
            ...orb.position,
            opacity: orb.opacity,
          }}
          animate={{
            ...orb.animation,
            backgroundColor: color,
          }}
          transition={{
            backgroundColor: { duration: 1.5, ease: 'easeInOut' },
            x: { duration: orb.duration, repeat: Infinity, ease: 'easeInOut' },
            y: { duration: orb.duration, repeat: Infinity, ease: 'easeInOut' },
            scale: { duration: orb.duration, repeat: Infinity, ease: 'easeInOut' },
          }}
        />
      ))}
    </div>
  );
}

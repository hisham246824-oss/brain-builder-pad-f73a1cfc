import { motion } from 'framer-motion';

interface AnimatedBackgroundProps {
  color: string;
}

export function AnimatedBackground({ color }: AnimatedBackgroundProps) {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Base gradient */}
      <motion.div
        className="absolute inset-0 transition-colors duration-1000"
        style={{
          background: `radial-gradient(ellipse at 50% 50%, ${color}15 0%, transparent 70%)`,
        }}
      />
      
      {/* Floating orbs */}
      <motion.div
        className="absolute w-96 h-96 rounded-full blur-3xl opacity-20"
        style={{ backgroundColor: color }}
        animate={{
          x: [0, 100, 0],
          y: [0, -50, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        initial={{ left: '10%', top: '20%' }}
      />
      
      <motion.div
        className="absolute w-80 h-80 rounded-full blur-3xl opacity-15"
        style={{ backgroundColor: color }}
        animate={{
          x: [0, -80, 0],
          y: [0, 60, 0],
          scale: [1.1, 0.9, 1.1],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        initial={{ right: '15%', bottom: '25%' }}
      />
      
      <motion.div
        className="absolute w-64 h-64 rounded-full blur-3xl opacity-10"
        style={{ backgroundColor: color }}
        animate={{
          x: [0, 50, 0],
          y: [0, 80, 0],
          scale: [1, 1.3, 1],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        initial={{ left: '40%', top: '60%' }}
      />
    </div>
  );
}

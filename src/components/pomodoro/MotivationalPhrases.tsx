import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const PHRASES = [
  "Stay focused, success is built one moment at a time.",
  "Your dedication today shapes your tomorrow.",
  "Small steps lead to big achievements.",
  "Embrace the process, trust the journey.",
];

export function MotivationalPhrases() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % PHRASES.length);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-12 flex items-center justify-center overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.p
          key={currentIndex}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.4, ease: 'easeInOut' }}
          className="text-sm text-muted-foreground text-center italic px-4"
        >
          "{PHRASES[currentIndex]}"
        </motion.p>
      </AnimatePresence>
    </div>
  );
}

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
          initial={{ opacity: 0, y: 15, filter: 'blur(4px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: -15, filter: 'blur(4px)' }}
          transition={{ 
            duration: 0.5, 
            ease: [0.4, 0, 0.2, 1]
          }}
          className="text-sm text-muted-foreground text-center italic px-4"
        >
          "{PHRASES[currentIndex]}"
        </motion.p>
      </AnimatePresence>
    </div>
  );
}

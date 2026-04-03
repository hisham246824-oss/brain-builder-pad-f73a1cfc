import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';

export function MotivationalPhrases() {
  const { t } = useLanguage();
  const [currentIndex, setCurrentIndex] = useState(0);

  const phrases = [
    t('motivational1'),
    t('motivational2'),
    t('motivational3'),
    t('motivational4'),
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % phrases.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [phrases.length]);

  return (
    <div className="h-12 flex items-center justify-center overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.p
          key={currentIndex}
          initial={{ opacity: 0, y: 15, filter: 'blur(4px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: -15, filter: 'blur(4px)' }}
          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
          className="text-sm text-muted-foreground text-center italic px-4"
        >
          "{phrases[currentIndex]}"
        </motion.p>
      </AnimatePresence>
    </div>
  );
}
